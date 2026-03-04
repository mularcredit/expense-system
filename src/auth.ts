import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Centralised legacy role → permissions map (used in both authorize and session callbacks)
const LEGACY_PERMISSIONS: Record<string, string[]> = {
    'SYSTEM_ADMIN': ['*'],
    'FINANCE_APPROVER': [
        'EXPENSES.VIEW_ALL', 'EXPENSES.APPROVE',
        'INVOICES.VIEW_ALL', 'INVOICES.VIEW', 'INVOICES.APPROVE',
        'PAYMENTS.AUTHORIZE',
        'ACCOUNTING.VIEW', 'LEDGER.VIEW', 'REPORTS.VIEW',
        'APPROVALS.VIEW', 'REQUISITIONS.APPROVE',
        'WALLET.VIEW', 'FINANCE.VIEW', 'BUDGETS.VIEW',
        'FORECASTING.VIEW', 'AUDIT.VIEW', 'ANALYTICS.VIEW',
        'VENDORS.VIEW', 'CONTRACTS.VIEW', 'ASSETS.VIEW',
        'BRANCHES.VIEW', 'REGIONS.VIEW',
    ],
    'FINANCE_TEAM': [
        'EXPENSES.VIEW_ALL',
        'INVOICES.VIEW_ALL', 'INVOICES.VIEW', 'INVOICES.CREATE',
        'PAYMENTS.CREATE_BATCH',
        'ACCOUNTING.VIEW', 'LEDGER.VIEW', 'REPORTS.VIEW',
        'APPROVALS.VIEW', 'REQUISITIONS.APPROVE',
        'WALLET.VIEW', 'FINANCE.VIEW', 'BUDGETS.VIEW',
        'FORECASTING.VIEW', 'AUDIT.VIEW', 'ANALYTICS.VIEW',
        'VENDORS.VIEW', 'CONTRACTS.VIEW', 'ASSETS.VIEW',
        'SALES.MANAGE',
    ],
    'MANAGER': [
        'EXPENSES.VIEW_TEAM', 'EXPENSES.APPROVE',
        'INVOICES.VIEW', 'INVOICES.VIEW_ALL',
        'REQUISITIONS.VIEW_TEAM', 'REQUISITIONS.APPROVE',
        'APPROVALS.VIEW',
        'WALLET.VIEW', 'BUDGETS.VIEW', 'AUDIT.VIEW',
        'VENDORS.VIEW', 'CONTRACTS.VIEW', 'ASSETS.VIEW',
    ],
    'REGIONAL_MANAGER': [
        'REQUISITIONS.VIEW_BRANCH', 'REQUISITIONS.APPROVE',
        'APPROVALS.VIEW',
        'BRANCHES.VIEW', 'REGIONS.VIEW',
        'BRANCH_WALLET.VIEW',
        'ANALYTICS.VIEW', 'REPORTS.VIEW',
        'EXPENSES.VIEW_TEAM',
    ],
    'TEAM_LEADER': [
        'REQUISITIONS.CREATE', 'REQUISITIONS.VIEW_OWN',
        'EXPENSES.VIEW_OWN', 'EXPENSES.CREATE',
        'BRANCH_WALLET.VIEW', 'BRANCH_WALLET.DISBURSE',
    ],
    'EMPLOYEE': [
        'EXPENSES.VIEW_OWN', 'EXPENSES.CREATE',
        'REQUISITIONS.VIEW_OWN', 'REQUISITIONS.CREATE',
    ],
};

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

                        let permissions: string[] = [];

                        if (user.customRole) {
                            // Custom role permissions take priority
                            permissions = user.customRole.permissions.map(rp =>
                                `${rp.permission.resource}.${rp.permission.action}`
                            );
                        } else {
                            // Fallback to legacy role-based permissions
                            permissions = LEGACY_PERMISSIONS[user.role] || [];
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
                token.customRoleId = (user as any).customRoleId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
                (session.user as any).customRoleId = token.customRoleId;

                // Re-fetch permissions live from DB so admin role changes apply immediately
                // without requiring the user to log out and back in
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        include: {
                            customRole: {
                                include: {
                                    permissions: { include: { permission: true } }
                                }
                            }
                        }
                    });

                    if (dbUser?.customRole) {
                        (session.user as any).permissions = dbUser.customRole.permissions.map(
                            rp => `${rp.permission.resource}.${rp.permission.action}`
                        );
                    } else {
                        // Fallback to legacy role permissions
                        (session.user as any).permissions = LEGACY_PERMISSIONS[(token.role as string)] || [];
                    }
                } catch {
                    // Fallback to token permissions if DB is unavailable
                    (session.user as any).permissions = token.permissions || [];
                }
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    trustHost: true,
})
