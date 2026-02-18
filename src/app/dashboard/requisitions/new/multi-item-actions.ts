"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkExpensePolicies } from "@/lib/policy-engine";
import { approvalWorkflow } from "@/lib/approval-workflow";

const RequisitionItemSchema = z.object({
    title: z.string().min(3, "Item title must be at least 3 characters"),
    description: z.string().optional(),
    quantity: z.coerce.number().int().positive("Quantity must be positive"),
    unitPrice: z.coerce.number().positive("Unit price must be positive"),
    category: z.string().min(1, "Category is required"),
});

const RequisitionSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(10, "Justification must be at least 10 characters"),
    currency: z.string().default("USD"),
    items: z.array(RequisitionItemSchema).min(1, "At least one item is required"),
});

export async function createRequisitionWithItems(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Parse items from formData
    const itemsJson = formData.get("items") as string;
    const items = JSON.parse(itemsJson);

    const validatedFields = RequisitionSchema.safeParse({
        title: formData.get("title"),
        description: formData.get("description"),
        currency: formData.get("currency"),
        items,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { title, description, currency, items: validatedItems } = validatedFields.data;

    // Calculate total amount
    const totalAmount = validatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Get the primary category (from first item or most expensive item)
    const primaryCategory = validatedItems.sort((a, b) =>
        (b.quantity * b.unitPrice) - (a.quantity * a.unitPrice)
    )[0].category;

    // Run Policy Checks
    const policyResult = await checkExpensePolicies({
        title,
        amount: totalAmount,
        category: primaryCategory,
        expenseDate: new Date(),
        userId: session.user.id
    });

    if (!policyResult.isValid) {
        const blockers = policyResult.violations.filter(v => v.isBlocking).map(v => v.message);
        if (blockers.length > 0) {
            return {
                message: `Policy Violation: ${blockers.join(", ")}`
            };
        }
    }

    let type = formData.get("type") as string || "STANDARD";
    const isSSCA = formData.get("isSSCA") === "true";
    const isStrictApproval = formData.get("isStrictApproval") === "true";

    if (isSSCA) {
        if ((session.user as any).role !== "SYSTEM_ADMIN") {
            return {
                message: "Unauthorized: Only System Administrators can create South Sudan Civil Aviation requests."
            };
        }
        type = isStrictApproval ? "SOUTH_SUDAN_STRICT" : "SOUTH_SUDAN";
    }

    const branch = formData.get("branch") as string;
    const department = formData.get("department") as string;
    const vendor = formData.get("vendor") as string;
    const expectedDateStr = formData.get("expectedDate") as string;

    let finalDescription = description;
    if (vendor && vendor.trim()) {
        finalDescription += `\n\n**Preferred Vendor:** ${vendor.trim()}`;
    }

    const expectedDate = expectedDateStr ? new Date(expectedDateStr) : undefined;

    // Create requisition with items
    const requisition = await (prisma.requisition.create as any)({
        data: {
            userId: session.user.id,
            title,
            amount: totalAmount,
            currency,
            category: primaryCategory,
            description: finalDescription,
            businessJustification: finalDescription,
            status: "PENDING",
            type,
            branch,
            department,
            expectedDate,
            items: {
                create: validatedItems.map(item => ({
                    title: item.title,
                    description: item.description || "",
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                    category: item.category,
                }))
            }
        },
    });

    // Initiate Approval Workflow
    console.log(`[Requisition] Creating workflow for amount: ${totalAmount}, category: ${primaryCategory}`);
    const route = await approvalWorkflow.determineRoute(
        session.user.id,
        totalAmount,
        primaryCategory,
        false,
        type
    );

    console.log(`[Requisition] Route determined: ${route.autoApprove ? 'Auto-approve' : 'Levels: ' + route.levels.length}`);
    const approvals = await approvalWorkflow.createRequisitionApprovals(requisition.id, route);
    console.log(`[Requisition] Created ${approvals.length} approval records`);

    redirect("/dashboard/requisitions");
}

export async function addItemToRequisition(requisitionId: string, itemData: any) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const validatedItem = RequisitionItemSchema.safeParse(itemData);

    if (!validatedItem.success) {
        return {
            errors: validatedItem.error.flatten().fieldErrors,
        };
    }

    const { title, description, quantity, unitPrice, category } = validatedItem.data;
    const totalPrice = quantity * unitPrice;

    try {
        // Fetch parent requisition to get type and currency
        const parentRequisition = await prisma.requisition.findUnique({
            where: { id: requisitionId },
            select: {
                type: true,
                currency: true,
                status: true
            }
        });

        if (!parentRequisition) {
            return { error: "Requisition not found" };
        }

        // Determine Approval Route for this item
        // We reuse the main workflow engine but apply it to this specific item
        const route = await approvalWorkflow.determineRoute(
            session.user.id,
            totalPrice,
            category,
            false,
            parentRequisition.type // Pass the parent's type (e.g. SOUTH_SUDAN)
        );

        // Determine item status based on route
        // If the parent is already approved/paid, and this valid route says auto-approve (like SSCA), 
        // then we can approve immediately.
        // Otherwise, it starts as PENDING.
        const initialStatus = route.autoApprove ? 'APPROVED' : 'PENDING';

        // Create the new item with its specific status
        const newItem = await (prisma as any).requisitionItem.create({
            data: {
                requisitionId,
                title,
                description: description || "",
                quantity,
                unitPrice,
                totalPrice,
                category,
                isInitial: false,
                status: initialStatus,
                type: parentRequisition.type
            },
        });

        // Create Approval Records if not auto-approved
        if (!route.autoApprove) {
            for (const level of route.levels) {
                for (const approver of level.approvers) {
                    await (prisma as any).itemApproval.create({
                        data: {
                            requisitionItemId: newItem.id,
                            approverId: approver.id,
                            level: level.level,
                            status: 'PENDING'
                        }
                    });
                }
            }
        }

        // Recalculate total amount for the requisition details
        // Note: The main requisition status does NOT change back to PENDING.
        // The new item has its own independent lifecycle.
        const allItems = await (prisma as any).requisitionItem.findMany({
            where: { requisitionId },
        });

        const newTotalAmount = allItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

        // Update requisition amount
        await (prisma as any).requisition.update({
            where: { id: requisitionId },
            data: { amount: newTotalAmount },
        });

        return { success: true, item: newItem };
    } catch (error) {
        console.error("Error adding item to requisition:", error);
        return { error: "Failed to add item" };
    }
}

export async function getEligibleRequisitions() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const userId = session.user.id;

        // Check for System Admin role
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, customRole: { select: { isSystem: true } } }
        });

        const isAdmin = currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.customRole?.isSystem;

        // Fetch PENDING or APPROVED requisitions
        // Admins can see all, users see their own
        const whereClause: any = {
            status: { in: ['PENDING', 'APPROVED', 'PAID'] }
        };

        if (!isAdmin) {
            whereClause.userId = userId;
        }

        const requisitions = await prisma.requisition.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                amount: true,
                currency: true
            }
        });

        return requisitions;
    } catch (error) {
        console.error("Error fetching eligible requisitions:", error);
        return [];
    }
}

export async function getCategoriesAction() {
    try {
        const prismaClient = prisma as any;
        const customCategories = await prismaClient.customCategory.findMany({
            where: { isActive: true },
            select: { name: true },
            orderBy: { name: "asc" },
        });

        const customCategoryNames = customCategories.map((c: any) => c.name);
        const { EXPENSE_CATEGORIES } = await import("@/lib/constants");

        return Array.from(new Set([...EXPENSE_CATEGORIES, ...customCategoryNames]));
    } catch (error) {
        console.error("Error fetching categories:", error);
        const { EXPENSE_CATEGORIES } = await import("@/lib/constants");
        return EXPENSE_CATEGORIES;
    }
}
