
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AccountingActions } from "@/components/accounting/AccountingActions";
import {
    PiBookOpenText,
    PiDownloadSimple,
    PiMagnifyingGlass,
    PiFunnel
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default async function GeneralLedgerPage({ searchParams }: { searchParams: Promise<{ p?: string, q?: string }> }) {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    const resolvedParams = await searchParams;
    const page = parseInt(resolvedParams.p || "1");
    const search = resolvedParams.q || "";
    const pageSize = 20;

    // Fetch entries with pagination
    const entries = await (prisma as any).journalEntry.findMany({
        where: search ? {
            OR: [
                { description: { contains: search, mode: 'insensitive' } },
                { reference: { contains: search, mode: 'insensitive' } },
            ]
        } : {},
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: {
            lines: {
                include: {
                    account: true
                }
            }
        }
    });

    const totalCount = await (prisma as any).journalEntry.count({
        where: search ? {
            OR: [
                { description: { contains: search, mode: 'insensitive' } },
                { reference: { contains: search, mode: 'insensitive' } },
            ]
        } : {},
    });

    const totalPages = Math.ceil(totalCount / pageSize);

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
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">General Ledger</h1>
                    <p className="text-gray-500 text-sm">
                        Total {totalCount} records found
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                        <PiDownloadSimple className="text-lg" />
                        Export to Excel
                    </Button>
                    <AccountingActions type="MANUAL_JOURNAL" />
                </div>
            </div>

            {/* Filters */}
            <form className="flex gap-4 items-center bg-white border border-gray-200 p-2 rounded-xl shadow-sm">
                <div className="relative flex-1">
                    <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                        name="q"
                        defaultValue={search}
                        type="text"
                        placeholder="Search by reference or description..."
                        className="w-full pl-10 border-none bg-transparent focus-visible:ring-0 shadow-none h-10"
                    />
                </div>
                <Button type="submit" variant="ghost" size="sm" className="px-4 font-bold text-indigo-600">
                    Search
                </Button>
            </form>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {entries.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <PiBookOpenText className="text-4xl mx-auto mb-4 opacity-30 text-gray-400" />
                        <p className="font-medium">{search ? "No matches found for your search" : "No journal entries found"}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {entries.map((entry: any) => (
                            <div key={entry.id} className="group">
                                {/* Header Row */}
                                <div className="px-6 py-4 bg-gray-50/50 flex justify-between items-center border-b border-gray-100">
                                    <div className="flex items-center gap-6">
                                        <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900">{entry.description}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{entry.reference || entry.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border",
                                            entry.status === 'POSTED'
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : entry.status === 'VOID'
                                                    ? "bg-red-50 text-red-600 border-red-100"
                                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                        )}>
                                            {entry.status}
                                        </span>
                                        <AccountingActions type="DELETE_ENTRY" entryId={entry.id} />
                                    </div>
                                </div>

                                {/* Lines Table */}
                                <div className="px-6 py-4 bg-white">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-[10px] uppercase text-gray-400 font-medium tracking-wider border-b border-gray-100">
                                                <th className="py-2 text-left w-24">Code</th>
                                                <th className="py-2 text-left">Account</th>
                                                <th className="py-2 text-right w-32">Debit</th>
                                                <th className="py-2 text-right w-32">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entry.lines.map((line: any) => (
                                                <tr key={line.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-2.5 font-mono text-gray-500 font-medium">{line.account.code}</td>
                                                    <td className="py-2.5 text-gray-900 font-medium">{line.account.name}</td>
                                                    <td className="py-2.5 text-right font-mono text-gray-700">
                                                        {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                                    </td>
                                                    <td className="py-2.5 text-right font-mono text-gray-700">
                                                        {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-50/30">
                                                <td colSpan={2} className="py-3 text-right font-bold text-gray-400 text-[10px] uppercase tracking-wider pr-4">Total</td>
                                                <td className="py-3 text-right font-mono font-bold text-gray-900 border-t border-gray-200">
                                                    {formatCurrency(entry.lines.reduce((s: number, l: any) => s + l.debit, 0))}
                                                </td>
                                                <td className="py-3 text-right font-mono font-bold text-gray-900 border-t border-gray-200">
                                                    {formatCurrency(entry.lines.reduce((s: number, l: any) => s + l.credit, 0))}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-6 py-4 border border-gray-200 rounded-xl">
                    <div className="text-xs text-gray-500 font-medium">
                        Showing page <span className="text-gray-900 font-bold">{page}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            asChild={page > 1}
                        >
                            {page > 1 ? (
                                <a href={`?p=${page - 1}${search ? `&q=${search}` : ''}`}>Previous</a>
                            ) : (
                                <span>Previous</span>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            asChild={page < totalPages}
                        >
                            {page < totalPages ? (
                                <a href={`?p=${page + 1}${search ? `&q=${search}` : ''}`}>Next</a>
                            ) : (
                                <span>Next</span>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
