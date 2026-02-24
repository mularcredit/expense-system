import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import {
    PiCheckCircle,
    PiCurrencyDollar,
    PiReceipt,
    PiShieldCheck,
    PiWallet,
    PiDownloadSimple,
    PiTrendUp,
    PiClock,
    PiBank,
    PiInvoice,
    PiHandCoins,
    PiGear,
    PiInfo,
    PiHandshake,
    PiUsers,
    PiBriefcase
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { stripe } from "@/lib/stripe";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    const userId = session.user.id;
    const now = new Date();

    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true }
    });

    // If user no longer exists (e.g. after DB reset), force logout
    if (!currentUser) return redirect("/api/auth/signout?callbackUrl=/login");

    const isPrivileged = ['SYSTEM_ADMIN', 'FINANCE_APPROVER', 'MANAGER'].includes(currentUser?.role || '');
    const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';
    const expenseFilter = isPrivileged ? {} : { userId };

    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch comprehensive data
    // Execute database queries sequentially to prevent exhausting Neon connection pool limits
    const thisMonthExpenses = await prisma.expense.findMany({ where: { ...expenseFilter, createdAt: { gte: firstDayThisMonth } }, orderBy: { createdAt: 'desc' } });
    const lastMonthExpenses = await prisma.expense.findMany({ where: { ...expenseFilter, createdAt: { gte: firstDayLastMonth, lte: lastDayLastMonth } } });
    const pendingApprovals = await prisma.expense.findMany({ where: { ...expenseFilter, status: 'PENDING_APPROVAL' }, orderBy: { createdAt: 'desc' }, take: 10 });
    const draftExpenses = await prisma.expense.findMany({ where: { ...expenseFilter, status: 'DRAFT' } });
    const allExpenses = await prisma.expense.findMany({ where: { ...expenseFilter }, orderBy: { expenseDate: 'desc' }, take: 100 });

    // Batch 2
    const wallet = await prisma.wallet.findUnique({ where: { userId }, include: { transactions: { take: 5, orderBy: { createdAt: 'desc' } } } });
    const requisitions = await prisma.requisition.findMany({ where: { userId, status: 'PENDING' } });
    const categories = await prisma.category.findMany({ where: { isActive: true }, select: { name: true } });
    const departments = await prisma.user.findMany({ where: { department: { not: null } }, select: { department: true }, distinct: ['department'] });

    // Batch 3
    const stripeAccount = (currentUser as any)?.stripeAccountId ? await prisma.user.findUnique({ where: { id: userId }, select: { stripeAccountId: true, stripeConnectStatus: true } as any }) : null;
    const thisMonthSales = isSystemAdmin ? await prisma.sale.aggregate({ where: { issueDate: { gte: firstDayThisMonth }, status: { not: 'DRAFT' } }, _sum: { totalAmount: true } }) : { _sum: { totalAmount: 0 } };
    const lastMonthSales = isSystemAdmin ? await prisma.sale.aggregate({ where: { issueDate: { gte: firstDayLastMonth, lte: lastDayLastMonth }, status: { not: 'DRAFT' } }, _sum: { totalAmount: true } }) : { _sum: { totalAmount: 0 } };

    // Batch 4
    const activeCustomersCount = await prisma.customer.count({ where: { isActive: true } });
    const teamCount = await prisma.user.count({ where: { isActive: true, role: { not: 'SYSTEM_ADMIN' } } });

    let stripeBalance = 0;
    let isStripeConnected = false;
    if ((stripeAccount as any)?.stripeAccountId && (stripeAccount as any)?.stripeConnectStatus === 'COMPLETED') {
        try {
            const balance = await stripe.balance.retrieve({ stripeAccount: (stripeAccount as any).stripeAccountId });
            stripeBalance = balance.available.reduce((sum: number, b: any) => sum + b.amount, 0) / 100;
            isStripeConnected = true;
        } catch (e) { console.error('Stripe balance fetch failed:', e); }
    }

    // Metrics Calculation
    const thisMonthTotal = thisMonthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const monthOverMonthChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    const revenueCurrent = thisMonthSales._sum.totalAmount || 0;
    const revenueLast = lastMonthSales._sum.totalAmount || 0;
    const revenueChange = revenueLast > 0 ? ((revenueCurrent - revenueLast) / revenueLast) * 100 : 0;

    const netProfit = revenueCurrent - thisMonthTotal;
    const profitMargin = revenueCurrent > 0 ? (netProfit / revenueCurrent) * 100 : 0;

    const pendingTotal = pendingApprovals.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const draftTotal = draftExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

    const categorySpending = allExpenses.reduce((acc: any, exp: any) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});
    const topCategories = Object.entries(categorySpending).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5);

    const avgDailySpend = allExpenses.length > 0 ? allExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0) / 30 : 0;
    const recentLargeExpenses = allExpenses.filter((exp: any) => exp.amount > avgDailySpend * 3).slice(0, 3);

    const approvedCount = allExpenses.filter((exp: any) => exp.status === 'APPROVED' || exp.status === 'PAID').length;
    const submittedCount = allExpenses.filter((exp: any) => exp.status !== 'DRAFT').length;
    const approvalRate = submittedCount > 0 ? (approvedCount / submittedCount) * 100 : 0;

    // Monthly trend data for chart
    const monthlyData = [];
    const yearStart = new Date(now.getFullYear(), 0, 1);

    for (let i = 0; i < 12; i++) {
        const monthStart = new Date(now.getFullYear(), i, 1);
        const monthEnd = new Date(now.getFullYear(), i + 1, 0);
        const monthExpenses = allExpenses.filter((exp: any) => {
            const expDate = new Date(exp.expenseDate);
            return expDate >= monthStart && expDate <= monthEnd;
        });
        const total = monthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
        monthlyData.push({ month: monthStart.toLocaleDateString('en-US', { month: 'short' }), amount: total });
    }

    // Quick insights
    const insights = [];
    if (isSystemAdmin && thisMonthTotal === 0 && revenueCurrent > 0) insights.push({ type: 'success', icon: PiHandCoins, message: `Strong revenue start: $${revenueCurrent.toLocaleString()}`, action: 'View detailed report', link: '/dashboard/reports' });
    if (isSystemAdmin && revenueChange > 10) insights.push({ type: 'success', icon: PiTrendUp, message: `Revenue up ${revenueChange.toFixed(1)}% vs last month`, action: 'View Sales', link: '/dashboard/reports' });
    if (pendingApprovals.length > 0) insights.push({ type: 'pending', icon: PiClock, message: `${pendingApprovals.length} expenses awaiting approval`, action: 'Track status', link: '/dashboard/expenses?status=PENDING_APPROVAL' });
    if (monthOverMonthChange > 20) insights.push({ type: 'warning', icon: PiTrendUp, message: `High spending alert: +${monthOverMonthChange.toFixed(1)}%`, action: 'Review Expenses', link: '/dashboard/expenses' });

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Expense Analytics</h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide border-l-2 border-[#29258D] pl-3">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} • Deep Dive into Spending
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/reports" className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold  text-gray-500 hover:text-[#29258D] hover:border-[#29258D]/30 transition-all flex items-center gap-2 ">
                        <PiDownloadSimple className="text-lg" />
                        Export Data
                    </Link>
                </div>
            </div>

            {/* Stats Overview - Purely Expenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in-up">
                <StatsCard
                    title="Total Expenses (MTD)"
                    value={`$${thisMonthTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    trend={monthOverMonthChange > 0 ? `+${monthOverMonthChange.toFixed(1)}%` : `${monthOverMonthChange.toFixed(1)}%`}
                    trendUp={monthOverMonthChange <= 0}
                    icon={PiInvoice}
                    color="purple"
                    image="/cards/budget.png"
                />
                <StatsCard
                    title="Pending Approvals"
                    value={`$${pendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    trend={`${pendingApprovals.length} Requests`}
                    trendUp={pendingTotal === 0}
                    icon={PiClock}
                    color="blue"
                    image="/cards/accounting (1).png"
                    bgColor="#EEF2FF"
                />
                <StatsCard
                    title="Avg. Daily Spend"
                    value={`$${avgDailySpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    trend="30-day avg"
                    trendUp={true}
                    icon={PiTrendUp}
                    color="cyan"
                    image="/cards/pos (2).png"
                    bgColor="#ECFEFF"
                />
                <StatsCard
                    title="Policy Compliance"
                    value={`${approvalRate.toFixed(1)}%`}
                    trend="Approved vs Rejected"
                    trendUp={approvalRate > 80}
                    icon={PiShieldCheck}
                    color="emerald"
                    image="/cards/order-processed.png"
                    bgColor="#ECFDF5"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Analytics & History */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Spending Trend */}
                    <OverviewChart data={monthlyData} />

                    {/* Category Allocation */}
                    <Card className="p-8">
                        <h2 className="text-[11px] font-bold tracking-[0.1em]  text-gray-400/80 mb-8 px-2 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#29258D] rounded-full"></span>
                            Category Allocation
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 px-2">
                            {topCategories.map(([category, amount]: any, idx) => {
                                const percentage = thisMonthTotal > 0 ? (amount / thisMonthTotal) * 100 : 0;
                                return (
                                    <div key={category}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <span className="text-sm font-bold text-[#0f172a] block">{category}</span>
                                                <span className="text-[10px] font-bold text-gray-400  tracking-tight">{percentage.toFixed(1)}% OF TOTAL</span>
                                            </div>
                                            <span className="text-sm font-bold text-[#0f172a] font-heading">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#29258D] to-[#06B6D4] rounded-full transition-all duration-1000"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Expense Anomaly/Unusual Activity */}
                    {recentLargeExpenses.length > 0 && (
                        <Card className="p-8 border-indigo-500/10">
                            <h2 className="text-[11px] font-bold tracking-[0.1em]  text-gray-400/80 mb-6 px-2 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-red-500 rounded-full"></span>
                                Spending Alerts
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {recentLargeExpenses.map((exp: any) => (
                                    <div key={exp.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-indigo-500/20 transition-all group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-2 bg-white rounded-lg">
                                                <PiShieldCheck className="text-red-500 text-lg" />
                                            </div>
                                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                                {(exp.amount / avgDailySpend).toFixed(1)}x avg
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-[#0f172a] mb-1 truncate">{exp.title}</p>
                                        <p className="text-xs font-bold text-gray-900">${exp.amount.toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Transaction History */}
                    <TransactionTable expenses={thisMonthExpenses.slice(0, 10)} />
                </div>

                {/* Right Column - Utilities */}
                <div className="space-y-8">
                    {/* Wallet Balance */}
                    <WalletCard
                        balance={isStripeConnected ? stripeBalance : (wallet?.balance ?? 0)}
                        currency={wallet?.currency ?? "USD"}
                        categories={categories.map((c: { name: string }) => c.name)}
                        branches={departments.map((d: { department: string | null }) => d.department!).filter(Boolean)}
                        isStripe={isStripeConnected}
                        holderName={currentUser?.name || "Card Holder"}
                    />

                    {/* Quick Actions */}
                    <DashboardQuickActions />

                    {/* Active Requisitions */}
                    {requisitions.length > 0 && (
                        <Card className="p-6">
                            <h3 className="text-[11px] font-bold text-gray-400 mb-6  tracking-wider px-1">Active Requisitions</h3>
                            <div className="space-y-4">
                                {requisitions.slice(0, 3).map((req: any) => (
                                    <div key={req.id} className="p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#29258D]/20 transition-all group cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className="text-[13px] font-bold text-[#0f172a] group-hover:text-[#29258D] transition-colors line-clamp-1">{req.title}</p>
                                                <p className="text-[10px] text-gray-400 font-bold mt-1  tracking-wider">{req.category}</p>
                                            </div>
                                            <span className="text-sm font-bold text-[#0f172a] font-heading">${req.amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
