import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
    PiPlus,
    PiUsersThree,
    PiBuildings,
    PiMapPin,
    PiArrowRight,
    PiFileText,
    PiDownloadSimple,
    PiChartLineUp,
    PiDotsThreeVertical
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DeleteEntityButton } from "@/components/dashboard/DeleteEntityButton";

export default async function CustomersPage() {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    const customers = await prisma.customer.findMany({
        orderBy: { name: 'asc' },
        include: {
            sales: {
                select: { totalAmount: true }
            },
            payments: {
                select: { amount: true }
            }
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="space-y-8 animate-fade-in-up font-sans pb-12">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-[#0f172a] mb-1">Customer Portal</h1>
                    <p className="text-gray-500 text-sm font-medium tracking-tight border-l-2 border-[#5e48b8] pl-3">
                        Manage client relationships, receivables, and automated statements
                    </p>
                </div>
                <Link href="/dashboard/accounting/customers/new">
                    <Button className="flex items-center gap-2 shadow-lg shadow-indigo-500/20 bg-[#5e48b8] hover:bg-[#4a369d] text-white">
                        <PiPlus className="text-lg" />
                        New Customer
                    </Button>
                </Link>
            </div>

            {customers.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 mx-auto flex items-center justify-center">
                        <PiUsersThree className="text-3xl text-[#5e48b8]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">No customers yet</h3>
                        <p className="text-sm text-gray-500 mt-1">Add your first customer to start tracking sales.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#f9fafb] border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Invoiced</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Balance</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customers.map((customer) => {
                                    const totalInvoiced = customer.sales.reduce((sum, s) => sum + s.totalAmount, 0);
                                    const totalPaid = customer.payments.reduce((sum, p) => sum + p.amount, 0);
                                    const balance = totalInvoiced - totalPaid;

                                    return (
                                        <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                        {customer.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <Link href={`/dashboard/accounting/customers/${customer.id}`} className="font-semibold text-gray-900 text-sm hover:text-indigo-600">
                                                            {customer.name}
                                                        </Link>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            {customer.city || 'Juba'}, {customer.country || 'South Sudan'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-600 font-medium">
                                                {formatCurrency(totalInvoiced)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={cn(
                                                    "text-sm font-bold font-mono",
                                                    balance > 0 ? "text-rose-600" : "text-emerald-600"
                                                )}>
                                                    {formatCurrency(balance)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Link
                                                        href={`/dashboard/accounting/customers/${customer.id}/statement`}
                                                        className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1 mr-2"
                                                    >
                                                        View Statement <PiArrowRight />
                                                    </Link>
                                                    <DeleteEntityButton
                                                        id={customer.id}
                                                        entityType="customer"
                                                        entityName={customer.name}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Simple footer if needed */}
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
                        {customers.length} Customers
                    </div>
                </div>
            )}
        </div>
    );
}
