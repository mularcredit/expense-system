"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[var(--gds-surface)] border border-[var(--gds-border)] p-4 rounded-xl">
                <p className="text-[13px] font-bold text-[var(--gds-text-main)] mb-2">{label}</p>
                <div className="space-y-1.5">
                    {payload[0] && (
                        <p className="text-xs font-bold flex items-center gap-2 text-[var(--gds-primary)]">
                            <span className="w-2 h-2 rounded-full bg-[var(--gds-primary)]"></span>
                            Expenses: <span className="text-[var(--gds-text-main)]">${payload[0].value?.toLocaleString()}</span>
                        </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export function OverviewChart({ data, className }: { data: any[], className?: string }) {
    if (!data || data.length === 0) {
        return (
            <Card className={cn("w-full h-[350px] p-8 flex items-center justify-center", className)}>
                <p className="text-[var(--gds-text-muted)] text-sm font-medium">No analytics data available</p>
            </Card>
        );
    }

    const chartData = useMemo(() => data.map(d => ({ ...d, expenses: d.amount })), [data]);

    return (
        <Card className={cn("w-full h-[350px] p-8 pr-4", className)}>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-400/80 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[var(--gds-primary)] rounded-full"></span>
                    Spend Analytics
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-[var(--gds-surface-bright)] border border-[var(--gds-border)] rounded-lg text-[10px] font-bold text-[var(--gds-text-muted)]">
                    THIS YEAR
                </div>
            </div>

            <ResponsiveContainer width="100%" height="80%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5e48b8" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#5e48b8" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#5e48b8', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area
                        type="monotone"
                        dataKey="expenses"
                        animationDuration={1000}
                        stroke="#5e48b8"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorExpenses)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
}
