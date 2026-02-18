"use client";

import { useEffect, useState } from "react";
import {
    PiBank,
    PiCalendarBlank,
    PiCheckCircle,
    PiClock,
    PiCurrencyDollar,
    PiDotsThree,
    PiDownload,
    PiEye,
    PiFileText,
    PiSpinner,
    PiTrash,
    PiUsers,
    PiWarningCircle
} from "react-icons/pi";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { SalaryDetailsModal } from "@/components/expenses/SalaryDetailsModal";
import { SalaryUploadModal } from "@/components/expenses/SalaryUploadModal";
import Link from "next/link";
import * as XLSX from 'xlsx';

interface SalaryBatch {
    id: string;
    title: string;
    month: number;
    year: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    _count: {
        records: number;
    };
    expenseId: string | null;
}

export default function SalariesPage() {
    const [batches, setBatches] = useState<SalaryBatch[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<SalaryBatch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // Filter states
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await fetch('/api/salaries');
                if (!res.ok) throw new Error('Failed to fetch salaries');
                const data = await res.json();
                setBatches(data);
                setFilteredBatches(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load salary batches");
            } finally {
                setIsLoading(false);
            }
        };

        fetchBatches();
    }, []);

    // Apply filters whenever filter states change
    useEffect(() => {
        let filtered = [...batches];

        if (selectedMonth !== "all") {
            filtered = filtered.filter(b => b.month === parseInt(selectedMonth));
        }

        if (selectedYear !== "all") {
            filtered = filtered.filter(b => b.year === parseInt(selectedYear));
        }

        if (selectedStatus !== "all") {
            filtered = filtered.filter(b => b.status === selectedStatus);
        }

        setFilteredBatches(filtered);
    }, [selectedMonth, selectedYear, selectedStatus, batches]);

    const handleExportTemplate = () => {
        const template = [
            {
                "Employee Name": "John Doe",
                "Bank Name": "Example Bank",
                "Account Number": "1234567890",
                "Amount": 1500
            },
            {
                "Employee Name": "Jane Smith",
                "Bank Name": "Example Bank",
                "Account Number": "0987654321",
                "Amount": 2000
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Salary Template");
        XLSX.writeFile(wb, "Salary_Upload_Template.xlsx");
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'APPROVED': return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case 'PAID': return "bg-blue-50 text-blue-700 border-blue-200";
            case 'DRAFT': return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-gray-50 text-gray-600 border-gray-200";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <PiSpinner className="animate-spin text-3xl text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <PiWarningCircle className="text-4xl text-rose-500 mb-2" />
                <h3 className="text-lg font-medium text-gray-900">Unable to load salaries</h3>
                <p className="text-gray-500 max-w-sm mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up pb-12 font-sans">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Payroll & Salaries</h1>
                    <p className="text-gray-500 text-sm">
                        Manage monthly salary batches and payroll history
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExportTemplate}
                        className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        <PiDownload className="mr-2 text-lg" />
                        Download Template
                    </Button>
                    <Button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="shadow-lg shadow-indigo-500/20"
                    >
                        <PiUsers className="mr-2 text-lg" />
                        Process New Payroll
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Total YTD Payroll</h3>
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <PiCurrencyDollar className="text-xl" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        ${batches.reduce((sum, b) => b.status === 'PAID' ? sum + b.totalAmount : sum, 0).toLocaleString()}
                    </p>
                </div>
                {/* Add more stats as needed */}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-gray-500 ml-1">Month</span>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {format(new Date(2024, i, 1), 'MMMM')}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-gray-500 ml-1">Year</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Years</option>
                        {[2024, 2025, 2026].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-gray-500 ml-1">Status</span>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PAID">Paid</option>
                    </select>
                </div>
                <div className="flex-1" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setSelectedMonth("all");
                        setSelectedYear("all");
                        setSelectedStatus("all");
                    }}
                    className="text-gray-500 text-xs mt-4"
                >
                    Reset Filters
                </Button>
            </div>

            {/* Batches List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <PiFileText className="text-lg text-[#29258D]" />
                        Payroll History ({filteredBatches.length})
                    </h2>
                </div>

                {filteredBatches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <PiUsers className="text-3xl text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No payroll records found</h3>
                        <p className="text-gray-500 max-w-sm mt-2">
                            Adjust your filters or upload a new salary sheet.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-500">Batch Name</th>
                                    <th className="px-6 py-3 font-medium text-gray-500">Period</th>
                                    <th className="px-6 py-3 font-medium text-gray-500">Employees</th>
                                    <th className="px-6 py-3 font-medium text-gray-500">Total Amount</th>
                                    <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredBatches.map((batch) => (
                                    <tr key={batch.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {batch.title}
                                            <div className="text-xs text-gray-400 font-normal mt-0.5">
                                                Created {new Date(batch.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {format(new Date(batch.year, batch.month - 1), 'MMMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <PiUsers className="text-gray-400" />
                                                {batch._count.records} Payees
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            ${batch.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyles(batch.status)}`}>
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/dashboard/salaries/${batch.id}`}>
                                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#29258D]">
                                                    <PiEye className="text-lg" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <SalaryUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
            />
        </div >
    );
}
