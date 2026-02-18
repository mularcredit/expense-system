
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    PiArrowLeft,
    PiPencilSimple,
    PiFileText,
    PiReceipt,
    PiTrendUp,
    PiBuildings,
    PiMapPin,
    PiPhone,
    PiEnvelope,
    PiGlobe,
    PiCurrencyDollar
} from "react-icons/pi";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EditCustomerModal } from "@/components/accounting/EditCustomerModal";

// Helper for currency formatting
const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

export default async function CustomerDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            sales: {
                orderBy: { issueDate: 'desc' },
                take: 5
            },
            payments: {
                orderBy: { paymentDate: 'desc' },
                take: 5
            }
        }
    });

    if (!customer) return redirect("/dashboard/accounting/customers");

    // Calculate Totals
    // Note: Ideally we'd use strict aggregations for accuracy over all time
    const totalSalesAgg = await prisma.sale.aggregate({
        where: { customerId: id },
        _sum: { totalAmount: true }
    });
    const totalPaymentsAgg = await prisma.customerPayment.aggregate({
        where: { customerId: id },
        _sum: { amount: true }
    });

    const totalInvoiced = totalSalesAgg._sum.totalAmount || 0;
    const totalPaid = totalPaymentsAgg._sum.amount || 0;
    const balance = totalInvoiced - totalPaid;

    return (
        <div className="space-y-8 animate-fade-in-up font-sans pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/accounting/customers"
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <PiArrowLeft className="text-xl" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            {customer.name}
                            <Badge variant={customer.isActive ? "success" : "secondary"}>
                                {customer.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </h1>
                        <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                            <PiBuildings /> {customer.city || 'No City'}, {customer.country || 'South Sudan'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Link href={`/dashboard/accounting/sales/new?customerId=${id}`}>
                        <Button variant="outline">
                            Create Invoice
                        </Button>
                    </Link>
                    <Link href={`/dashboard/accounting/customers/${id}/statement`}>
                        <Button className="gds-btn-premium">
                            View Statement
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Contact */}
                <div className="space-y-6">
                    {/* Financial Summary Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <PiCurrencyDollar className="text-lg text-indigo-600" />
                            Financial Overview
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Outstanding Balance</span>
                                <div className={`text-2xl font-bold font-mono mt-1 ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {formatCurrency(balance, customer.currency)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Billed</span>
                                    <div className="text-lg font-bold text-gray-900 font-mono mt-1">
                                        {formatCurrency(totalInvoiced, customer.currency)}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Paid</span>
                                    <div className="text-lg font-bold text-emerald-600 font-mono mt-1">
                                        {formatCurrency(totalPaid, customer.currency)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <PiBuildings className="text-lg text-indigo-600" />
                                Contact Details
                            </h3>
                            <EditCustomerModal customer={customer} />
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex items-start gap-3">
                                <PiMapPin className="text-lg text-gray-400 mt-0.5" />
                                <div>
                                    <span className="block text-gray-900 font-medium">Address</span>
                                    <span className="text-gray-500">
                                        {customer.address || "No address provided"}
                                        <br />
                                        {customer.city} {customer.country}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <PiPhone className="text-lg text-gray-400" />
                                <div>
                                    <span className="block text-gray-900 font-medium">Phone</span>
                                    <span className="text-gray-500">{customer.phone || "N/A"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <PiEnvelope className="text-lg text-gray-400" />
                                <div>
                                    <span className="block text-gray-900 font-medium">Email</span>
                                    <span className="text-gray-500">{customer.email || "N/A"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <PiGlobe className="text-lg text-gray-400" />
                                <div>
                                    <span className="block text-gray-900 font-medium">Person</span>
                                    <span className="text-gray-500">{customer.contactPerson || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Activities */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Invoices */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <PiFileText className="text-indigo-500" />
                                Recent Invoices
                            </h3>
                            <Link href={`/dashboard/accounting/customers/${id}/statement`} className="text-xs text-indigo-600 hover:underline font-medium">
                                View All
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Invoice #</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {customer.sales.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                                                No invoices yet
                                            </td>
                                        </tr>
                                    ) : (
                                        customer.sales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-3 text-gray-600">
                                                    {new Date(sale.issueDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-3 font-mono font-medium text-gray-900">
                                                    {sale.invoiceNumber}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono font-bold text-gray-900">
                                                    {formatCurrency(sale.totalAmount, sale.currency)}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sale.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        sale.status === 'PARTIAL' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-100'
                                                        }`}>
                                                        {sale.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Payments */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <PiReceipt className="text-indigo-500" />
                                Recent Payments
                            </h3>
                            <Link href={`/dashboard/accounting/customers/${id}/statement`} className="text-xs text-indigo-600 hover:underline font-medium">
                                View History
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Reference</th>
                                        <th className="px-6 py-3">Method</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {customer.payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                                                No payments found
                                            </td>
                                        </tr>
                                    ) : (
                                        customer.payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-3 text-gray-600">
                                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-3 text-gray-600 font-mono text-xs">
                                                    {payment.reference || '-'}
                                                </td>
                                                <td className="px-6 py-3 text-gray-600 capitalize">
                                                    {payment.method.replace('_', ' ').toLowerCase()}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono font-bold text-emerald-600">
                                                    {formatCurrency(payment.amount, payment.currency)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
