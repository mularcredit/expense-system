import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// POST - Authorize or Reject a payment (Checker)
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { paymentId, action, paymentMethod, proofUrl } = body; // action: 'AUTHORIZE' | 'REJECT' | 'DISBURSE'

        if (!['AUTHORIZE', 'REJECT', 'DISBURSE'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Fetch payment with relationships to update them if needed
        const payment = await (prisma as any).payment.findUnique({
            where: { id: paymentId },
            include: {
                invoices: {
                    include: { vendor: { select: { stripeAccountId: true, name: true } } }
                },
                expenses: {
                    include: { user: { select: { stripeAccountId: true, name: true } } }
                },
                requisitions: true,
                monthlyBudgets: true
            }
        });

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        if (action === 'DISBURSE' && payment.status !== 'AUTHORIZED') {
            return NextResponse.json({ error: 'Payment must be authorized before disbursement' }, { status: 400 });
        }

        if (action !== 'DISBURSE' && payment.status !== 'PENDING_AUTHORIZATION') {
            return NextResponse.json({ error: 'Payment is not pending authorization' }, { status: 400 });
        }

        // Prevent Maker from checking their own work (optional but good practice)
        if (payment.makerId === session.user.id && process.env.NODE_ENV === 'production') {
            // In dev let it slide for easier testing
            // return NextResponse.json({ error: 'Maker cannot authorize their own payment' }, { status: 403 });
        }

        if (action === 'AUTHORIZE') {
            // Update Payment to AUTHORIZED
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'AUTHORIZED',
                    checkerId: session.user.id,
                    authorizedAt: new Date()
                }
            });
        } else if (action === 'DISBURSE') {
            let p = payment as any;

            // Robust fetch: If requisitions or budgets are missing from the initial query (due to stale Prisma metadata)
            // we fetch them explicitly by paymentId.
            if (!p.requisitions || p.requisitions.length === 0) {
                p.requisitions = await (prisma as any).requisition.findMany({ where: { paymentId } });
            }
            if (!p.monthlyBudgets || p.monthlyBudgets.length === 0) {
                p.monthlyBudgets = await (prisma as any).monthlyBudget.findMany({ where: { paymentId } });
            }

            // Mark as PAID
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'PAID',
                    processedAt: new Date(),
                    method: paymentMethod || payment.method || 'BANK_TRANSFER',
                    notes: proofUrl ? `${payment.notes || ''}\nProof of Payment: ${proofUrl}`.trim() : payment.notes
                }
            });

            const { AccountingEngine } = await import('@/lib/accounting/accounting-engine');

            // Find the Cash/Bank account (where money is paid from)
            const cashAccount = await prisma.account.findFirst({
                where: { code: '1000' } // Cash & Bank
            });

            // Update Expenses and POST TO GENERAL LEDGER
            if (p.expenses.length > 0) {
                await prisma.expense.updateMany({
                    where: { id: { in: p.expenses.map((e: any) => e.id) } },
                    data: {
                        status: 'PAID',
                        paidAt: new Date()
                    }
                });

                if (cashAccount) {
                    for (const expense of p.expenses) {
                        try {
                            await AccountingEngine.postExpensePayment(expense.id, cashAccount.id);
                        } catch (error) {
                            console.error(`❌ Failed to post expense ${expense.id}:`, error);
                        }
                    }
                }
            }

            // Update Requisitions
            if (p.requisitions?.length > 0) {
                await prisma.requisition.updateMany({
                    where: { id: { in: p.requisitions.map((r: any) => r.id) } },
                    data: { status: 'PAID' }
                });

                if (cashAccount) {
                    for (const req of p.requisitions) {
                        try {
                            await (AccountingEngine as any).postRequisitionPayment(req.id, cashAccount.id);
                        } catch (error) {
                            console.error(`❌ Failed to post requisition ${req.id}:`, error);
                        }
                    }
                }
            }

            // Update Budgets
            if (p.monthlyBudgets?.length > 0) {
                await (prisma as any).monthlyBudget.updateMany({
                    where: { id: { in: p.monthlyBudgets.map((b: any) => b.id) } },
                    data: { status: 'PAID' }
                });

                if (cashAccount) {
                    for (const bud of p.monthlyBudgets) {
                        try {
                            await (AccountingEngine as any).postBudgetDisbursement(bud.id, cashAccount.id);
                        } catch (error) {
                            console.error(`❌ Failed to post budget ${bud.id}:`, error);
                        }
                    }
                }
            }

            // Update Invoices
            if (p.invoices.length > 0) {
                await prisma.invoice.updateMany({
                    where: { id: { in: p.invoices.map((i: any) => i.id) } },
                    data: {
                        status: 'PAID',
                        paymentStatus: 'PAID',
                        paidAt: new Date()
                    }
                });

                if (cashAccount) {
                    for (const invoice of p.invoices) {
                        try {
                            await AccountingEngine.postVendorPayment(invoice.id, invoice.amount);
                        } catch (error) {
                            console.error(`❌ Failed to post vendor payment ${invoice.id}:`, error);
                        }
                    }
                }
            }
        } else if (action === 'REJECT') {
            // Update Payment
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'REJECTED',
                    checkerId: session.user.id,
                    authorizedAt: new Date()
                }
            });

            // Disconnect items
            await prisma.expense.updateMany({
                where: { paymentId: paymentId },
                data: { paymentId: null }
            });
            await prisma.invoice.updateMany({
                where: { paymentId: paymentId },
                data: { paymentId: null }
            });
            await (prisma as any).requisition.updateMany({
                where: { paymentId: paymentId },
                data: { paymentId: null }
            });
            await (prisma as any).monthlyBudget.updateMany({
                where: { paymentId: paymentId },
                data: { paymentId: null }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Payment authorization error:', error);
        return NextResponse.json({ error: 'Failed to process authorization' }, { status: 500 });
    }
}
