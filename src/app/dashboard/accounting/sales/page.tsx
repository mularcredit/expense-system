
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    PiTrendUp,
    PiClock,
    PiPlus,
    PiCheckCircle,
    PiArrowRight,
    PiDownloadSimple
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";

import { SalesFilter } from "@/components/dashboard/SalesFilter";

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ query?: string, status?: string, customerId?: string, dateRange?: string }> }) {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    const params = await searchParams;
    const query = params.query || "";
    const status = (params.status || "ALL").toUpperCase();
    const customerId = params.customerId || "ALL";
    const dateRange = params.dateRange || "ALL";

    const where: any = {};

    // Status Filter
    if (status !== 'ALL') {
        where.status = status;
    }

    // Customer Filter
    if (customerId !== 'ALL') {
        where.customerId = customerId;
    }

    // Date Range Filter
    if (dateRange !== 'ALL') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const startOfLast3Months = new Date(now.getFullYear(), now.getMonth() - 2, 1);

        switch (dateRange) {
            case 'THIS_MONTH':
                where.issueDate = { gte: startOfMonth };
                break;
            case 'LAST_MONTH':
                where.issueDate = { gte: startOfLastMonth, lte: endOfLastMonth };
                break;
            case 'LAST_3_MONTHS':
                where.issueDate = { gte: startOfLast3Months };
                break;
            case 'THIS_YEAR':
                where.issueDate = { gte: startOfYear };
                break;
        }
    }

    // Search Query
    if (query) {
        where.OR = [
            { invoiceNumber: { contains: query, mode: 'insensitive' } },
            // If customer filter is NOT active, allow searching customer name text
            ...(customerId === 'ALL' ? [{ customer: { name: { contains: query, mode: 'insensitive' } } }] : [])
        ];
    }

    const [sales, customers] = await Promise.all([
        prisma.sale.findMany({
            where,
            orderBy: { issueDate: 'desc' },
            include: { customer: true }
        }),
        prisma.customer.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        })
    ]);

    const totalRevenue = sales
        .filter((s: any) => s.status !== 'DRAFT' && s.status !== 'CANCELLED')
        .reduce((acc: number, sale: any) => acc + sale.totalAmount, 0);

    const outstandingAmount = sales
        .filter((s: any) => s.status !== 'PAID' && s.status !== 'DRAFT' && s.status !== 'CANCELLED')
        .reduce((acc: number, sale: any) => acc + sale.totalAmount, 0);

    const paidCount = sales.filter((s: any) => s.status === 'PAID').length;
    const paymentRate = sales.length > 0 ? (paidCount / sales.length) * 100 : 0;

    return (
        <div className="space-y-8 animate-fade-in-up font-sans pb-12">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Sales & Income</h2>
                    <p className="text-gray-500 text-xs font-medium tracking-wide border-l-2 border-[var(--gds-emerald)] pl-3">
                        Manage invoices, track revenue, and monitor collection.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                        <PiDownloadSimple className="text-lg" />
                        Export
                    </Button>
                    <Link href="/dashboard/accounting/sales/new">
                        <Button className="bg-[var(--gds-primary)] text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2 hover:bg-[var(--gds-primary)]/90">
                            <PiPlus className="text-lg" />
                            Record Sale
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="gds-glass p-6 border-l-4 border-l-[var(--gds-emerald)]">
                    <p className="text-[10px] font-bold text-gds-text-muted uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-3xl font-heading font-bold text-[var(--gds-emerald)]">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gds-text-muted">
                        <PiTrendUp className="text-[var(--gds-emerald)]" />
                        <span>Aggregated Sales Volume</span>
                    </div>
                </div>

                <div className="gds-glass p-6 border-l-4 border-l-amber-400">
                    <p className="text-[10px] font-bold text-gds-text-muted uppercase tracking-widest mb-1">Outstanding</p>
                    <p className="text-3xl font-heading font-bold text-amber-500">${outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gds-text-muted">
                        <PiClock className="text-amber-500" />
                        <span>Unpaid Invoices</span>
                    </div>
                </div>

                <div className="gds-glass p-6 border-l-4 border-l-blue-500">
                    <p className="text-[10px] font-bold text-gds-text-muted uppercase tracking-widest mb-1">Payment Rate</p>
                    <p className="text-3xl font-heading font-bold text-blue-600">{paymentRate.toFixed(1)}%</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gds-text-muted">
                        <PiCheckCircle className="text-blue-600" />
                        <span>Invoices captured as Paid</span>
                    </div>
                </div>
            </div>

            <SalesFilter customers={customers} />

            {/* Sales Table */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Invoice #</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sales.map((sale: any) => (
                            <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer text-xs">
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                        sale.status === 'PAID' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            sale.status === 'DRAFT' ? "bg-gray-50 text-gray-500 border-gray-200" :
                                                sale.status === 'OVERDUE' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                    "bg-amber-50 text-amber-600 border-amber-100"
                                    )}>
                                        {sale.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-[11px] font-bold text-gray-400 group-hover:text-[var(--gds-primary)] transition-colors">
                                    <Link href={`/dashboard/accounting/sales/${sale.id}`} className="hover:underline">
                                        {sale.invoiceNumber}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-medium">
                                    {format(new Date(sale.issueDate), "dd MMM yyyy")}
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">
                                    {sale.customer.name}
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                    ${sale.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/dashboard/accounting/sales/${sale.id}`} className="inline-block p-2 -m-2">
                                        <PiArrowRight className="text-gray-300 group-hover:text-[var(--gds-primary)] text-lg" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sales.length === 0 && (
                    <div className="p-12 text-center text-gray-400 text-sm">
                        No sales records found matching your filters.
                    </div>
                )}
            </div>
        </div>
    );
}
