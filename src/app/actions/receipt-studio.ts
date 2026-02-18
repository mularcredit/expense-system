"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getRequisitionDetailsForReceipt(requisitionId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const req = await (prisma.requisition.findUnique as any)({
        where: { id: requisitionId },
        include: {
            user: true,
            items: true, // Include requisition items
            approvals: {
                include: {
                    approver: true
                }
            }
        }
    });

    if (!req) return null;

    // Approvers
    const requestedBy = req.user.name || "Unknown";
    // Authorized by highest level approver?
    const authorizedBy = req.approvals.sort((a: any, b: any) => b.level - a.level)[0]?.approver?.name || "Pending";

    const beneficiaryName = req.user.name || "Beneficiary";
    const beneficiaryAddress = req.department ? `${req.department} Dept` : "N/A";

    // Build items array from requisition items if they exist, otherwise use the requisition itself
    let items = [];

    if (req.items && req.items.length > 0) {
        // Map each requisition item to the receipt format
        items = req.items.map((item: any) => ({
            description: item.title,
            subtext: `${item.category} - Qty: ${item.quantity} @ ${req.currency || 'USD'} ${item.unitPrice.toFixed(2)}`,
            date: item.createdAt,
            amount: item.totalPrice
        }));
    } else {
        // Fallback to single item (for old requisitions without items)
        items = [{
            description: req.title,
            subtext: req.description || req.category,
            date: req.createdAt,
            amount: req.amount
        }];
    }

    return {
        receiptNo: `VCH-${new Date().getFullYear()}-${req.id.slice(0, 8).toUpperCase()}`,
        date: req.updatedAt,
        amount: req.amount,
        beneficiary: {
            name: beneficiaryName,
            address: beneficiaryAddress
        },
        paymentMode: "Bank Transfer",
        paymentRef: `REQ-${req.id.slice(0, 8)}`,
        items,
        approvals: {
            requestedBy,
            authorizedBy,
            paidBy: "Finance Dept",
            receivedBy: ""
        }
    };
}

export async function getInvoiceDetailsForReceipt(invoiceId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const inv = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            vendor: true,
            createdBy: true,
        }
    });

    if (!inv) return null;

    return {
        receiptNo: `VCH-${new Date().getFullYear()}-${inv.id.slice(0, 8).toUpperCase()}`,
        date: inv.invoiceDate,
        amount: inv.amount,
        beneficiary: {
            name: inv.vendor.name,
            address: inv.vendor.address || "N/A"
        },
        paymentMode: "Bank Transfer",
        paymentRef: `INV-${inv.invoiceNumber}`,
        items: [
            {
                description: `Invoice: ${inv.invoiceNumber}`,
                subtext: inv.description || "Vendor Payment",
                date: inv.invoiceDate,
                amount: inv.amount
            }
        ],
        approvals: {
            requestedBy: inv.createdBy.name || "Unknown",
            authorizedBy: "Finance Manager",
            paidBy: "Finance Dept",
            receivedBy: ""
        }
    };
}

export async function getExpenseDetailsForReceipt(expenseId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const exp = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
            user: true,
        }
    });

    if (!exp) return null;

    return {
        receiptNo: `VCH-${new Date().getFullYear()}-${exp.id.slice(0, 8).toUpperCase()}`,
        date: exp.expenseDate,
        amount: exp.amount,
        beneficiary: {
            name: exp.user.name || "Unknown",
            address: exp.user.department ? `${exp.user.department} Dept` : "N/A"
        },
        paymentMode: "Bank Transfer",
        paymentRef: `EXP-${exp.id.slice(0, 8)}`,
        items: [
            {
                description: exp.title,
                subtext: exp.description || exp.category,
                date: exp.expenseDate,
                amount: exp.amount
            }
        ],
        approvals: {
            requestedBy: exp.user.name || "Unknown",
            authorizedBy: "Department Head",
            paidBy: "Finance Dept",
            receivedBy: ""
        }
    };
}



export async function getPaymentDetailsForReceipt(paymentId: string) {
    const session = await auth();
    // ... existing code ...
    if (!session?.user?.id) throw new Error("Unauthorized");

    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            requisitions: {
                include: {
                    user: true
                }
            },
            invoices: {
                include: {
                    vendor: true
                }
            },
            expenses: {
                include: {
                    user: true
                }
            },
            monthlyBudgets: true,
            maker: true,
            checker: true
        }
    });

    if (!payment) return null;

    // Transform into Receipt Data format
    // Flatten items from disparate sources
    const items = [];

    // Add requisitions
    for (const req of payment.requisitions) {
        items.push({
            description: req.title,
            subtext: `Requisition (Ref: ${req.id.slice(-6)}) - ${req.category}`,
            date: req.updatedAt,
            amount: req.amount
        });
    }

    // Add invoices
    for (const inv of payment.invoices) {
        items.push({
            description: `Invoice: ${inv.invoiceNumber}`,
            subtext: `Vendor: ${inv.vendor.name}`,
            date: inv.dueDate,
            amount: inv.amount
        });
    }

    // Add expenses
    for (const exp of payment.expenses) {
        items.push({
            description: exp.title,
            subtext: `Reimbursement: ${exp.user.name}`,
            date: exp.expenseDate,
            amount: exp.amount
        });
    }

    // Add budgets
    for (const bud of payment.monthlyBudgets) {
        items.push({
            description: `Budget Allocation: ${bud.branch}`,
            subtext: `Period: ${bud.month}/${bud.year}`,
            date: bud.updatedAt,
            amount: bud.totalAmount
        });
    }

    // Determine Beneficiary (User or Vendor or Mixed)
    // If it's a mix, we might just say "Mixed Beneficiaries" or use the first one.
    // Ideally payments are grouped by beneficiary, but batch payments exist.
    let beneficiaryName = "Various Beneficiaries";
    let beneficiaryAddress = "";

    if (payment.invoices.length === 1 && items.length === 1) {
        beneficiaryName = payment.invoices[0].vendor.name;
        beneficiaryAddress = payment.invoices[0].vendor.address || "";
    } else if (payment.expenses.length > 0 && items.length === payment.expenses.length) {
        // Check if all expenses are same user
        const firstUserId = payment.expenses[0].userId;
        const allSameUser = payment.expenses.every(e => e.userId === firstUserId);
        if (allSameUser) {
            beneficiaryName = payment.expenses[0].user.name;
        }
    } else if (payment.requisitions.length > 0) {
        // Similar check
        const firstUserId = payment.requisitions[0].userId;
        const allSameUser = payment.requisitions.every(e => e.userId === firstUserId);
        if (allSameUser) {
            beneficiaryName = payment.requisitions[0].user.name;
        }
    }

    return {
        receiptNo: `REC-${new Date().getFullYear()}-${payment.id.slice(-4).toUpperCase()}`,
        date: payment.processedAt || payment.updatedAt,
        amount: payment.amount,
        beneficiary: {
            name: beneficiaryName,
            address: beneficiaryAddress
        },
        paymentMode: payment.method === 'BANK_TRANSFER' ? 'Bank Transfer' :
            payment.method === 'MOBILE_MONEY' ? 'Mobile Money' :
                payment.method === 'CASH' ? 'Cash' :
                    payment.method?.replace('_', ' ') || 'Bank Transfer',
        paymentRef: payment.reference || `TRX-${payment.id.slice(0, 8)}`,
        items: items,
        approvals: {
            requestedBy: payment.maker.name,
            authorizedBy: payment.checker?.name || "Pending",
            paidBy: "Finance Dept",
            receivedBy: beneficiaryName
        }
    };
}
