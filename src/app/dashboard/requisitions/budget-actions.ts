"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createMonthlyBudget(data: {
    month: number;
    year: number;
    branch: string;
    department: string;
    items: { description: string; category: string; amount: number }[];
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

    try {
        const budget = await (prisma as any).monthlyBudget.create({
            data: {
                userId: session.user.id,
                month: data.month,
                year: data.year,
                branch: data.branch,
                department: data.department,
                totalAmount,
                status: "PENDING",
                items: {
                    create: data.items
                }
            }
        });

        // ✨ NEW: Initiate Approval Workflow for Budget
        const { approvalWorkflow } = await import("@/lib/approval-workflow");
        const route = await approvalWorkflow.determineRoute(
            session.user.id,
            totalAmount,
            "Budget Plan", // Virtual category for routing
            false
        );

        await approvalWorkflow.createBudgetApprovals(budget.id, route);

        revalidatePath("/dashboard/requisitions");
        revalidatePath("/dashboard/approvals");
        return { success: true, id: budget.id };
    } catch (e: any) {
        console.error("Budget Creation Error:", e);
        return { error: e.message || "Failed to create monthly budget" };
    }
}
