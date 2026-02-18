"use client";

import { useEffect, useState } from "react";
import { BiAlarm, BiCheckCircle, BiTrendingUp, BiShieldAlt, BiDollar } from "react-icons/bi";
import { PiCurrencyDollar, PiPlus } from "react-icons/pi";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { CreateBudgetModal } from "@/components/dashboard/budgets/CreateBudgetModal";

interface Budget {
    id: string;
    category: string;
    amount: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
}

interface BudgetAlert {
    id: string;
    type: string;
    category: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    daysRemaining: number;
    projectedOverspend?: number;
}

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchBudgetData();
    }, []);

    const fetchBudgetData = async () => {
        try {
            const response = await fetch('/api/budgets');
            const result = await response.json();

            if (result.success) {
                setBudgets(result.data.budgets);
                setAlerts(result.data.alerts);
                setSummary(result.data.summary);
            }
        } catch (error) {
            console.error('Failed to fetch budget data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'HEALTHY': return 'emerald';
            case 'WARNING': return 'cyan';
            case 'CRITICAL': return 'blue';
            case 'EXCEEDED': return 'rose';
            default: return 'gray';
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-rose-500/10 border-rose-500/30 text-rose-500';
            case 'high': return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
            case 'medium': return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
            default: return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-pulse text-gds-text-muted">Loading budget data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-cyan)]">
                        Real-time tracking • Intelligent alerts • Overspend prevention
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#29258D] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#29258D]/90 transition-all shadow-lg shadow-indigo-500/20"
                >
                    <PiPlus className="text-lg" />
                    New Budget
                </button>
            </div>

            <CreateBudgetModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchBudgetData();
                }}
            />

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Total Budget</span>
                                <BiDollar className="text-xl text-emerald-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                ${summary.totalBudget.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Total Spent</span>
                                <BiTrendingUp className="text-xl text-[#29258D]" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                ${summary.totalSpent.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-2 font-medium">
                                {summary.percentUsed.toFixed(1)}% of total utilized
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Remaining</span>
                                <BiCheckCircle className="text-xl text-emerald-500" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                ${summary.totalRemaining.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-emerald-600 mt-2 font-medium uppercase">Fully Funded</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Budget Health</span>
                                <BiShieldAlt className={`text-xl text-${getStatusColor(summary.overallStatus)}-500`} />
                            </div>
                            <p className={`text-xl font-bold uppercase tracking-tight text-${getStatusColor(summary.overallStatus)}-600`}>
                                {summary.overallStatus}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-2 font-medium">
                                {summary.criticalCount + summary.exceededCount} categories need review
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Alerts */}
            {alerts.length > 0 && (
                <Card>
                    <CardHeader className="md:h-[72px]">
                        <div className="flex items-center gap-2">
                            <BiAlarm className="text-amber-500 text-lg" />
                            <CardTitle>Budget Alerts ({alerts.length})</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {alerts.map((alert) => (
                            <div key={alert.id} className={`p-4 rounded-xl border bg-white ${getSeverityStyles(alert.severity)}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm mb-1">{alert.category}</p>
                                        <p className="text-xs opacity-90">{alert.message}</p>
                                        {alert.projectedOverspend && (
                                            <p className="text-xs mt-2 font-bold">
                                                Projected overspend: ${alert.projectedOverspend.toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-black/5 uppercase tracking-wider">
                                        {alert.daysRemaining}d left
                                    </span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Budget Breakdown */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#29258D] rounded-full"></div>
                        <div>
                            <CardTitle>Category Budgets</CardTitle>
                            <CardDescription>Allocation vs actual spending comparison</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {budgets.map((budget) => {
                        const color = getStatusColor(budget.status);
                        const progressColor = budget.status === 'EXCEEDED' ? 'bg-rose-500' :
                            budget.status === 'CRITICAL' ? 'bg-[#29258D]' :
                                budget.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500';

                        return (
                            <div key={budget.id} className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">{budget.category}</h3>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
                                            ${budget.spent.toLocaleString()} of ${budget.amount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xl font-bold text-gray-900`}>
                                            {budget.percentUsed.toFixed(0)}%
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                                            ${budget.remaining.toLocaleString()} left
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`absolute inset-y-0 left-0 ${progressColor} rounded-full transition-all duration-700`}
                                        style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                                    >
                                        {budget.percentUsed > 100 && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center justify-between pt-1">
                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-md border uppercase tracking-widest ${budget.status === 'EXCEEDED' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                        budget.status === 'CRITICAL' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                                            budget.status === 'WARNING' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                                'bg-emerald-50 border-emerald-100 text-emerald-600'
                                        }`}>
                                        {budget.status}
                                    </span>
                                    {budget.status === 'EXCEEDED' && (
                                        <span className="text-[10px] text-rose-500 font-bold uppercase">
                                            Exceeded by ${Math.abs(budget.remaining).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Budget Tips */}
            <Card className="bg-[#29258D]/5 border-[#29258D]/10">
                <CardContent className="bg-transparent py-6">
                    <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <BiShieldAlt className="text-[#29258D] text-sm" />
                        Smart Budget Tips
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                        <li className="flex gap-3 bg-white p-3 rounded-lg border border-[#29258D]/10">
                            <span className="text-[#29258D] font-bold">•</span>
                            <p>Expenses are automatically checked against budgets before submission</p>
                        </li>
                        <li className="flex gap-3 bg-white p-3 rounded-lg border border-[#29258D]/10">
                            <span className="text-[#29258D] font-bold">•</span>
                            <p>You'll receive warnings when approaching 75% of any category budget</p>
                        </li>
                        <li className="flex gap-3 bg-white p-3 rounded-lg border border-[#29258D]/10">
                            <span className="text-[#29258D] font-bold">•</span>
                            <p>Submissions that exceed budget require manager override</p>
                        </li>
                        <li className="flex gap-3 bg-white p-3 rounded-lg border border-[#29258D]/10">
                            <span className="text-[#29258D] font-bold">•</span>
                            <p>Budget forecasting uses your spending patterns to predict month-end totals</p>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
