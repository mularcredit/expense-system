import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PiDownloadSimple, PiCalendar, PiScales, PiPrinter } from 'react-icons/pi';

export default async function TrialBalancePage() {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    // Fetch all accounts with their balances
    const accounts = await prisma.account.findMany({
        where: { isActive: true },
        include: {
            journalLines: {
                where: {
                    entry: {
                        status: 'POSTED'
                    }
                },
                include: {
                    entry: true
                }
            }
        },
        orderBy: { code: 'asc' }
    });

    // Calculate balances for each account
    const accountBalances = accounts.map(account => {
        const totalDebit = account.journalLines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredit = account.journalLines.reduce((sum, line) => sum + line.credit, 0);

        // Determine natural balance side
        const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.type);

        const balance = isDebitNormal
            ? totalDebit - totalCredit
            : totalCredit - totalDebit;

        return {
            code: account.code,
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            debit: totalDebit,
            credit: totalCredit,
            balance: balance,
            balanceSide: isDebitNormal ? 'DEBIT' : 'CREDIT'
        };
    });

    // Calculate totals
    const totalDebits = accountBalances.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredits = accountBalances.reduce((sum, acc) => sum + acc.credit, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-12 font-sans text-gray-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Trial Balance</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Report generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-2 h-9 text-sm px-4 shadow-none">
                        <PiPrinter className="text-lg" />
                        Print
                    </Button>
                    <Button variant="outline" className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-2 h-9 text-sm px-4 shadow-none">
                        <PiDownloadSimple className="text-lg" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Summary Strip - Minimalist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-none p-5 border border-gray-200 rounded-xl bg-white">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Debits</span>
                        <span className="text-xl font-mono font-semibold text-gray-900">{formatCurrency(totalDebits)}</span>
                    </div>
                </Card>
                <Card className="shadow-none p-5 border border-gray-200 rounded-xl bg-white">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Credits</span>
                        <span className="text-xl font-mono font-semibold text-gray-900">{formatCurrency(totalCredits)}</span>
                    </div>
                </Card>
                <Card className={`shadow-none p-5 border rounded-xl bg-white ${isBalanced ? 'border-emerald-200 bg-emerald-50/10' : 'border-red-200 bg-red-50/10'}`}>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</span>
                        <div className="flex items-center gap-2">
                            {isBalanced ? (
                                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold text-sm">
                                    <PiScales className="text-lg" /> Balanced
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-red-700 font-semibold text-sm">
                                    <PiScales className="text-lg" /> Unbalanced
                                </span>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Table Card */}
            <Card className="shadow-none border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider w-24">Code</th>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider">Account Name</th>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider w-32">Type</th>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider text-right w-40">Debit</th>
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase text-xs tracking-wider text-right w-40">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {accountBalances.map((account) => (
                                <tr key={account.code} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-3.5 font-mono text-gray-500 text-xs">{account.code}</td>
                                    <td className="px-6 py-3.5 font-medium text-gray-900">{account.name}</td>
                                    <td className="px-6 py-3.5">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                            {account.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5 text-right font-mono text-gray-700">
                                        {account.debit > 0 ? formatCurrency(account.debit) : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="px-6 py-3.5 text-right font-mono text-gray-700">
                                        {account.credit > 0 ? formatCurrency(account.credit) : <span className="text-gray-300">-</span>}
                                    </td>
                                </tr>
                            ))}
                            {/* Summary Row */}
                            <tr className="bg-gray-50/50 font-semibold text-gray-900 border-t border-gray-200">
                                <td colSpan={3} className="px-6 py-4 text-right uppercase text-xs tracking-wider text-gray-500">Total</td>
                                <td className="px-6 py-4 text-right font-mono border-t-2 border-gray-300">
                                    {formatCurrency(totalDebits)}
                                </td>
                                <td className="px-6 py-4 text-right font-mono border-t-2 border-gray-300">
                                    {formatCurrency(totalCredits)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
