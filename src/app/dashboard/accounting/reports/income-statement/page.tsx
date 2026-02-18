import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PiDownloadSimple, PiCalendar, PiPrinter } from 'react-icons/pi';

export default async function IncomeStatementPage() {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    const accounts = await prisma.account.findMany({
        where: {
            isActive: true,
            type: { in: ['REVENUE', 'CONTRA_REVENUE', 'EXPENSE'] }
        },
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

        const isCreditNormal = account.type === 'REVENUE';
        const isDebitNormal = account.type === 'EXPENSE' || account.type === 'CONTRA_REVENUE';

        let balance = 0;
        if (isCreditNormal) balance = totalCredit - totalDebit;
        if (isDebitNormal) balance = totalDebit - totalCredit;

        return {
            code: account.code,
            name: account.name,
            type: account.type,
            balance: balance
        };
    });

    const revenues = accountBalances.filter(acc => acc.type === 'REVENUE');
    const returns = accountBalances.filter(acc => acc.type === 'CONTRA_REVENUE');
    const expenses = accountBalances.filter(acc => acc.type === 'EXPENSE');

    const totalRevenue = revenues.reduce((sum, acc) => sum + acc.balance, 0);
    const totalReturns = returns.reduce((sum, acc) => sum + acc.balance, 0);
    const netRevenue = totalRevenue - totalReturns;
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
    const netIncome = netRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

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
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Income Statement</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Profit & Loss for All Time
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

            {/* Profit Margin Strip - Minimalist */}
            <Card className="shadow-none border border-gray-200 rounded-xl overflow-hidden bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Net Income</span>
                    <span className={`text-3xl font-mono font-bold ${netIncome >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {formatCurrency(netIncome)}
                    </span>
                    <span className={`ml-3 text-sm font-medium px-2 py-0.5 rounded-full ${netIncome >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {profitMargin.toFixed(1)}% Margin
                    </span>
                </div>

                {/* Visualizer */}
                <div className="flex-1 max-w-lg">
                    <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                        <span>Revenue Breakdown</span>
                        <span>{formatCurrency(totalRevenue)}</span>
                    </div>
                    <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-gray-100">
                        {netIncome > 0 ? (
                            <>
                                <div className="bg-gray-400 h-full opacity-30" style={{ width: `${(totalExpenses / totalRevenue) * 100}%` }}></div>
                                <div className="bg-emerald-500 h-full" style={{ width: `${(netIncome / totalRevenue) * 100}%` }}></div>
                            </>
                        ) : (
                            <div className="bg-red-500 h-full w-full opacity-80"></div>
                        )}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Revenue Column */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Revenue</h2>
                    <Card className="shadow-none border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-500 text-xs w-16">Code</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left">Account</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 text-xs text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {revenues.map((account) => (
                                    <tr key={account.code} className="hover:bg-emerald-50/10 transition-colors">
                                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">{account.code}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{account.name}</td>
                                        <td className="px-4 py-3 text-right font-mono text-emerald-700 font-medium">{formatCurrency(account.balance)}</td>
                                    </tr>
                                ))}
                                {returns.map((account) => (
                                    <tr key={account.code} className="hover:bg-gray-50/50 transition-colors bg-amber-50/10">
                                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">{account.code}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{account.name} (Return)</td>
                                        <td className="px-4 py-3 text-right font-mono text-amber-700 font-medium">({formatCurrency(account.balance)})</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50/30 border-t border-gray-200">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Net Revenue</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 border-t-2 border-gray-300">{formatCurrency(netRevenue)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </Card>
                </div>

                {/* Expenses Column */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Expenses</h2>
                    <Card className="shadow-none border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-500 text-xs w-16">Code</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 text-xs text-left">Account</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 text-xs text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {expenses.map((account) => (
                                    <tr key={account.code} className="hover:bg-red-50/10 transition-colors">
                                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">{account.code}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{account.name}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(account.balance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50/30 border-t border-gray-200">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Total Expenses</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 border-t-2 border-gray-300">{formatCurrency(totalExpenses)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </Card>
                </div>
            </div>
        </div>
    );
}
