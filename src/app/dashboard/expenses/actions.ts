'use server'

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { checkExpensePolicies } from "@/lib/policy-engine";
import { approvalWorkflow } from "@/lib/approval-workflow";

export async function submitAllDrafts() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Fetch all draft expenses
        const drafts = await prisma.expense.findMany({
            where: {
                userId: session.user.id,
                status: 'DRAFT'
            }
        });

        if (drafts.length === 0) {
            return { success: true, count: 0, message: "No draft expenses to submit." };
        }

        let submittedCount = 0;
        let errors: string[] = [];

        // 2. Process each expense
        for (const expense of drafts) {
            // Check Policies
            const policyResult = await checkExpensePolicies({
                title: expense.title,
                amount: expense.amount,
                category: expense.category,
                merchant: expense.merchant || undefined,
                expenseDate: expense.expenseDate,
                receiptUrl: expense.receiptUrl,
                userId: session.user.id,
                paymentMethod: expense.paymentMethod
            });

            // Identify blocking violations
            const blockers = policyResult.violations.filter(v => v.isBlocking).map(v => v.message);

            if (blockers.length > 0) {
                errors.push(`"${expense.title}": ${blockers.join(", ")}`);
                continue; // Skip submitting this one
            }

            // Initiate Approval Workflow
            const route = await approvalWorkflow.determineRoute(
                session.user.id,
                expense.amount,
                expense.category,
                !!expense.receiptUrl
            );

            await approvalWorkflow.createApprovals(expense.id, route);
            submittedCount++;
        }

        revalidatePath('/dashboard/expenses');
        revalidatePath('/dashboard/approvals');

        if (submittedCount === drafts.length) {
            return { success: true, count: submittedCount, message: `Successfully submitted ${submittedCount} expenses.` };
        } else {
            return {
                success: false,
                count: submittedCount,
                message: `Submitted ${submittedCount} expenses. ${errors.length} failed due to policies.`,
                errors
            };
        }

    } catch (error) {
        console.error("Error submitting drafts:", error);
        return { success: false, error: "Failed to submit expenses" };
    }
}

export async function deleteExpense(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Verify ownership and status
        const expense = await prisma.expense.findUnique({
            where: { id },
            select: { userId: true, status: true }
        });

        if (!expense) {
            return { success: false, error: "Expense not found" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, customRole: { select: { isSystem: true } } }
        });

        const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.customRole?.isSystem;
        if (!isAdmin) {
            return { success: false, error: "Only System Admins can delete expenses" };
        }

        /*
        // Original Logic allowed owners to delete drafts.
        // User Requirement: ONLY System Admin can delete ANYTHING.
        if (expense.userId !== session.user.id) {
            return { success: false, error: "Unauthorized" };
        }
        */

        if (expense.status !== 'DRAFT') {
            return { success: false, error: "Only draft expenses can be deleted" };
        }

        await prisma.expense.delete({
            where: { id }
        });

        revalidatePath('/dashboard/expenses');
        return { success: true, message: "Expense deleted successfully" };
    } catch (error) {
        console.error("Error deleting expense:", error);
        return { success: false, error: "Failed to delete expense" };
    }
}

