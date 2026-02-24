import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
    PiTrendUp,
    PiHandCoins,
    PiInvoice,
    PiUser,
    PiBuildings,
    PiFileText
} from "react-icons/pi";
import { PaymentQueue } from "../../../components/dashboard/PaymentQueue";
import { stripe } from "@/lib/stripe";
import { StatsCard } from "@/components/dashboard/StatsCard";

export default async function PaymentsPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    // Fetch expenses that are APPROVED but not yet linked to a payment OR paid
    const approvedExpenses = await prisma.expense.findMany({
        where: {
            status: 'APPROVED',
            isReimbursable: true,
            paymentId: null
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    department: true,
                    bankAccount: true
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Fetch invoices that are APPROVED but not paid
    const approvedInvoices = await prisma.invoice.findMany({
        where: {
            status: 'APPROVED',
            paymentStatus: { not: 'PAID' },
            paymentId: null
        },
        include: {
            vendor: true,
            createdBy: {
                select: { name: true, email: true }
            }
        },
        orderBy: { dueDate: 'asc' }
    });

    // Fetch requisitions that are APPROVED but not paid
    // Using queryRaw to bypass Prisma's runtime validation cache which might be stale
    const approvedReqRecords = await prisma.$queryRaw<any[]>`SELECT id FROM "Requisition" WHERE status = 'APPROVED' AND "paymentId" IS NULL`;
    const approvedRequisitions = await (prisma as any).requisition.findMany({
        where: {
            id: { in: approvedReqRecords.map(r => r.id) }
        },
        include: {
            user: {
                select: { name: true, email: true, department: true }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Fetch budgets that are APPROVED but not paid
    const approvedBudRecords = await prisma.$queryRaw<any[]>`SELECT id FROM "MonthlyBudget" WHERE status = 'APPROVED' AND "paymentId" IS NULL`;
    const approvedBudgets = await (prisma as any).monthlyBudget.findMany({
        where: {
            id: { in: approvedBudRecords.map(b => b.id) }
        },
        include: {
            user: {
                select: { name: true, email: true, department: true }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Fetch pending payment requests
    const pendingPayments = await prisma.payment.findMany({
        where: {
            status: 'PENDING_AUTHORIZATION'
        },
        include: {
            maker: { select: { name: true, email: true, profileImage: true } },
            _count: {
                select: { invoices: true, expenses: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Fetch authorized payment requests (Ready to Pay)
    const authorizedPayments = await prisma.payment.findMany({
        where: {
            status: 'AUTHORIZED'
        },
        include: {
            maker: { select: { name: true, email: true, profileImage: true } },
            _count: {
                select: { invoices: true, expenses: true }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Fetch payout history
    const payoutHistory = await prisma.payment.findMany({
        where: {
            status: { in: ['PAID', 'REJECTED'] }
        },
        include: {
            maker: { select: { name: true } },
            checker: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 20
    });

    // Calculate totals
    const totalExpenses = approvedExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const totalInvoices = approvedInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
    const totalRequisitions = approvedRequisitions.reduce((sum: number, req: any) => sum + req.amount, 0);
    const totalBudgets = approvedBudgets.reduce((sum: number, bud: any) => sum + bud.totalAmount, 0);
    const totalPending = totalExpenses + totalInvoices + totalRequisitions + totalBudgets;

    const totalAwaitingAuth = pendingPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const totalReadyToPay = authorizedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

    // Group expenses by user for batch payments
    const expensesByUser = approvedExpenses.reduce((acc, exp) => {
        const userId = exp.userId;
        if (!acc[userId]) {
            acc[userId] = {
                user: exp.user,
                expenses: [],
                total: 0
            };
        }
        acc[userId].expenses.push(exp);
        acc[userId].total += exp.amount;
        return acc;
    }, {} as Record<string, any>);

    // Fetch user details for Stripe status
    const userProfile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            role: true,
            stripeConnectStatus: true,
            stripeAccountId: true
        }
    });

    const userRole = (userProfile as any)?.role || 'EMPLOYEE';
    let stripeStatus = (userProfile as any)?.stripeConnectStatus || 'NOT_CONNECTED';

    // Verify Stripe status if pending
    if ((userProfile as any)?.stripeAccountId && (stripeStatus === 'PENDING' || stripeStatus === 'NOT_CONNECTED')) {
        try {
            const account = await stripe.accounts.retrieve((userProfile as any).stripeAccountId);
            if (account.details_submitted) {
                stripeStatus = 'COMPLETED';
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { stripeConnectStatus: 'COMPLETED' } as any
                });
            }
        } catch (e) {
            console.error('Failed to verify Stripe account', e);
        }
    }

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment Center</h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide border-l-2 border-[#29258D] pl-3">
                        Process reimbursements, vendor payments and requisitions
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in-up">
                <StatsCard
                    title="Total Pending"
                    value={`$${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    trend={`${approvedExpenses.length + approvedInvoices.length + approvedRequisitions.length + approvedBudgets.length} items`}
                    trendUp={totalPending === 0}
                    icon={PiInvoice}
                    color="purple"
                    image="/cards/online-payment (1).png"
                />
                <StatsCard
                    title="Internal Requests"
                    value={`${approvedExpenses.length + approvedRequisitions.length}`}
                    trend={`$${(totalExpenses + totalRequisitions).toLocaleString()}`}
                    trendUp={true}
                    icon={PiUser}
                    color="blue"
                    image="/cards/accounting (1).png"
                    bgColor="#EEF2FF"
                />
                <StatsCard
                    title="Vendor Invoices"
                    value={`${approvedInvoices.length}`}
                    trend={`$${totalInvoices.toLocaleString()}`}
                    trendUp={true}
                    icon={PiBuildings}
                    color="emerald"
                    image="/cards/pos (2).png"
                    bgColor="#ECFDF5"
                />
                <StatsCard
                    title="Budget Plans"
                    value={`${approvedBudgets.length}`}
                    trend={`$${totalBudgets.toLocaleString()}`}
                    trendUp={true}
                    icon={PiFileText}
                    color="cyan"
                    image="/cards/order-processed.png"
                    bgColor="#FFFBEB"
                />
            </div>

            {/* Batch Payment Suggestion */}
            {Object.keys(expensesByUser).length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-100 rounded-xl">
                                <PiTrendUp className="text-2xl text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Batch Payment Available</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Process {Object.keys(expensesByUser).length} employee reimbursements in one batch
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(expensesByUser).slice(0, 3).map((batch: any, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-gray-700">
                                            {batch.user.name}: ${batch.total.toLocaleString()}
                                        </span>
                                    ))}
                                    {Object.keys(expensesByUser).length > 3 && (
                                        <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold">
                                            +{Object.keys(expensesByUser).length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all">
                            Process Batch
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Queue Component */}
            <PaymentQueue
                expenses={JSON.parse(JSON.stringify(approvedExpenses))}
                invoices={JSON.parse(JSON.stringify(approvedInvoices))}
                requisitions={JSON.parse(JSON.stringify(approvedRequisitions))}
                budgets={JSON.parse(JSON.stringify(approvedBudgets))}
                pendingPayments={JSON.parse(JSON.stringify(pendingPayments))}
                authorizedPayments={JSON.parse(JSON.stringify(authorizedPayments))}
                history={JSON.parse(JSON.stringify(payoutHistory))}
                userRole={userRole}
                stripeStatus={stripeStatus}
            />
        </div>
    );
}
