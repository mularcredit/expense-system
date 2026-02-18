
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AccountingActions } from "@/components/accounting/AccountingActions";
import {
    PiList,
    PiPlus,
    PiBank,
    PiFiles,
    PiTrendUp,
    PiTrendDown,
    PiWallet,
    PiCreditCard,
    PiArchive
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

// Helper to map account types to colors/icons
const getTypeConfig = (type: string) => {
    switch (type) {
        case 'ASSET': return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: PiWallet };
        case 'LIABILITY': return { color: 'text-rose-600', bg: 'bg-rose-50', icon: PiCreditCard };
        case 'EQUITY': return { color: 'text-blue-600', bg: 'bg-blue-50', icon: PiBank };
        case 'REVENUE': return { color: 'text-indigo-600', bg: 'bg-indigo-50', icon: PiTrendUp };
        case 'EXPENSE': return { color: 'text-amber-600', bg: 'bg-amber-50', icon: PiTrendDown };
        default: return { color: 'text-gray-600', bg: 'bg-gray-50', icon: PiFiles };
    }
};

export default async function ChartOfAccountsPage() {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    const accounts = await prisma.account.findMany({
        orderBy: { code: 'asc' }
    });

    // Group by type for a better view
    const grouped = accounts.reduce((acc: any, account: any) => {
        if (!acc[account.type]) acc[account.type] = [];
        acc[account.type].push(account);
        return acc;
    }, {} as Record<string, typeof accounts>);

    const typeOrder = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

    return (
        <div className="space-y-8 animate-fade-in-up font-sans pb-12">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Chart of Accounts</h1>
                    <p className="text-gray-500 text-sm">
                        Manage your general ledger accounts and GL codes
                    </p>
                </div>
                <AccountingActions type="NEW_ACCOUNT" />
            </div>

            <div className="space-y-6">
                {typeOrder.map(type => {
                    const typeAccounts = grouped[type] || [];
                    if (typeAccounts.length === 0) return null;
                    const config = getTypeConfig(type);

                    return (
                        <div key={type} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200 flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", config.bg, config.color)}>
                                    <config.icon className="text-xl" />
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">{type}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-400 font-mono font-bold shadow-sm">
                                    {typeAccounts.length}
                                </span>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-white border-b border-gray-100/50">
                                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        <th className="px-6 py-3 w-32 font-medium">Code</th>
                                        <th className="px-6 py-3 font-medium">Account Name</th>
                                        <th className="px-6 py-3 font-medium">Subtype</th>
                                        <th className="px-6 py-3 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {typeAccounts.map((account: any) => (
                                        <tr key={account.id} className="text-sm hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-3.5 px-6 font-mono font-bold text-gray-500 group-hover:text-[#29258D] transition-colors">
                                                {account.code}
                                            </td>
                                            <td className="px-6 py-3.5 font-bold text-gray-900">
                                                {account.name}
                                            </td>
                                            <td className="px-6 py-3.5 text-xs text-gray-500 font-medium uppercase tracking-wide">
                                                {account.subtype?.replace('_', ' ')}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                {account.isActive ? (
                                                    <Badge variant="success" className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border border-emerald-100">
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-500 border border-gray-200">
                                                        Archived
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
