"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PiMagnifyingGlass } from "react-icons/pi";

interface SalesFilterProps {
    customers: { id: string, name: string }[];
}

export function SalesFilter({ customers }: SalesFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(searchParams.get("query") || "");
    const [status, setStatus] = useState(searchParams.get("status") || "ALL");
    const [customerId, setCustomerId] = useState(searchParams.get("customerId") || "ALL");
    const [dateRange, setDateRange] = useState(searchParams.get("dateRange") || "ALL");

    useEffect(() => {
        const handler = setTimeout(() => {
            updateFilters({ query });
        }, 300);
        return () => clearTimeout(handler);
    }, [query]);

    const updateFilters = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== "ALL") {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleStatusChange = (val: string) => {
        setStatus(val);
        updateFilters({ status: val });
    };

    const handleCustomerChange = (val: string) => {
        setCustomerId(val);
        updateFilters({ customerId: val });
    };

    const handleDateRangeChange = (val: string) => {
        setDateRange(val);
        updateFilters({ dateRange: val });
    };

    const customerOptions = [
        { value: "ALL", label: "All Customers" },
        ...customers.map(c => ({ value: c.id, label: c.name }))
    ];

    const dateOptions = [
        { value: "ALL", label: "All Time" },
        { value: "THIS_MONTH", label: "This Month" },
        { value: "LAST_MONTH", label: "Last Month" },
        { value: "LAST_3_MONTHS", label: "Last 3 Months" },
        { value: "THIS_YEAR", label: "This Year" },
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-3 mb-6 flex flex-col lg:flex-row gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] w-full">
                <Input
                    placeholder="Search invoice #..."
                    className="pl-9 h-9 text-xs bg-white border-gray-200 focus:border-[var(--gds-primary)] focus:ring-[var(--gds-primary)]/20 rounded-lg transition-all w-full"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            </div>

            <div className="w-full lg:w-[160px]">
                <Select
                    value={status}
                    onChange={handleStatusChange}
                    options={[
                        { value: "ALL", label: "All Statuses" },
                        { value: "PAID", label: "Paid" },
                        { value: "PENDING", label: "Pending" },
                        { value: "OVERDUE", label: "Overdue" },
                        { value: "DRAFT", label: "Draft" }
                    ]}
                    placeholder="Status"
                    className="h-9 w-full !text-xs"
                />
            </div>

            <div className="w-full lg:w-[200px]">
                <Select
                    value={customerId}
                    onChange={handleCustomerChange}
                    options={customerOptions}
                    placeholder="Customer"
                    searchable={true}
                    className="h-9 w-full !text-xs"
                />
            </div>

            <div className="w-full lg:w-[150px]">
                <Select
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    options={dateOptions}
                    placeholder="Date Range"
                    className="h-9 w-full !text-xs"
                />
            </div>
        </div>
    );
}
