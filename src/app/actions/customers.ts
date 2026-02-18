'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function deleteCustomer(id: string) {
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
        return { message: "Only System Admins can delete customers", success: false };
    }

    try {
        // Check for existing transactions
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                sales: true,
                payments: true,
                creditNotes: true
            }
        });

        if (!customer) return { message: "Customer not found", success: false };

        const hasTransactions = customer.sales.length > 0 || customer.payments.length > 0 || customer.creditNotes.length > 0;

        if (hasTransactions) {
            // Soft delete
            await prisma.customer.update({
                where: { id },
                data: { isActive: false }
            });
            revalidatePath("/dashboard/accounting/customers");
            return { message: "Customer archived (has existing transactions)", success: true };
        }

        // Hard delete
        await prisma.customer.delete({
            where: { id }
        });

        revalidatePath("/dashboard/accounting/customers");
        return { message: "Customer deleted successfully", success: true };
    } catch (e) {
        console.error("Failed to delete customer:", e);
        return { message: "Failed to delete customer", success: false };
    }
}
