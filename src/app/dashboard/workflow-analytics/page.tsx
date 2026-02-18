'use client';

import { useState, useEffect } from 'react';
import {
    PiChartLine,
    PiClock,
    PiCheckCircle,
    PiXCircle,
    PiWarning,
    PiTrendUp,
    PiTrendDown,
    PiUsers,
    PiCalendar
} from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { EscalationPanel } from '@/components/workflow/DelegationEscalation';

interface AnalyticsData {
    summary: {
        total: number;
        approved: number;
        rejected: number;
        pending: number;
        delegated: number;
        approvalRate: number;
        avgResponseTimeHours: number;
        overdueCount: number;
    };
    byLevel: Record<number, any>;
    byCategory: Record<string, any>;
    dailyTrend: Array<{
        date: string;
        total: number;
        approved: number;
        rejected: number;
        pending: number;
    }>;
    overdueApprovals: Array<any>;
    topApprovers?: Array<any>;
    period: {
        days: number;
        scope: string;
    };
}

export default function WorkflowAnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [scope, setScope] = useState<'personal' | 'system'>('personal');
    const [days, setDays] = useState(30);

    useEffect(() => {
        fetchAnalytics();
    }, [scope, days]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/workflow/analytics?scope=${scope}&days=${days}`);
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !analytics) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gds-text-muted">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const { summary, dailyTrend, byCategory, overdueApprovals, topApprovers } = analytics;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-gds-text-main mb-2">
                        Workflow Analytics
                    </h1>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-emerald)]">
                        Performance insights and approval metrics
                    </p>
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                    <select
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        className="px-4 py-2 bg-[var(--gds-surface)] border border-[var(--gds-border)] rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>

                    <div className="flex gap-2 p-1 bg-[var(--gds-surface)] border border-[var(--gds-border)] rounded-xl">
                        <button
                            onClick={() => setScope('personal')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                scope === 'personal'
                                    ? 'bg-[var(--gds-emerald)] text-white'
                                    : 'text-gds-text-muted hover:text-gds-text-main'
                            )}
                        >
                            Personal
                        </button>
                        <button
                            onClick={() => setScope('system')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                scope === 'system'
                                    ? 'bg-[var(--gds-emerald)] text-white'
                                    : 'text-gds-text-muted hover:text-gds-text-main'
                            )}
                        >
                            System-Wide
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="gds-glass p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <PiCheckCircle className="text-2xl text-emerald-500" />
                        </div>
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                            {summary.approvalRate}%
                        </span>
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-gds-text-main mb-1">
                        {summary.approved}
                    </h3>
                    <p className="text-xs text-gds-text-muted font-medium uppercase tracking-wider">
                        Approved
                    </p>
                </div>

                <div className="gds-glass p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                            <PiXCircle className="text-2xl text-rose-500" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-gds-text-main mb-1">
                        {summary.rejected}
                    </h3>
                    <p className="text-xs text-gds-text-muted font-medium uppercase tracking-wider">
                        Rejected
                    </p>
                </div>

                <div className="gds-glass p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <PiClock className="text-2xl text-amber-500" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-gds-text-main mb-1">
                        {summary.avgResponseTimeHours.toFixed(1)}h
                    </h3>
                    <p className="text-xs text-gds-text-muted font-medium uppercase tracking-wider">
                        Avg Response Time
                    </p>
                </div>

                <div className="gds-glass p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <PiWarning className="text-2xl text-red-500" />
                        </div>
                        {summary.overdueCount > 0 && (
                            <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                                URGENT
                            </span>
                        )}
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-gds-text-main mb-1">
                        {summary.overdueCount}
                    </h3>
                    <p className="text-xs text-gds-text-muted font-medium uppercase tracking-wider">
                        Overdue Approvals
                    </p>
                </div>
            </div>

            {/* Daily Trend Chart */}
            <div className="gds-glass p-6">
                <h2 className="text-lg font-bold text-gds-text-main mb-6 flex items-center gap-2">
                    <PiChartLine className="text-emerald-500" />
                    Daily Trend
                </h2>
                <div className="space-y-3">
                    {dailyTrend.map((day, index) => {
                        const maxValue = Math.max(...dailyTrend.map(d => d.total));
                        const percentage = maxValue > 0 ? (day.total / maxValue) * 100 : 0;

                        return (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gds-text-muted font-medium">
                                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="text-gds-text-main font-bold">{day.total}</span>
                                </div>
                                <div className="h-2 bg-[var(--gds-surface)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <div className="flex gap-3 text-[10px] font-medium">
                                    <span className="text-emerald-500">✓ {day.approved}</span>
                                    <span className="text-rose-500">✗ {day.rejected}</span>
                                    <span className="text-amber-500">⏳ {day.pending}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Category Breakdown & Overdue Approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Category */}
                <div className="gds-glass p-6">
                    <h2 className="text-lg font-bold text-gds-text-main mb-6">
                        By Category
                    </h2>
                    <div className="space-y-4">
                        {Object.entries(byCategory).map(([category, stats]: [string, any]) => (
                            <div key={category} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gds-text-main">{category}</span>
                                    <span className="text-xs text-gds-text-muted">
                                        ${stats.totalAmount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 h-2 bg-emerald-500/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500"
                                            style={{ width: `${(stats.approved / stats.total) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gds-text-muted">
                                        {stats.approved}/{stats.total}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Overdue Approvals */}
                <div className="gds-glass p-6">
                    <h2 className="text-lg font-bold text-gds-text-main mb-6 flex items-center gap-2">
                        <PiWarning className="text-red-500" />
                        Overdue Approvals
                    </h2>
                    {overdueApprovals.length === 0 ? (
                        <p className="text-center py-8 text-gds-text-muted text-sm">
                            No overdue approvals 🎉
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {overdueApprovals.slice(0, 5).map((approval) => (
                                <div
                                    key={approval.id}
                                    className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-bold text-sm text-gds-text-main">
                                            {approval.title}
                                        </h4>
                                        <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                                            {approval.daysOverdue}d
                                        </span>
                                    </div>
                                    <p className="text-xs text-gds-text-muted">
                                        {approval.submitter} • ${approval.amount.toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Approvers (System-wide only) */}
            {scope === 'system' && topApprovers && topApprovers.length > 0 && (
                <div className="gds-glass p-6">
                    <h2 className="text-lg font-bold text-gds-text-main mb-6 flex items-center gap-2">
                        <PiUsers className="text-emerald-500" />
                        Top Approvers
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topApprovers.slice(0, 6).map((approver, index) => (
                            <div key={index} className="p-4 bg-[var(--gds-surface)] rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500">
                                        #{index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-gds-text-main">{approver.name}</h4>
                                        <p className="text-xs text-gds-text-muted">{approver.role}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-gds-text-muted">Total</p>
                                        <p className="font-bold text-gds-text-main">{approver.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-gds-text-muted">Rate</p>
                                        <p className="font-bold text-emerald-500">{approver.approvalRate.toFixed(0)}%</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-gds-text-muted">Avg Time</p>
                                        <p className="font-bold text-gds-text-main">{approver.avgResponseTime.toFixed(1)}h</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Escalation Controls (System-wide only) */}
            {scope === 'system' && (
                <div className="grid grid-cols-1 gap-6">
                    <EscalationPanel onTrigger={() => fetchAnalytics()} />
                </div>
            )}
        </div>
    );
}
