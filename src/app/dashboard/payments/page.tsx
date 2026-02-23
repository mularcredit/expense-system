import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
    PiTrendUp,
    PiHandCoins
} from "react-icons/pi";
import { PaymentQueue } from "../../../components/dashboard/PaymentQueue";
import { stripe } from "@/lib/stripe";

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-gds-text-main mb-2 tracking-tight">
                        Payment Center
                    </h1>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide border-l-2 border-[#5e48b8] pl-3">
                        Process reimbursements, vendor payments and requisitions
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                {/* Total Pending */}
                <div className="relative rounded-2xl border border-gray-100 overflow-hidden p-5 pb-4 flex flex-col justify-between min-h-[136px] bg-white group cursor-pointer hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-start justify-between">
                        <p className="text-[13px] font-semibold text-gray-600">Total Pending</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                            {approvedExpenses.length + approvedInvoices.length + approvedRequisitions.length + approvedBudgets.length} items
                        </span>
                    </div>
                    <div className="flex items-end justify-between mt-3">
                        <div className="text-[1.75rem] font-normal text-gray-500 leading-none tracking-tight">
                            ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="shrink-0 w-[80px] h-[80px] -mb-4 -mr-2 group-hover:scale-105 transition-transform duration-300">
                            <img src="/cards/online-payment (1).png" alt="" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                    </div>
                </div>

                {/* Internal Requests */}
                <div className="relative rounded-2xl border border-gray-100 overflow-hidden p-5 pb-4 flex flex-col justify-between min-h-[136px] group cursor-pointer hover:-translate-y-0.5 transition-all duration-300" style={{ backgroundColor: '#EEF2FF' }}>
                    <div className="flex items-start justify-between">
                        <p className="text-[13px] font-semibold text-gray-600">Internal Requests</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                            ${(totalExpenses + totalRequisitions).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-end justify-between mt-3">
                        <div className="text-[1.75rem] font-normal text-gray-500 leading-none tracking-tight">
                            {approvedExpenses.length + approvedRequisitions.length}
                        </div>
                        <div className="shrink-0 w-[80px] h-[80px] -mb-4 -mr-2 group-hover:scale-105 transition-transform duration-300">
                            <img src="/cards/accounting (1).png" alt="" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                    </div>
                </div>

                {/* Vendor Invoices */}
                <div className="relative rounded-2xl border border-gray-100 overflow-hidden p-5 pb-4 flex flex-col justify-between min-h-[136px] group cursor-pointer hover:-translate-y-0.5 transition-all duration-300" style={{ backgroundColor: '#ECFDF5' }}>
                    <div className="flex items-start justify-between">
                        <p className="text-[13px] font-semibold text-gray-600">Vendor Invoices</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                            ${totalInvoices.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-end justify-between mt-3">
                        <div className="text-[1.75rem] font-normal text-gray-500 leading-none tracking-tight">
                            {approvedInvoices.length}
                        </div>
                        <div className="shrink-0 w-[80px] h-[80px] -mb-4 -mr-2 group-hover:scale-105 transition-transform duration-300">
                            <img src="/online-shopping.png" alt="" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                    </div>
                </div>

                {/* Budget Plans */}
                <div className="relative rounded-2xl border border-gray-100 overflow-hidden p-5 pb-4 flex flex-col justify-between min-h-[136px] group cursor-pointer hover:-translate-y-0.5 transition-all duration-300" style={{ backgroundColor: '#FFFBEB' }}>
                    <div className="flex items-start justify-between">
                        <p className="text-[13px] font-semibold text-gray-600">Budget Plans</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                            ${totalBudgets.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-end justify-between mt-3">
                        <div className="text-[1.75rem] font-normal text-gray-500 leading-none tracking-tight">
                            {approvedBudgets.length}
                        </div>
                        <div className="shrink-0 w-[80px] h-[80px] -mb-4 -mr-2 group-hover:scale-105 transition-transform duration-300">
                            <img src="/cards/order-processed.png" alt="" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                    </div>
                </div>

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
