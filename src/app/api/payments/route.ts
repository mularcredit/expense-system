import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// GET - List payments (filtered by role/status)
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        // Build query based on status and role
        // For now, return all payments, frontend can filter tabs
        const payments = await (prisma as any).payment.findMany({
            where: status ? { status } : undefined,
            include: {
                maker: { select: { name: true, email: true } },
                checker: { select: { name: true, email: true } },
                _count: {
                    select: {
                        invoices: true,
                        expenses: true,
                        requisitions: (prisma as any).requisition ? true : false,
                        monthlyBudgets: (prisma as any).monthlyBudget ? true : false
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Also fetch items available for payment (only if requesting potential new batches)
        // This might be better as a separate call or part of the page load.

        return NextResponse.json({ payments });

    } catch (error) {
        console.error('Payment fetch error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST - Create a new payment request (Maker)
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            expenseIds = [],
            invoiceIds = [],
            requisitionIds = [],
            budgetIds = [],
            method = "BANK_TRANSFER",
            notes
        } = body;

        if (expenseIds.length === 0 && invoiceIds.length === 0 && requisitionIds.length === 0 && budgetIds.length === 0) {
            return NextResponse.json({ error: 'No items selected' }, { status: 400 });
        }

        // Calculate total
        let totalAmount = 0;
        let currency = "USD"; // Assuming single currency for now

        // Verify expenses
        if (expenseIds.length > 0) {
            const expenses = await prisma.expense.findMany({
                where: { id: { in: expenseIds }, status: 'APPROVED' }
            });
            totalAmount += expenses.reduce((sum, e) => sum + e.amount, 0);
        }

        // Verify invoices
        if (invoiceIds.length > 0) {
            const invoices = await prisma.invoice.findMany({
                where: { id: { in: invoiceIds }, status: 'APPROVED' }
            });
            totalAmount += invoices.reduce((sum, i) => sum + i.amount, 0);
        }

        // Verify Requisitions
        if (requisitionIds.length > 0) {
            const requisitions = await prisma.requisition.findMany({
                where: { id: { in: requisitionIds }, status: 'APPROVED' }
            });
            totalAmount += requisitions.reduce((sum, r) => sum + r.amount, 0);
        }

        // Verify Budgets
        if (budgetIds.length > 0) {
            const budgets = await (prisma as any).monthlyBudget.findMany({
                where: { id: { in: budgetIds }, status: 'APPROVED' }
            });
            totalAmount += budgets.reduce((sum: number, b: any) => sum + b.totalAmount, 0);
        }

        // Create Payment with core items
        const paymentData: any = {
            data: {
                makerId: session.user.id,
                amount: totalAmount,
                currency,
                method,
                notes,
                status: 'PENDING_AUTHORIZATION',
                expenses: {
                    connect: expenseIds.map((id: string) => ({ id }))
                },
                invoices: {
                    connect: invoiceIds.map((id: string) => ({ id }))
                }
            }
        };

        // Only add requisitions/budgets to connect if the client definitely knows about them
        // to avoid validation errors if the dev server hasn't picked up the new schema yet.
        const canConnectRequisitions = (prisma as any).requisition && (prisma as any).payment?.fields?.requisitions;
        if (canConnectRequisitions) {
            paymentData.data.requisitions = {
                connect: requisitionIds.map((id: string) => ({ id }))
            };
            paymentData.data.monthlyBudgets = {
                connect: budgetIds.map((id: string) => ({ id }))
            };
        }

        const payment = await (prisma as any).payment.create(paymentData);

        // If we couldn't connect via create (stale client), do it via raw update
        if (!canConnectRequisitions) {
            for (const id of requisitionIds) {
                await prisma.$executeRawUnsafe(`UPDATE "Requisition" SET "paymentId" = $1 WHERE id = $2`, payment.id, id);
            }
            for (const id of budgetIds) {
                await prisma.$executeRawUnsafe(`UPDATE "MonthlyBudget" SET "paymentId" = $1 WHERE id = $2`, payment.id, id);
            }
        }

        return NextResponse.json({ success: true, payment });

    } catch (error) {
        console.error('Payment creation error:', error);
        return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }
}
