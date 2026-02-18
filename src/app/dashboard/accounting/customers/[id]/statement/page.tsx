
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    PiArrowLeft,
    PiTable,
    PiFileText,
    PiChartPieSlice,
    PiLightning,
    PiMagicWand,
    PiGear,
    PiInfo
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { StatementFilterForm } from "@/components/accounting/StatementFilterForm";
import { RecordPaymentButton } from "@/components/accounting/RecordPaymentButton";
import { CreateCreditNoteButton } from "@/components/accounting/CreateCreditNoteButton";

// Format currency
const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

export default async function CustomerStatementPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    const { id } = await params;
    const query = await searchParams;

    // Date Logic
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const startDateStr = (query?.from as string) || firstDay.toISOString().split('T')[0];
    const endDateStr = (query?.to as string) || now.toISOString().split('T')[0];

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const endDateInclusive = new Date(endDate);
    endDateInclusive.setHours(23, 59, 59, 999);

    // 1. Calculate Opening Balance
    const prevSales = await prisma.sale.aggregate({
        where: {
            customerId: id,
            issueDate: { lt: startDate }
        },
        _sum: { totalAmount: true }
    });

    const prevPayments = await prisma.customerPayment.aggregate({
        where: {
            customerId: id,
            paymentDate: { lt: startDate }
        },
        _sum: { amount: true }
    });

    const prevCreditNotes = await prisma.creditNote.aggregate({
        where: {
            customerId: id,
            createdAt: { lt: startDate },
            status: { not: 'VOIDED' }
        },
        _sum: { amount: true }
    });

    const openingBalance = (prevSales._sum.totalAmount || 0) - (prevPayments._sum.amount || 0) - (prevCreditNotes._sum.amount || 0);

    // 2. Fetch Customer Details and Transactions
    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            sales: {
                where: {
                    issueDate: {
                        gte: startDate,
                        lte: endDateInclusive
                    }
                },
                orderBy: { issueDate: 'asc' },
                include: { items: true }
            },
            payments: {
                where: {
                    paymentDate: {
                        gte: startDate,
                        lte: endDateInclusive
                    }
                },
                orderBy: { paymentDate: 'asc' }
            },
            creditNotes: {
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDateInclusive
                    },
                    status: { not: 'VOIDED' }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!customer) return redirect("/dashboard/accounting/customers");

    // 3. Fetch unpaid/partial sales for payment allocation
    const unpaidSales = await prisma.sale.findMany({
        where: {
            customerId: id,
            status: {
                not: 'PAID'
            }
        },
        orderBy: { issueDate: 'desc' },
        select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            issueDate: true,
            status: true
        }
    });

    const periodInvoiced = customer.sales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);
    const periodPaid = customer.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const periodCreditNotes = customer.creditNotes.reduce((sum: number, cn: any) => sum + cn.amount, 0);
    const endingBalance = openingBalance + periodInvoiced - periodPaid - periodCreditNotes;

    const transactions = [
        ...customer.sales.map((s: any) => ({
            id: s.id,
            date: s.issueDate,
            type: 'INVOICE',
            reference: s.invoiceNumber,
            description: 'Sales Invoice',
            debit: s.totalAmount,
            credit: 0
        })),
        ...customer.payments.map((p: any) => ({
            id: p.id,
            date: p.paymentDate,
            type: 'PAYMENT',
            reference: p.reference || 'PAYMENT',
            description: `Payment via ${p.method.replace('_', ' ')}`,
            debit: 0,
            credit: p.amount
        })),
        ...customer.creditNotes.map((cn: any) => ({
            id: cn.id,
            date: cn.createdAt,
            type: 'CREDIT_NOTE',
            reference: cn.cnNumber,
            description: `Credit Note - ${cn.reason}`,
            debit: 0,
            credit: cn.amount
        }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = openingBalance;
    const statementRows = transactions.map(t => {
        runningBalance += t.debit - t.credit;
        return { ...t, balance: runningBalance };
    });

    return (
        <div className="space-y-8 animate-fade-in-up pb-20 font-sans w-full">
            {/* Header / Actions - Responsive Wrap */}
            <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-5">
                    <Link
                        href="/dashboard/accounting/customers"
                        className="p-3 rounded-2xl bg-white hover:bg-gray-50 text-gray-400 hover:text-[#5e48b8] transition-all border border-gray-200"
                    >
                        <PiArrowLeft className="text-xl" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100/50">
                                Transaction history
                            </span>
                        </div>
                        <h1 className="text-3xl font-heading font-bold text-[#0f172a]">
                            {customer.name}
                        </h1>
                        <p className="text-xs text-gray-400 font-medium">
                            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                        </p>
                    </div>
                </div>


                <div className="flex items-center gap-3">
                    <CreateCreditNoteButton
                        customerId={id}
                        customerName={customer.name}
                        currency={customer.currency}
                        sales={unpaidSales}
                    />
                    <RecordPaymentButton
                        customerId={id}
                        customerName={customer.name}
                        currency={customer.currency}
                        unpaidSales={unpaidSales}
                    />
                    <Link
                        href={`/finance-studio?type=STATEMENT&customerId=${id}&from=${startDateStr}&to=${endDateStr}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#29258D] hover:bg-[#29258D]/90 text-white text-xs font-medium border border-[#29258D]/20 transition-all hover:-translate-y-0.5"
                    >
                        <PiMagicWand className="text-lg" />
                        Statement studio
                    </Link>
                </div>
            </div>

            {/* Filter Form */}
            <div>
                <StatementFilterForm />
            </div>

            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200">
                        <p className="text-[10px] font-bold text-gray-400 mb-2">Opening balance</p>
                        <p className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(openingBalance, customer.currency)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200">
                        <p className="text-[10px] font-bold text-gray-400 mb-2">Total invoiced</p>
                        <p className="text-xl font-bold text-gray-900 font-mono">{formatCurrency(periodInvoiced, customer.currency)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200">
                        <p className="text-[10px] font-bold text-emerald-500 mb-2">Total received</p>
                        <p className="text-xl font-bold text-emerald-600 font-mono">{formatCurrency(periodPaid, customer.currency)}</p>
                    </div>
                    <div className="bg-[#5e48b8] p-6 rounded-2xl border border-white/10 text-white">
                        <p className="text-[10px] font-bold opacity-80 mb-2">Ending balance</p>
                        <p className="text-xl font-bold font-mono">{formatCurrency(endingBalance, customer.currency)}</p>
                    </div>
                </div>

                {/* Report Table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <img src="/shopping.png" alt="Shopping" className="w-6 h-6 object-contain" />
                            Transactions
                        </h3>
                        <span className="text-xs text-gray-400 font-medium">{statementRows.length} activities found</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="py-4 px-6 text-left font-bold text-gray-400 text-[10px]">Date</th>
                                    <th className="py-4 px-6 text-left font-bold text-gray-400 text-[10px]">Reference</th>
                                    <th className="py-4 px-6 text-left font-bold text-gray-400 text-[10px]">Description</th>
                                    <th className="py-4 px-6 text-right font-bold text-gray-400 text-[10px]">Debit</th>
                                    <th className="py-4 px-6 text-right font-bold text-gray-400 text-[10px]">Credit</th>
                                    <th className="py-4 px-6 text-right font-bold text-gray-400 text-[10px]">Running balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr className="bg-gray-50/20 italic">
                                    <td className="py-4 px-6" colSpan={3}>
                                        <span className="text-xs font-bold text-gray-400">Opening balance</span>
                                    </td>
                                    <td className="py-4 px-6 text-right font-mono text-gray-400" colSpan={3}>
                                        {formatCurrency(openingBalance, customer.currency)}
                                    </td>
                                </tr>
                                {statementRows.map((row) => (
                                    <tr
                                        key={`${row.type}-${row.id}`}
                                        className="even:bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="py-4 px-6 text-gray-600 font-medium whitespace-nowrap">
                                            {format(new Date(row.date), "dd MMM yyyy")}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-2 py-1 bg-white border border-gray-100 rounded-md font-mono text-[10px] font-bold text-gray-500 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors shadow-sm shadow-black/[0.02]">
                                                {row.reference}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-700 font-medium">
                                            {row.description}
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono font-bold text-gray-900">
                                            {row.debit > 0 ? formatCurrency(row.debit, customer.currency) : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono font-bold text-emerald-600">
                                            {row.credit > 0 ? formatCurrency(row.credit, customer.currency) : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono font-bold text-[#0f172a] bg-gray-50/30 group-hover:bg-indigo-100/30 transition-colors">
                                            {formatCurrency(row.balance, customer.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
