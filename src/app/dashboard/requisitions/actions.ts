"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function fulfillRequisition(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const requisitionId = formData.get("requisitionId") as string;
    const receiptUrl = formData.get("receiptUrl") as string;
    const notes = formData.get("notes") as string;

    if (!requisitionId || !receiptUrl) {
        throw new Error("Requisition ID and Receipt URL are required");
    }

    try {
        // Fetch the requisition
        const requisition = await prisma.requisition.findUnique({
            where: { id: requisitionId }
        });

        if (!requisition) throw new Error("Requisition not found");
        if (requisition.status !== 'APPROVED') throw new Error("Only approved requisitions can be fulfilled");

        // Create the Expense with APPROVED status so it appears in Pay queue
        const expense = await prisma.expense.create({
            data: {
                userId: session.user.id,
                requisitionId: requisitionId,
                title: `Fulfillment: ${requisition.title}`,
                description: notes || requisition.description,
                amount: requisition.amount,
                category: requisition.category,
                expenseDate: new Date(),
                receiptUrl: receiptUrl,
                status: 'APPROVED', // Approved since requisition was already approved
                paymentMethod: 'PERSONAL_CARD',
                isReimbursable: true
            }
        });

        // Mark requisition as FULFILLED so it doesn't appear in the submit receipt list anymore
        await prisma.requisition.update({
            where: { id: requisitionId },
            data: { status: 'FULFILLED' }
        });

        revalidatePath("/dashboard/requisitions");
        revalidatePath("/dashboard/expenses");
        revalidatePath("/dashboard/payments");
        revalidatePath("/dashboard/approvals");

        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { error: e.message };
    }
}

export async function deleteRequisition(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        const requisition = await prisma.requisition.findUnique({
            where: { id }
        });

        if (!requisition) return { success: false, message: "Requisition not found" };
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, customRole: { select: { isSystem: true } } }
        });

        const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.customRole?.isSystem;
        if (!isAdmin) {
            return { success: false, message: "Only Global Admin can delete requisitions" };
        }

        /*
        if (requisition.userId !== session.user.id) {
            return { success: false, message: "Only the creator can delete this requisition" };
        }
        */

        await (prisma as any).requisition.delete({
            where: { id }
        });

        revalidatePath("/dashboard/requisitions");
        return { success: true, message: "Requisition deleted successfully" };
    } catch (e: any) {
        console.error("Failed to delete requisition:", e);
        return { success: false, message: e.message || "Failed to delete" };
    }
}
