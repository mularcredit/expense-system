'use server'

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { auth } from "@/auth";

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { success: true, data: users };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { success: false, error: "Failed to fetch users" };
    }
}

export async function createUser(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, customRole: { select: { isSystem: true } } }
    });

    const isAdmin = currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.customRole?.isSystem;

    if (!isAdmin) {
        return { success: false, error: "Forbidden: Only System Admins can manage users" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    let role = formData.get("role") as string;
    const customRoleId = formData.get("customRoleId") as string;
    const department = formData.get("department") as string;
    const position = formData.get("position") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password || !role) {
        return { success: false, error: "Missing required fields" };
    }

    // Handle Custom Roles
    if (customRoleId) {
        role = 'CUSTOM';
    }

    // Check Single Admin Constraint
    if (role === 'SYSTEM_ADMIN') {
        const adminCount = await prisma.user.count({
            where: {
                OR: [
                    { role: 'SYSTEM_ADMIN' },
                    { customRole: { isSystem: true } }
                ]
            }
        });
        if (adminCount >= 1) {
            return { success: false, error: "Only one System Admin is allowed." };
        }
    }

    try {
        const hashedPassword = await hash(password, 12);

        await prisma.user.create({
            data: {
                name,
                email,
                role,
                customRoleId: customRoleId || null,
                department,
                position,
                phoneNumber,
                password: hashedPassword,
                accountStatus: 'ACTIVE',
                isActive: true
            }
        });

        revalidatePath('/dashboard/team');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating user:", error);
        if (error.code === 'P2002') {
            return { success: false, error: "Email already exists" };
        }
        return { success: false, error: "Failed to create user" };
    }
}

export async function updateUser(userId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    let role = formData.get("role") as string;
    const customRoleId = formData.get("customRoleId") as string;
    const department = formData.get("department") as string;
    const position = formData.get("position") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    if (customRoleId) {
        role = 'CUSTOM';
    }
    // Password update handled separately usually, or optional here

    // Check Single Admin Constraint if assigning SYSTEM_ADMIN role
    if (role === 'SYSTEM_ADMIN') {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, customRole: { select: { isSystem: true } } }
        });

        // If user is NOT currently an admin, checks if another admin exists
        const isCurrentlyAdmin = existingUser?.role === 'SYSTEM_ADMIN' || existingUser?.customRole?.isSystem;

        if (!isCurrentlyAdmin) {
            const adminCount = await prisma.user.count({
                where: {
                    OR: [
                        { role: 'SYSTEM_ADMIN' },
                        { customRole: { isSystem: true } }
                    ]
                }
            });

            if (adminCount >= 1) {
                return { success: false, error: "Only one System Admin is allowed." };
            }
        }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                role,
                customRoleId: customRoleId || null,
                department,
                position,
                phoneNumber,
            }
        });

        revalidatePath('/dashboard/team');
        return { success: true };
    } catch (error) {
        console.error("Error updating user:", error);
        return { success: false, error: "Failed to update user" };
    }
}


export async function deleteUser(userId: string) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, customRole: { select: { isSystem: true } } }
    });

    const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.customRole?.isSystem;
    if (!isAdmin) {
        return { success: false, error: "Forbidden: Only System Admins can delete users" };
    }

    try {
        await prisma.user.delete({
            where: { id: userId }
        });
        revalidatePath('/dashboard/team');
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error: "Failed to delete user" };
    }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    if ((session.user as any).role !== "SYSTEM_ADMIN") {
        return { success: false, error: "Forbidden: Only System Admins can manage users" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive,
                accountStatus: isActive ? 'ACTIVE' : 'SUSPENDED'
            }
        });
        revalidatePath('/dashboard/team');
        return { success: true };
    } catch (error) {
        console.error("Error toggling user status:", error);
        return { success: false, error: "Failed to update user status" };
    }
}
