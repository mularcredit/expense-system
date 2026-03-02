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
        const requisition = await prisma.requisition.findUnique({
            where: { id: requisitionId }
        });

        if (!requisition) throw new Error("Requisition not found");
        if (requisition.status !== 'APPROVED') throw new Error("Only approved requisitions can be fulfilled");

        await prisma.expense.create({
            data: {
                userId: session.user.id,
                requisitionId: requisitionId,
                title: `Fulfillment: ${requisition.title}`,
                description: notes || requisition.description,
                amount: requisition.amount,
                category: requisition.category,
                expenseDate: new Date(),
                receiptUrl: receiptUrl,
                status: 'APPROVED',
                paymentMethod: 'PERSONAL_CARD',
                isReimbursable: true
            }
        });

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
        const requisition = await prisma.requisition.findUnique({ where: { id } });
        if (!requisition) return { success: false, message: "Requisition not found" };

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, customRole: { select: { isSystem: true } } }
        });

        const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.customRole?.isSystem;
        if (!isAdmin) {
            return { success: false, message: "Only Global Admin can delete requisitions" };
        }

        await (prisma as any).requisition.delete({ where: { id } });

        revalidatePath("/dashboard/requisitions");
        return { success: true, message: "Requisition deleted successfully" };
    } catch (e: any) {
        console.error("Failed to delete requisition:", e);
        return { success: false, message: e.message || "Failed to delete" };
    }
}

export async function updateRequisition(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const id = formData.get("id") as string;
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const branch = (formData.get("branch") as string)?.trim();
    const department = (formData.get("department") as string)?.trim();
    const expectedDateStr = formData.get("expectedDate") as string;

    if (!id) return { success: false, message: "Missing requisition ID" };
    if (!title || title.length < 5) return { success: false, message: "Title must be at least 5 characters" };
    if (!description || description.length < 10) return { success: false, message: "Justification must be at least 10 characters" };

    try {
        const requisition = await prisma.requisition.findUnique({ where: { id } });
        if (!requisition) return { success: false, message: "Requisition not found" };

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, customRole: { select: { isSystem: true } } }
        });
        const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.role === 'ADMIN' || user?.customRole?.isSystem;

        if (!isAdmin && requisition.userId !== session.user.id) {
            return { success: false, message: "You can only edit your own requisitions" };
        }
        if (!isAdmin && !['PENDING', 'NEEDS_INFO'].includes(requisition.status)) {
            return { success: false, message: `This requisition cannot be edited (status: ${requisition.status})` };
        }

        const expectedDate = expectedDateStr ? new Date(expectedDateStr) : null;

        await (prisma as any).requisition.update({
            where: { id },
            data: {
                title,
                description,
                businessJustification: description,
                branch: branch || null,
                department: department || null,
                expectedDate: expectedDate,
            }
        });

        revalidatePath("/dashboard/requisitions");
        return { success: true, message: "Requisition updated successfully" };
    } catch (e: any) {
        console.error("Failed to update requisition:", e);
        return { success: false, message: e.message || "Failed to update" };
    }
}
