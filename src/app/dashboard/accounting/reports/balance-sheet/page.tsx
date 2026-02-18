import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PiDownloadSimple, PiCalendar, PiPrinter } from 'react-icons/pi';

export default async function BalanceSheetPage() {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    const accounts = await prisma.account.findMany({
        where: { isActive: true },
        include: {
            journalLines: {
                where: {
                    entry: { status: 'POSTED' }
                },
                include: { entry: true }
            }
        },
        orderBy: { code: 'asc' }
    });

    const accountBalances = accounts.map(account => {
        const totalDebit = account.journalLines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredit = account.journalLines.reduce((sum, line) => sum + line.credit, 0);

        // ASSET and EXPENSE accounts are Debit-normal (D-C)
        // LIABILITY, EQUITY, and REVENUE accounts are Credit-normal (C-D)
        const isDebitNormal = account.type === 'ASSET' || account.type === 'EXPENSE';
        const balance = isDebitNormal ? totalDebit - totalCredit : totalCredit - totalDebit;

        return {
            code: account.code,
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            balance: balance
        };
    });

    // Include accounts with balances (even if negative, like bank overdrafts)
    const assets = accountBalances.filter(acc => acc.type === 'ASSET' && acc.balance !== 0);
    const liabilities = accountBalances.filter(acc => acc.type === 'LIABILITY' && acc.balance !== 0);
    const equity = accountBalances.filter(acc => acc.type === 'EQUITY' && acc.balance !== 0);

    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

    const revenues = accountBalances.filter(acc => acc.type === 'REVENUE' || acc.type === 'CONTRA_REVENUE');
    const expenses = accountBalances.filter(acc => acc.type === 'EXPENSE');
    const totalRevenue = revenues.filter(acc => acc.type === 'REVENUE').reduce((sum, acc) => sum + acc.balance, 0);
    const totalReturns = revenues.filter(acc => acc.type === 'CONTRA_REVENUE').reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
    const netIncome = totalRevenue - totalReturns - totalExpenses;

    const totalEquityWithIncome = totalEquity + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithIncome;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-12 font-sans text-gray-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Balance Sheet</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Financial Position as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Assets */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Assets</h2>
                    </div>

                    <Card className="shadow-none border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-500 text-xs w-16">Code</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left">Account</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 text-xs text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {assets.map((account) => (
                                    <tr key={account.code} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">{account.code}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{account.name}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(account.balance)}</td>
                                    </tr>
                                ))}
                                {assets.length === 0 && (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs italic">No assets found</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50/30 border-t border-gray-200">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Total Assets</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 border-t-2 border-gray-300">{formatCurrency(totalAssets)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </Card>
                </div>

                {/* Right Column: Liabilities & Equity */}
                <div className="space-y-8">
                    {/* Liabilities Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Liabilities</h2>
                        </div>
                        <Card className="shadow-none border border-gray-200 rounded-xl overflow-hidden bg-white">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-xs w-16">Code</th>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left">Account</th>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-xs text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {liabilities.map((account) => (
                                        <tr key={account.code} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-gray-400 text-xs">{account.code}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{account.name}</td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(account.balance)}</td>
                                        </tr>
                                    ))}
                                    {liabilities.length === 0 && (
                                        <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs italic">No liabilities found</td></tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-gray-50/30 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Total Liabilities</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 border-t-2 border-gray-300">{formatCurrency(totalLiabilities)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </Card>
                    </div>

                    {/* Equity Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Equity</h2>
                        </div>
                        <Card className="shadow-none border border-gray-200 rounded-xl overflow-hidden bg-white">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-xs w-16">Code</th>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left">Account</th>
                                        <th className="px-4 py-3 font-medium text-gray-500 text-xs text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {equity.map((account) => (
                                        <tr key={account.code} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-gray-400 text-xs">{account.code}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{account.name}</td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(account.balance)}</td>
                                        </tr>
                                    ))}
                                    {/* Net Income Row */}
                                    <tr className="bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-gray-400 text-xs"></td>
                                        <td className="px-4 py-3 font-medium text-gray-900">Net Income (Current Period)</td>
                                        <td className={`px-4 py-3 text-right font-mono font-bold ${netIncome >= 0 ? 'text-gray-900' : 'text-red-700'}`}>{formatCurrency(netIncome)}</td>
                                    </tr>
                                </tbody>
                                <tfoot className="bg-gray-50/30 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Total Equity</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 border-t-2 border-gray-300">{formatCurrency(totalEquityWithIncome)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </Card>
                    </div>

                    {/* Final Totals */}
                    <div className="flex justify-between items-center py-4 border-t border-gray-300 mt-8">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Liabilities & Equity</span>
                        <span className="text-xl font-mono font-bold text-gray-900 border-b-4 border-double border-gray-300 pb-1">{formatCurrency(totalLiabilitiesAndEquity)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
