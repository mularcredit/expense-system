import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            async authorize(credentials) {
                console.log("Authorize attempt for:", credentials?.email);
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data

                    // Fetch user with Custom Role and Permissions
                    const user = await prisma.user.findUnique({
                        where: { email },
                        include: {
                            customRole: {
                                include: {
                                    permissions: {
                                        include: {
                                            permission: true
                                        }
                                    }
                                }
                            }
                        }
                    })

                    if (!user) {
                        console.log("User not found:", email);
                        return null
                    }

                    if (user && (user.accountStatus === 'PENDING' || !user.isActive)) {
                        console.log("User account pending or inactive:", email);
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password)
                    if (passwordsMatch) {
                        console.log("Password match for:", email);

                        // Default permissions based on standard roles (Legacy Support)
                        // This ensures that even without a Custom Role, users get some permissions mapped
                        let permissions: string[] = [];

                        // 1. Add Custom Role Permissions
                        if (user.customRole) {
                            permissions = user.customRole.permissions.map(rp =>
                                `${rp.permission.resource}.${rp.permission.action}`
                            );
                        } else {
                            // 2. Fallback to Legacy Roles (mirroring permissions.ts logic)
                            switch (user.role) {
                                case 'SYSTEM_ADMIN':
                                    permissions = ['*']; // Wildcard for System Admin
                                    break;
                                case 'FINANCE_APPROVER':
                                    permissions = ['EXPENSES.VIEW_ALL', 'EXPENSES.APPROVE', 'INVOICES.VIEW_ALL', 'INVOICES.APPROVE', 'PAYMENTS.AUTHORIZE'];
                                    break;
                                case 'MANAGER':
                                    permissions = ['EXPENSES.VIEW_TEAM', 'EXPENSES.APPROVE', 'REQUISITIONS.VIEW_TEAM', 'REQUISITIONS.APPROVE'];
                                    break;
                                case 'EMPLOYEE':
                                    permissions = ['EXPENSES.VIEW_OWN', 'EXPENSES.CREATE'];
                                    break;
                            }
                        }

                        return {
                            ...user,
                            permissions
                        };
                    }
                    console.log("Password mismatch for:", email);
                } else {
                    console.log("Invalid credentials format:", parsedCredentials.error.format());
                }

                return null
            },
        }),
    ],
    secret: process.env.AUTH_SECRET,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
                token.permissions = (user as any).permissions || [];
                // Also store custom role ID if needed
                token.customRoleId = (user as any).customRoleId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
                (session.user as any).permissions = token.permissions || [];
                (session.user as any).customRoleId = token.customRoleId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    trustHost: true,
})
