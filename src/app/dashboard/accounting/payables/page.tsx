import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
    PiInvoice,
    PiClock,
    PiCheckCircle,
    PiWarning,
    PiTrendUp,
    PiCalendar,
    PiBuildings,
    PiCurrencyDollar
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { PayableInvoiceCard } from "@/components/accounting/PayableInvoiceCard";

export default async function AccountsPayablePage() {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    const invoices = await prisma.invoice.findMany({
        include: {
            vendor: true
        },
        orderBy: { dueDate: 'asc' }
    });

    const totalPayable = invoices
        .filter(i => i.status !== 'PAID')
        .reduce((sum, inv) => sum + inv.amount, 0);

    const overdue = invoices.filter(i =>
        new Date(i.dueDate) < new Date() && i.status !== 'PAID'
    );

    const dueThisWeek = invoices.filter(i => {
        const due = new Date(i.dueDate);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return due <= weekFromNow && due >= new Date() && i.status !== 'PAID';
    });

    const pending = invoices.filter(i => i.status === 'PENDING_APPROVAL');

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-heading font-bold text-gds-text-main mb-2 tracking-tight">
                    Accounts Payable
                </h1>
                <p className="text-gds-text-muted text-sm font-medium tracking-wide border-l-2 border-[#5e48b8] pl-3">
                    Vendor invoices and payment obligations
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="gds-glass p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <PiCurrencyDollar className="text-2xl text-purple-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Payable</span>
                    </div>
                    <p className="text-3xl font-heading font-bold text-gray-900 mb-1">
                        ${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Outstanding balance</p>
                </div>

                <div className="gds-glass p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-rose-100 rounded-xl">
                            <PiWarning className="text-2xl text-rose-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overdue</span>
                    </div>
                    <p className="text-3xl font-heading font-bold text-rose-600 mb-1">
                        {overdue.length}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                        ${overdue.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                    </p>
                </div>

                <div className="gds-glass p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-100 rounded-xl">
                            <PiClock className="text-2xl text-amber-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Due This Week</span>
                    </div>
                    <p className="text-3xl font-heading font-bold text-amber-600 mb-1">
                        {dueThisWeek.length}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                        ${dueThisWeek.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                    </p>
                </div>

                <div className="gds-glass p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <PiCheckCircle className="text-2xl text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Approval</span>
                    </div>
                    <p className="text-3xl font-heading font-bold text-blue-600 mb-1">
                        {pending.length}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Awaiting review</p>
                </div>
            </div>

            {/* Overdue Invoices */}
            {overdue.length > 0 && (
                <div className="gds-glass p-0 overflow-hidden border-l-4 border-rose-500">
                    <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
                        <PiWarning className="text-xl text-rose-600" />
                        <h2 className="font-bold text-lg text-rose-900">Overdue Invoices</h2>
                        <span className="ml-auto px-2.5 py-0.5 bg-rose-600 text-white text-xs font-bold rounded-full">
                            {overdue.length}
                        </span>
                    </div>
                    <div className="p-6 space-y-3">
                        {overdue.slice(0, 5).map(invoice => (
                            <PayableInvoiceCard
                                key={invoice.id}
                                invoice={invoice}
                                variant="overdue"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Due This Week */}
            {dueThisWeek.length > 0 && (
                <div className="gds-glass p-0 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                        <PiCalendar className="text-xl text-amber-600" />
                        <h2 className="font-bold text-lg text-gray-900">Due This Week</h2>
                        <span className="ml-auto px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                            {dueThisWeek.length}
                        </span>
                    </div>
                    <div className="p-6 space-y-3">
                        {dueThisWeek.map(invoice => (
                            <PayableInvoiceCard
                                key={invoice.id}
                                invoice={invoice}
                                variant="upcoming"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
