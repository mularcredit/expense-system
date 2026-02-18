"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    PiPlus,
    PiWallet,
    PiClock,
    PiCheckCircle,
    PiReceipt,
    PiFileText,
    PiWarningCircle,
    PiUploadSimple
} from "react-icons/pi";
import { UnifiedExpenseModal } from "@/components/expenses/UnifiedExpenseModal";
import { SalaryUploadModal } from "@/components/expenses/SalaryUploadModal";
import { SalaryDetailsModal } from "@/components/expenses/SalaryDetailsModal";
import { Button } from "@/components/ui/Button";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { submitAllDrafts, deleteExpense } from "./actions";
import { PiSpinner, PiTrash } from "react-icons/pi";
import { ConfirmationModal } from "@/components/ui/Modal";

interface ExpensesClientProps {
    draftExpenses: any[];
    submittedExpenses: any[];
    unsubmittedAmount: number;
}

export function ExpensesClient({
    draftExpenses,
    submittedExpenses,
    unsubmittedAmount
}: ExpensesClientProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [isSalaryDetailsOpen, setIsSalaryDetailsOpen] = useState(false);
    const [viewingExpense, setViewingExpense] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { showToast } = useToast();
    const router = useRouter();

    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<any>(null);

    const handleSubmitReport = async () => {
        setShowConfirmSubmit(false);

        setIsSubmitting(true);
        try {
            const res = await submitAllDrafts();
            if (res.success) {
                showToast(res.message || "Expenses submitted successfully", "success");
                router.refresh();
            } else {
                showToast(res.message || res.error || "Failed to submit expenses", "error");
                if (res.errors && res.errors.length > 0) {
                    // Could show detailed errors in a modal, but for now console/toast
                    console.error(res.errors);
                }
            }
        } catch (error) {
            showToast("An unexpected error occurred", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExpense = async () => {
        if (!expenseToDelete) return;

        setIsDeleting(expenseToDelete.id);
        setExpenseToDelete(null);

        try {
            const res = await deleteExpense(isDeleting!);
            if (res.success) {
                showToast("Expense removed", "success");
                router.refresh();
            } else {
                showToast(res.error || "Failed to delete expense", "error");
            }
        } catch (error) {
            showToast("An unexpected error occurred", "error");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleExpenseClick = (exp: any) => {
        if (exp.category === "Salaries & Wages" && exp.description && exp.description.includes("| Name |")) {
            setViewingExpense(exp);
            setIsSalaryDetailsOpen(true);
        } else {
            // For now, normal expenses don't have an edit modal wired up fully in this view on click
            // But we can add a toast or similar if needed, or just do nothing for now specific to others
            console.log("Clicked expense:", exp.id);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status.toUpperCase()) {
            case 'APPROVED': case 'PAID': case 'REIMBURSED':
                return "text-emerald-600 bg-emerald-50 border-emerald-200";
            case 'PENDING_APPROVAL': case 'SUBMITTED':
                return "text-blue-600 bg-blue-50 border-blue-200";
            case 'REJECTED':
                return "text-rose-600 bg-rose-50 border-rose-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-12 font-sans">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">My Expenses</h1>
                    <p className="text-gray-500 text-sm">
                        Track and submit your expenditures
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => setIsSalaryModalOpen(true)}
                        className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm"
                    >
                        <PiUploadSimple className="mr-2 text-lg" />
                        Upload Salaries
                    </Button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="shadow-lg shadow-indigo-500/20"
                    >
                        <PiPlus className="mr-2 text-lg" />
                        New Expense
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Pending Submissions */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <PiClock className="text-lg text-[#29258D]" />
                                Pending Items
                            </h2>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                {draftExpenses.length}
                            </span>
                        </div>

                        <div className="p-6">
                            {draftExpenses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                        <PiReceipt className="text-xl text-gray-400" />
                                    </div>
                                    <p className="text-gray-900 font-medium text-sm">No draft expenses</p>
                                    <p className="text-gray-500 text-xs mt-1">Create a new expense to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {draftExpenses.map((exp: any) => (
                                        <div
                                            key={exp.id}
                                            onClick={() => handleExpenseClick(exp)}
                                            className="group relative flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#29258D]/30 transition-all hover:shadow-md hover:shadow-indigo-500/5 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-[#29258D]/5 flex items-center justify-center text-[#29258D]">
                                                    <PiFileText className="text-xl" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 group-hover:text-[#29258D] transition-colors text-sm">{exp.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{exp.category}</span>
                                                        {exp.receiptUrl && <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium"><PiCheckCircle /> Receipt</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">${exp.amount.toFixed(2)}</p>
                                                    <button className="text-[10px] text-[#29258D] font-bold hover:underline tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-opacity">Edit & Submit</button>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpenseToDelete(exp);
                                                    }}
                                                    disabled={isDeleting === exp.id}
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    {isDeleting === exp.id ? (
                                                        <PiSpinner className="animate-spin text-lg" />
                                                    ) : (
                                                        <PiTrash className="text-lg" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expense History */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <PiCheckCircle className="text-lg text-emerald-600" />
                                History
                            </h2>
                        </div>

                        <div className="p-2">
                            {submittedExpenses.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-400 text-sm">No expense history found.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {submittedExpenses.map((exp: any) => (
                                        <div key={exp.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <PiReceipt className="text-xs" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900">{exp.title}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{new Date(exp.expenseDate).toLocaleDateString()} • {exp.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide min-w-[80px] text-center", getStatusStyles(exp.status))}>
                                                    {exp.status.replace('_', ' ')}
                                                </span>
                                                <div className="text-right flex flex-col items-end">
                                                    <p className="font-bold text-sm text-gray-900">${exp.amount.toFixed(2)}</p>
                                                    {['APPROVED', 'PAID', 'REIMBURSED'].includes(exp.status.toUpperCase()) && (
                                                        <a
                                                            href={`/receipt-studio?expenseId=${exp.id}`}
                                                            className="text-[10px] text-indigo-600 font-bold hover:underline tracking-tight uppercase"
                                                        >
                                                            Voucher
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    {/* Unsubmitted Card */}
                    <div className="bg-[#29258D] rounded-xl shadow-lg shadow-indigo-900/20 overflow-hidden relative text-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl -ml-6 -mb-6"></div>

                        <div className="p-8 text-center relative z-10">
                            <div className="w-12 h-12 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-sm ring-1 ring-white/20">
                                <PiWallet className="text-2xl text-white" />
                            </div>
                            <h3 className="text-[10px] font-bold tracking-widest uppercase text-indigo-200 mb-1">Unsubmitted Total</h3>
                            <p className="text-3xl font-bold text-white tracking-tight">
                                ${unsubmittedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-indigo-100/70 mt-2">
                                {draftExpenses.length} items waiting in draft
                            </p>

                            <Button
                                onClick={() => setShowConfirmSubmit(true)}
                                disabled={unsubmittedAmount === 0 || isSubmitting}
                                className="mt-6 w-full bg-[#06B6D4] text-white hover:bg-[#06B6D4]/90 border-none shadow-none font-bold"
                            >
                                {isSubmitting ? <PiSpinner className="animate-spin mr-2" /> : null}
                                {isSubmitting ? 'Submitting...' : 'Submit Final Report'}
                            </Button>
                        </div>
                    </div>

                    {/* Policy Card */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#29258D]"></div>
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <PiWarningCircle className="text-[#29258D] text-lg" />
                            Expense Policy
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-xs text-gray-600 group">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#29258D] mt-1.5 shrink-0 opacity-60"></span>
                                <span className="leading-relaxed"><strong className="text-gray-900 font-semibold">Receipts required</strong> for all expenses exceeding $25.00.</span>
                            </li>
                            <li className="flex gap-3 text-xs text-gray-600 group">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#29258D] mt-1.5 shrink-0 opacity-60"></span>
                                <span className="leading-relaxed"><strong className="text-gray-900 font-semibold">Mileage rate</strong> is currently set at $0.67 per mile.</span>
                            </li>
                            <li className="flex gap-3 text-xs text-gray-600 group">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#29258D] mt-1.5 shrink-0 opacity-60"></span>
                                <span className="leading-relaxed">Reports must be submitted by the <strong className="text-gray-900 font-semibold">5th of each month</strong>.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Unified Modal */}
                <UnifiedExpenseModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode="full"
                />

                <SalaryUploadModal
                    isOpen={isSalaryModalOpen}
                    onClose={() => setIsSalaryModalOpen(false)}
                />

                <SalaryDetailsModal
                    isOpen={isSalaryDetailsOpen}
                    onClose={() => setIsSalaryDetailsOpen(false)}
                    expense={viewingExpense}
                />

                <ConfirmationModal
                    isOpen={showConfirmSubmit}
                    onClose={() => setShowConfirmSubmit(false)}
                    onConfirm={handleSubmitReport}
                    title="Submit All Expenses?"
                    description="Are you sure you want to submit all pending drafts for approval? This will send them to your manager for review."
                    confirmText="Yes, Submit All"
                    variant="info"
                    isLoading={isSubmitting}
                />

                <ConfirmationModal
                    isOpen={!!expenseToDelete}
                    onClose={() => setExpenseToDelete(null)}
                    onConfirm={handleDeleteExpense}
                    title="Delete Expense?"
                    description={`Are you sure you want to delete "${expenseToDelete?.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                    variant="danger"
                    isLoading={!!isDeleting}
                />
            </div>
        </div>
    );
}
