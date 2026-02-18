import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BiCalendar, BiTrendingUp, BiPieChart, BiTable } from "react-icons/bi";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { ExportButtons } from "@/components/dashboard/ExportButtons";

export default async function ReportsPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    // Fetch comprehensive data
    // In a real manager view, we'd fetch for their team/department or company
    const [expenses, sales] = await Promise.all([
        prisma.expense.findMany({
            where: { userId: session.user.id }, // Scope could be expanded based on role
            orderBy: { expenseDate: 'desc' }
        }),
        prisma.sale.findMany({
            where: { status: { not: 'DRAFT' } }, // Only confirmed sales
            orderBy: { issueDate: 'desc' }
        })
    ]);

    // 1. Prepare Category Data (Expenses)
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((exp: any) => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    const categoryData = Object.entries(categoryTotals).map(([name, amount]) => ({ name, amount }));

    // 2. Prepare Monthly Data (Last 6 months)
    const monthlyStats: Record<string, { expense: number, revenue: number }> = {};

    // Generate keys for the last 6 months to ensure continuity
    const months: string[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        months.push(key);
        monthlyStats[key] = { expense: 0, revenue: 0 };
    }

    expenses.forEach((exp: any) => {
        const d = new Date(exp.expenseDate || exp.createdAt);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (monthlyStats[key]) {
            monthlyStats[key].expense += exp.amount;
        }
    });

    sales.forEach((sale: any) => {
        const d = new Date(sale.issueDate);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (monthlyStats[key]) {
            monthlyStats[key].revenue += sale.totalAmount;
        }
    });

    const monthlyData = months.map(month => ({
        month,
        expense: monthlyStats[month].expense,
        revenue: monthlyStats[month].revenue
    }));

    // 3. Prepare Status Data (Expenses)
    const statusCounts: Record<string, number> = {};
    expenses.forEach((exp: any) => {
        statusCounts[exp.status] = (statusCounts[exp.status] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // Totals for Summary Cards (based on fetched data scope)
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Financial Performance</h2>
                    <p className="text-gray-500 text-sm font-medium tracking-wide border-l-2 border-[var(--gds-emerald)] pl-3">
                        Revenue, Expense & Profit Analysis
                    </p>
                </div>
                <ExportButtons expenses={JSON.parse(JSON.stringify(expenses))} userName={session.user.name || "User"} />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="gds-glass p-6 border-l-4 border-l-[var(--gds-emerald)]">
                    <p className="text-[10px] font-bold text-gds-text-muted uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-3xl font-heading font-bold text-[var(--gds-emerald)]">${totalRevenue.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gds-text-muted">
                        <BiTrendingUp className="text-[var(--gds-emerald)]" />
                        <span>Aggregated Sales Income</span>
                    </div>
                </div>
                <div className="gds-glass p-6 border-l-4 border-l-[var(--gds-purple)]/50">
                    <p className="text-[10px] font-bold text-gds-text-muted uppercase tracking-widest mb-1">Total Expenses</p>
                    <p className="text-3xl font-heading font-bold text-[var(--gds-purple)]">${totalExpenses.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gds-text-muted">
                        <BiTable className="text-[var(--gds-purple)]" />
                        <span>Total Operational Cost</span>
                    </div>
                </div>
                <div className="gds-glass p-6 border-l-4 border-l-[var(--gds-cyan)]">
                    <p className="text-[10px] font-bold text-gds-text-muted uppercase tracking-widest mb-1">Net Income</p>
                    <p className={`text-3xl font-heading font-bold ${netProfit >= 0 ? 'text-[var(--gds-cyan)]' : 'text-rose-500'}`}>
                        ${netProfit.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gds-text-muted">
                        <BiPieChart className="text-[var(--gds-cyan)]" />
                        <span>{profitMargin.toFixed(1)}% Profit Margin</span>
                    </div>
                </div>
            </div>

            <AnalyticsCharts
                categoryData={categoryData}
                monthlyData={monthlyData}
                statusData={statusData}
            />

            {/* Category Leaderboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Financial Statement Links */}
                <div className="col-span-1 grid grid-cols-1 gap-4">
                    <a href="/dashboard/accounting/reports/balance-sheet" className="gds-glass p-6 border border-[var(--gds-border)] hover:border-[var(--gds-emerald)] transition-colors group rounded-xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gds-text-main mb-1 group-hover:text-[var(--gds-emerald)]">Balance Sheet</h3>
                                <p className="text-xs text-gds-text-muted">Assets, Liabilities & Equity</p>
                            </div>
                            <BiTable className="text-xl text-gray-400 group-hover:text-[var(--gds-emerald)]" />
                        </div>
                    </a>
                    <a href="/dashboard/accounting/ledger" className="gds-glass p-6 border border-[var(--gds-border)] hover:border-[var(--gds-cyan)] transition-colors group rounded-xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gds-text-main mb-1 group-hover:text-[var(--gds-cyan)]">General Ledger</h3>
                                <p className="text-xs text-gds-text-muted">Detailed Transaction Record</p>
                            </div>
                            <BiTable className="text-xl text-gray-400 group-hover:text-[var(--gds-cyan)]" />
                        </div>
                    </a>
                </div>

                <div className="gds-glass p-6 col-span-1">
                    <h3 className="text-sm font-bold text-gds-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BiPieChart className="text-lg text-[var(--gds-cyan)]" />
                        Top Usage Categories
                    </h3>
                    <div className="space-y-4">
                        {categoryData.sort((a, b) => b.amount - a.amount).slice(0, 3).map((cat, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold tracking-wider mb-1 text-gds-text-muted">
                                    <span className="text-gds-text-main">{cat.name}</span>
                                    <span>${cat.amount.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full bg-[var(--gds-surface-bright)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[var(--gds-emerald)] to-[var(--gds-cyan)] rounded-full"
                                        style={{ width: `${totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
