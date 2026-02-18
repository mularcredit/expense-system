import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PiDownloadSimple, PiPrinter, PiArrowsLeftRight } from 'react-icons/pi';

export default async function CashFlowPage() {
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
            id: account.id,
            code: account.code,
            name: account.name,
            type: account.type,
            subtype: account.subtype,
            balance: balance
        };
    });

    // Helper to identify Cash accounts
    const isCashAccount = (acc: typeof accountBalances[0]) => {
        if (acc.type !== 'ASSET') return false;
        const name = acc.name.toLowerCase();
        return name.includes('bank') || name.includes('cash') || name.includes('wallet') || name.includes('pesa') || name.includes('stripe');
    };

    const cashAccounts = accountBalances.filter(a => isCashAccount(a));
    const totalCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

    // 1. Operating Activities
    const revenues = accountBalances.filter(acc => acc.type === 'REVENUE' || acc.type === 'CONTRA_REVENUE');
    const expenses = accountBalances.filter(acc => acc.type === 'EXPENSE');

    // Net Income
    const totalRevenue = revenues.filter(acc => acc.type === 'REVENUE').reduce((sum, acc) => sum + acc.balance, 0);
    const totalReturns = revenues.filter(acc => acc.type === 'CONTRA_REVENUE').reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
    const netIncome = totalRevenue - totalReturns - totalExpenses;

    // Adjustments
    const depreciation = expenses.filter(a => a.name.toLowerCase().includes('depreciation'));
    const depreciationAddBack = depreciation.reduce((sum, a) => sum + a.balance, 0);

    // Working Capital Changes
    // Receivables (Asset) -> Increase is Cash Out (Subtract)
    const receivables = accountBalances.filter(a => a.type === 'ASSET' && !isCashAccount(a) && (
        (a.subtype && a.subtype.toUpperCase() === 'RECEIVABLE') ||
        a.name.toLowerCase().includes('receivable')
    ));
    const changeReceivables = receivables.reduce((sum, a) => sum + a.balance, 0);

    // Payables (Liability) -> Increase is Cash In (Add)
    const payables = accountBalances.filter(a => a.type === 'LIABILITY' && (
        (a.subtype && a.subtype.toUpperCase() === 'PAYABLE') ||
        a.name.toLowerCase().includes('payable')
    ));
    const changePayables = payables.reduce((sum, a) => sum + a.balance, 0);

    const operatingCashFlow = netIncome + depreciationAddBack + changePayables - changeReceivables;

    // 2. Investing Activities
    // Fixed Assets (Asset) -> Purchase is Cash Out (Subtract)
    const fixedAssets = accountBalances.filter(a => a.type === 'ASSET' && !isCashAccount(a) && !receivables.includes(a));
    const investingCashFlow = -1 * fixedAssets.reduce((sum, a) => sum + a.balance, 0);

    // 3. Financing Activities
    // Loans & Equity
    const loans = accountBalances.filter(a => a.type === 'LIABILITY' && !payables.includes(a));
    const equity = accountBalances.filter(a => a.type === 'EQUITY');

    const changeLoans = loans.reduce((sum, a) => sum + a.balance, 0);
    const changeEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    const financingCashFlow = changeLoans + changeEquity;

    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

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
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
                        <PiArrowsLeftRight className="text-indigo-600" />
                        Cash Flow Statement
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Cash Flow for All Time
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border border-gray-100 shadow-sm bg-indigo-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Operating Activities</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${operatingCashFlow >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                        {formatCurrency(operatingCashFlow)}
                    </p>
                </Card>
                <Card className="p-4 border border-gray-100 shadow-sm bg-blue-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Investing Activities</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${investingCashFlow >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                        {formatCurrency(investingCashFlow)}
                    </p>
                </Card>
                <Card className="p-4 border border-gray-100 shadow-sm bg-purple-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Financing Activities</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${financingCashFlow >= 0 ? 'text-purple-700' : 'text-red-600'}`}>
                        {formatCurrency(financingCashFlow)}
                    </p>
                </Card>
                <Card className="p-4 border border-indigo-200 shadow-sm bg-white ring-1 ring-indigo-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Net Cash Increase</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(netCashFlow)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Calculated vs Actual: {formatCurrency(totalCash)}</p>
                </Card>
            </div>

            {/* Detailed Statement */}
            <Card className="shadow-none border border-gray-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500 text-xs text-left">Description</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-xs text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {/* Operating */}
                        <tr className="bg-gray-50/30">
                            <td colSpan={2} className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Operating Activities</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-3 text-gray-900 font-medium pl-8">Net Income</td>
                            <td className="px-6 py-3 text-right font-mono text-gray-900">{formatCurrency(netIncome)}</td>
                        </tr>
                        {depreciationAddBack !== 0 && (
                            <tr>
                                <td className="px-6 py-3 text-gray-600 pl-8">Adjustments: Depreciation</td>
                                <td className="px-6 py-3 text-right font-mono text-gray-600">{formatCurrency(depreciationAddBack)}</td>
                            </tr>
                        )}
                        <tr>
                            <td className="px-6 py-3 text-gray-600 pl-8">Change in Accounts Receivable</td>
                            <td className="px-6 py-3 text-right font-mono text-gray-600">({formatCurrency(changeReceivables)})</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-3 text-gray-600 pl-8">Change in Accounts Payable</td>
                            <td className="px-6 py-3 text-right font-mono text-gray-600">{formatCurrency(changePayables)}</td>
                        </tr>
                        <tr className="bg-indigo-50/10 font-bold">
                            <td className="px-6 py-3 text-indigo-900 pl-8">Net Cash provided by Operating Activities</td>
                            <td className="px-6 py-3 text-right font-mono text-indigo-900 border-t border-indigo-100">{formatCurrency(operatingCashFlow)}</td>
                        </tr>

                        {/* Investing */}
                        <tr className="bg-gray-50/30">
                            <td colSpan={2} className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mt-4">Investing Activities</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-3 text-gray-600 pl-8">Net Purchases of Fixed Assets</td>
                            <td className="px-6 py-3 text-right font-mono text-gray-600">({formatCurrency(Math.abs(investingCashFlow))})</td>
                        </tr>
                        <tr className="bg-blue-50/10 font-bold">
                            <td className="px-6 py-3 text-blue-900 pl-8">Net Cash used in Investing Activities</td>
                            <td className="px-6 py-3 text-right font-mono text-blue-900 border-t border-blue-100">{formatCurrency(investingCashFlow)}</td>
                        </tr>

                        {/* Financing */}
                        <tr className="bg-gray-50/30">
                            <td colSpan={2} className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mt-4">Financing Activities</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-3 text-gray-600 pl-8">Change in Loans & Liabilities</td>
                            <td className="px-6 py-3 text-right font-mono text-gray-600">{formatCurrency(changeLoans)}</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-3 text-gray-600 pl-8">Change in Equity & Capital</td>
                            <td className="px-6 py-3 text-right font-mono text-gray-600">{formatCurrency(changeEquity)}</td>
                        </tr>
                        <tr className="bg-purple-50/10 font-bold">
                            <td className="px-6 py-3 text-purple-900 pl-8">Net Cash provided by Financing Activities</td>
                            <td className="px-6 py-3 text-right font-mono text-purple-900 border-t border-purple-100">{formatCurrency(financingCashFlow)}</td>
                        </tr>
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                            <td className="px-6 py-4 text-left font-bold text-gray-900 uppercase text-sm">Net Change in Cash</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-xl text-gray-900">{formatCurrency(netCashFlow)}</td>
                        </tr>
                    </tfoot>
                </table>
            </Card>
        </div>
    );
}
