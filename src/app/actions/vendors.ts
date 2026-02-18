'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const VendorSchema = z.object({
    name: z.string().min(1, "Name is required"),
    category: z.string().min(1, "Category is required"),
    description: z.string().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    paymentTerms: z.string().optional(),
    currency: z.string().default('USD'),
})

export async function createVendor(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { message: "Unauthorized", success: false }
    }

    const data = {
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        website: formData.get('website') as string,
        paymentTerms: formData.get('paymentTerms') as string,
        currency: formData.get('currency') as string || 'USD',
    }

    try {
        const validated = VendorSchema.parse(data)

        await prisma.vendor.create({
            data: {
                ...validated,
                isActive: true,
                email: validated.email || null,
                phone: validated.phone || null,
                website: validated.website || null,
                description: validated.description || null,
            }
        })

        revalidatePath("/dashboard/vendors")
        return { message: "Vendor created successfully", success: true }
    } catch (e) {
        console.error(e)
        return { message: "Failed to create vendor", success: false }
    }
}

export async function deleteVendor(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: "Unauthorized", success: false };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, customRole: { select: { isSystem: true } } }
    });

    const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.customRole?.isSystem;
    if (!isAdmin) {
        return { message: "Only System Admins can delete vendors", success: false };
    }

    try {
        // Check for existing transactions
        const vendor = await prisma.vendor.findUnique({
            where: { id },
            include: { invoices: true }
        });

        if (!vendor) return { message: "Vendor not found", success: false };

        if (vendor.invoices.length > 0) {
            // Soft delete
            await prisma.vendor.update({
                where: { id },
                data: { isActive: false }
            });
            revalidatePath("/dashboard/vendors");
            return { message: "Vendor archived (has existing transactions)", success: true };
        }

        // Hard delete
        await prisma.vendor.delete({
            where: { id }
        });

        revalidatePath("/dashboard/vendors");
        return { message: "Vendor deleted successfully", success: true };
    } catch (e) {
        console.error("Failed to delete vendor:", e);
        return { message: "Failed to delete vendor", success: false };
    }
}

export async function updateVendor(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { message: "Unauthorized", success: false }
    }

    const data = {
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        website: formData.get('website') as string,
        paymentTerms: formData.get('paymentTerms') as string,
        currency: formData.get('currency') as string || 'USD',
    }

    try {
        const validated = VendorSchema.parse(data)

        await prisma.vendor.update({
            where: { id },
            data: {
                ...validated,
                email: validated.email || null,
                phone: validated.phone || null,
                website: validated.website || null,
                description: validated.description || null,
            }
        })

        revalidatePath("/dashboard/vendors")
        return { message: "Vendor updated successfully", success: true }
    } catch (e) {
        console.error(e)
        return { message: "Failed to update vendor", success: false }
    }
}
