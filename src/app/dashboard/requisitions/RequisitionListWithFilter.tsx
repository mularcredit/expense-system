"use client";

import { useState, useMemo } from "react";
import { PiFunnel, PiMagnifyingGlass } from "react-icons/pi";
import { RequisitionList } from "./RequisitionList";

interface RequisitionListWithFilterProps {
    requisitions: any[];
    monthlyBudgets: any[];
}

export function RequisitionListWithFilter({ requisitions, monthlyBudgets }: RequisitionListWithFilterProps) {
    const [statusFilter, setStatusFilter] = useState<'active' | 'fulfilled' | 'all'>('active');

    // Filter requisitions based on selected tab
    const filteredRequisitions = useMemo(() => {
        if (statusFilter === 'active') {
            return requisitions.filter(req => req.status !== 'FULFILLED');
        } else if (statusFilter === 'fulfilled') {
            return requisitions.filter(req => req.status === 'FULFILLED');
        }
        return requisitions; // 'all'
    }, [requisitions, statusFilter]);

    // Calculate counts
    const statusCounts = useMemo(() => ({
        active: requisitions.filter(req => req.status !== 'FULFILLED').length,
        fulfilled: requisitions.filter(req => req.status === 'FULFILLED').length,
        all: requisitions.length
    }), [requisitions]);

    return (
        <>
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200">
                <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${statusFilter === 'active'
                        ? 'border-[#29258D] text-[#29258D]'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                >
                    Active
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">
                        {statusCounts.active}
                    </span>
                </button>
                <button
                    onClick={() => setStatusFilter('fulfilled')}
                    className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${statusFilter === 'fulfilled'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                >
                    Fulfilled
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">
                        {statusCounts.fulfilled}
                    </span>
                </button>
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${statusFilter === 'all'
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                >
                    All
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">
                        {statusCounts.all}
                    </span>
                </button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <PiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID or title..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
                    />
                </div>
                <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg flex items-center gap-2 text-gray-500 hover:text-gray-900 hover:border-gray-900 transition-all">
                    <PiFunnel />
                    <span className="text-xs font-bold">Filter</span>
                </button>
            </div>

            <div className="space-y-6">
                <RequisitionList
                    requisitions={filteredRequisitions}
                    monthlyBudgets={monthlyBudgets}
                />
            </div>
        </>
    );
}
