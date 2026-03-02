"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BiX, BiReceipt } from "react-icons/bi";
import { PiCaretRight, PiCheckCircle, PiUploadSimple, PiBuilding, PiTag, PiCalendar, PiCurrencyDollar, PiFileText, PiPlus, PiPencil, PiWarning } from "react-icons/pi";
import { fulfillRequisition, updateRequisition } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import { DeleteEntityButton } from "@/components/dashboard/DeleteEntityButton";
import { AddItemModal } from "@/components/requisitions/AddItemModal";

interface RequisitionListProps {
    requisitions: any[];
    monthlyBudgets?: any[];
}

export function RequisitionList({ requisitions, monthlyBudgets = [] }: RequisitionListProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [selectedReq, setSelectedReq] = useState<any>(null);
    const [viewingReq, setViewingReq] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Normalize both types for a unified list
    const allItems = [
        ...requisitions.map(r => ({ ...r, listType: 'STANDARD' })),
        ...monthlyBudgets.map(b => ({
            ...b,
            listType: 'MONTHLY',
            title: `Budget: ${new Date(2024, b.month - 1).toLocaleString('default', { month: 'long' })} ${b.year}`,
            amount: b.totalAmount
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const [isUploading, setIsUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [addingItemTo, setAddingItemTo] = useState<any>(null);

    // Edit state
    const [editingReq, setEditingReq] = useState<any>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editBranch, setEditBranch] = useState("");
    const [editDepartment, setEditDepartment] = useState("");
    const [editExpectedDate, setEditExpectedDate] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");

    const openEdit = (req: any) => {
        setEditingReq(req);
        setEditTitle(req.title || "");
        setEditDescription(req.description || "");
        setEditBranch(req.branch || "");
        setEditDepartment(req.department || "");
        setEditExpectedDate(req.expectedDate ? new Date(req.expectedDate).toISOString().split('T')[0] : "");
        setEditError("");
    };

    const handleEditSave = async () => {
        if (!editingReq) return;
        setEditSaving(true);
        setEditError("");
        const fd = new FormData();
        fd.append("id", editingReq.id);
        fd.append("title", editTitle);
        fd.append("description", editDescription);
        fd.append("branch", editBranch);
        fd.append("department", editDepartment);
        if (editExpectedDate) fd.append("expectedDate", editExpectedDate);
        const result = await updateRequisition(fd);
        setEditSaving(false);
        if (result.success) {
            showToast("Requisition updated successfully", "success");
            setEditingReq(null);
            router.refresh();
        } else {
            setEditError(result.message || "Failed to save");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                setReceiptUrl(data.url);
                showToast("Receipt uploaded successfully", "success");
            }
        } catch (err) {
            showToast("Failed to upload receipt", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFulfill = async () => {
        if (!receiptUrl || !selectedReq) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("requisitionId", selectedReq.id);
        formData.append("receiptUrl", receiptUrl);

        try {
            const result = await fulfillRequisition(formData);
            if (result.success) {
                showToast("Receipt submitted! Expense is now in the Pay queue.", "success");
                setSelectedReq(null);
                setReceiptUrl(null);
                setShowConfirmation(false);
                router.refresh();
            } else {
                showToast(result.error || "Failed to submit", "error");
            }
        } catch (err) {
            showToast("An error occurred", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status.toUpperCase()) {
            case 'APPROVED':
            case 'PAID':
            case 'FULFILLED':
            case 'COMPLETED':
                return "text-emerald-700 font-bold uppercase tracking-widest text-[9px]";
            case 'PENDING': return "text-gray-500 font-bold uppercase tracking-widest text-[9px]";
            case 'REJECTED': return "text-red-700 font-bold uppercase tracking-widest text-[9px]";
            default: return "text-gray-400 font-bold uppercase tracking-widest text-[9px]";
        }
    };

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="pl-6 py-4 w-24 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">ID</th>
                            <th className="py-4 min-w-[300px] text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item / Purpose</th>
                            <th className="py-4 w-28 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                            <th className="py-4 w-32 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                            <th className="py-4 w-28 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                            <th className="pr-6 py-4 w-[280px] text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-16 text-center text-gray-400 italic">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            allItems.map((req: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="pl-6 py-5 font-mono text-[10px] text-gray-400 align-top">
                                        {req.id.slice(0, 8).toUpperCase()}
                                    </td>
                                    <td className="py-5 align-top">
                                        <div className="flex flex-col gap-1.5 pr-4">
                                            <div className="flex items-start gap-2">
                                                <span className="text-sm font-semibold text-gray-900 leading-snug break-words">
                                                    {req.title}
                                                </span>
                                                {req.listType === 'MONTHLY' && (
                                                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0 leading-none mt-0.5 uppercase">Plan</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                <PiBuilding />
                                                <span>{req.branch || "Global"} {req.department && `• ${req.department}`}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 text-xs text-gray-500 align-top whitespace-nowrap">
                                        {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="py-5 text-sm font-mono font-medium text-gray-900 align-top whitespace-nowrap">
                                        ${req.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-5 align-top whitespace-nowrap">
                                        <span className={getStatusStyles(req.status)}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="pr-6 py-4 align-top">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {req.listType === 'STANDARD' && ['PENDING', 'NEEDS_INFO'].includes(req.status) && (
                                                <button
                                                    onClick={() => openEdit(req)}
                                                    className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Edit Requisition"
                                                >
                                                    <PiPencil className="text-[15px]" />
                                                </button>
                                            )}

                                            {req.listType === 'STANDARD' && (req.status === 'PENDING' || req.status === 'APPROVED') && (
                                                <button
                                                    onClick={() => setAddingItemTo(req)}
                                                    className="text-xs font-medium text-gray-700 bg-white border border-gray-200 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-all flex items-center gap-1.5 whitespace-nowrap"
                                                    title="Add Item"
                                                >
                                                    <PiPlus className="text-sm" />
                                                    Add item
                                                </button>
                                            )}

                                            {req.listType === 'STANDARD' && req.status === 'APPROVED' ? (
                                                <button
                                                    onClick={() => setSelectedReq(req)}
                                                    className="text-xs font-medium text-[#29258D] bg-[#29258D]/5 border border-[#29258D]/20 px-2.5 py-1.5 rounded-md hover:bg-[#29258D] hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap"
                                                >
                                                    <PiUploadSimple className="text-sm" />
                                                    Submit receipt
                                                </button>
                                            ) : null}

                                            {req.listType === 'STANDARD' && (req.status === 'APPROVED' || req.status === 'PAID' || req.status === 'FULFILLED') ? (
                                                <Link
                                                    href={`/receipt-studio?requisitionId=${req.id}`}
                                                    className="text-xs font-medium text-gray-700 bg-white border border-gray-200 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-all flex items-center gap-1.5 whitespace-nowrap"
                                                >
                                                    <BiReceipt className="text-sm" />
                                                    Voucher
                                                </Link>
                                            ) : null}

                                            {req.listType === 'STANDARD' && ((req.status === 'FULFILLED' || req.status === 'COMPLETED') && req.receiptUrl) ? (
                                                <a
                                                    href={req.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-md hover:bg-emerald-100 transition-all flex items-center gap-1.5 whitespace-nowrap"
                                                >
                                                    <BiReceipt className="text-sm" />
                                                    Receipt
                                                </a>
                                            ) : null}

                                            <div className="flex items-center gap-0.5 ml-1 border-l border-gray-100 pl-1">
                                                <button
                                                    onClick={() => setViewingReq(req)}
                                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
                                                    title="View Details"
                                                >
                                                    <PiCaretRight className="text-[15px]" />
                                                </button>

                                                {req.listType === 'STANDARD' && req.status !== 'FULFILLED' && (
                                                    <DeleteEntityButton
                                                        id={req.id}
                                                        entityType="requisition"
                                                        entityName={req.title}
                                                        className="p-1.5 !text-gray-400 hover:!text-rose-500 hover:!bg-rose-50"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Fulfill Modal */}
            {selectedReq && mounted && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in gpu-accel">
                    <div className="bg-white max-w-xl w-full rounded-xl shadow-2xl overflow-hidden animate-scale-in flex flex-col border border-gray-200">
                        <div className="h-[88px] px-6 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">Fulfill Requisition</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                                        ID: {selectedReq.id.slice(0, 8)}
                                    </p>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                    <p className="text-[10px] text-[#29258D] font-semibold uppercase tracking-widest">
                                        Amount: ${selectedReq.amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReq(null)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <BiX className="text-2xl" />
                            </button>
                        </div>

                        <div className="bg-[#F6F6F6] p-8 space-y-6">
                            <div className={cn(
                                "p-8 rounded-xl border-2 border-dashed transition-all group bg-white",
                                receiptUrl ? "border-[#29258D]/30" : "border-gray-200 hover:border-[#29258D]"
                            )}>
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="modal-receipt-upload"
                                    accept="image/*,.pdf"
                                />
                                <label htmlFor="modal-receipt-upload" className="cursor-pointer space-y-4 block text-center">
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-2 border-[#29258D] border-t-transparent rounded-full animate-spin" />
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Uploading...</p>
                                        </div>
                                    ) : receiptUrl ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-[#29258D]/10 flex items-center justify-center">
                                                <PiCheckCircle className="text-3xl text-[#29258D]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">Receipt Attached</p>
                                                <p className="text-[10px] text-[#29258D] font-bold uppercase mt-1">Ready to submit</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-sm">
                                                <PiUploadSimple className="text-2xl text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Click to Upload</p>
                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">PDF or image format</p>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {showConfirmation && (
                                <div className="p-4 bg-white border border-gray-200 rounded-xl flex gap-3 animate-fade-in shadow-sm">
                                    <div className="w-1 h-auto bg-[#29258D] rounded-full" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-1">Final Confirmation</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Please verify that the attached receipt matches the approved amount of <span className="text-[#29258D] font-bold">${selectedReq.amount.toLocaleString()}</span>.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-[88px] px-6 bg-white border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setSelectedReq(null)}
                                className="px-4 py-2.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-none"
                            >
                                Cancel
                            </button>

                            {!showConfirmation ? (
                                <button
                                    onClick={() => setShowConfirmation(true)}
                                    disabled={!receiptUrl}
                                    className="px-5 py-2.5 rounded-md text-xs font-medium text-white bg-[#29258D] hover:bg-[#29258D]/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
                                >
                                    <BiReceipt className="text-sm" />
                                    <span>Review & Submit</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowConfirmation(false)}
                                        className="px-4 py-2.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-none"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleFulfill}
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 rounded-md text-xs font-medium text-white bg-[#29258D] hover:bg-[#29258D]/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
                                    >
                                        {isSubmitting ? "Submitting..." : "Confirm & Submit"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Requisition Details Modal */}
            {viewingReq && mounted && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in gpu-accel">
                    <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col border border-gray-200">
                        <div className="h-[80px] px-8 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                    <PiFileText className="text-xl text-gray-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">{viewingReq.title}</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        {viewingReq.listType} Requisition • {viewingReq.id.slice(0, 8)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingReq(null)}
                                className="p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                            >
                                <BiX className="text-2xl" />
                            </button>
                        </div>

                        <div className="bg-[#f8f9fa] p-8 space-y-6 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <PiCurrencyDollar className="text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900">
                                        ${viewingReq.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <PiTag className="text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">{viewingReq.category || "Uncategorized"}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                                    <div className="p-2 rounded-lg bg-gray-50">
                                        <PiBuilding className="text-lg text-gray-400" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Origin</span>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {viewingReq.department || "General"} • {viewingReq.branch || "Global Office"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                                    <div className="p-2 rounded-lg bg-gray-50">
                                        <PiCalendar className="text-lg text-gray-400" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Created On</span>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {new Date(viewingReq.createdAt).toLocaleDateString(undefined, {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {viewingReq.description && (
                                <div className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3 underline underline-offset-4 decoration-gray-200">
                                        Purpose & Justification
                                    </span>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                        {viewingReq.description}
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full animate-pulse",
                                        viewingReq.status === 'APPROVED' ? "bg-emerald-500" :
                                            viewingReq.status === 'REJECTED' ? "bg-red-500" : "bg-amber-500"
                                    )} />
                                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest">
                                        Current Status: {viewingReq.status}
                                    </span>
                                </div>
                                {viewingReq.listType === 'STANDARD' && viewingReq.status === 'APPROVED' && (
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase italic">
                                        Ready for receipt fulfillment
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="h-[80px] px-8 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
                            <div>
                                {viewingReq.listType === 'STANDARD' && viewingReq.status !== 'FULFILLED' && (
                                    <DeleteEntityButton
                                        id={viewingReq.id}
                                        entityType="requisition"
                                        entityName={viewingReq.title}
                                        className="py-2 px-4 text-xs font-bold text-rose-600 border border-rose-100 hover:bg-rose-50 flex items-center gap-2"
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setViewingReq(null)}
                                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                                >
                                    Close Window
                                </button>
                                {viewingReq.listType === 'STANDARD' && viewingReq.status === 'APPROVED' && (
                                    <button
                                        onClick={() => {
                                            setViewingReq(null);
                                            setSelectedReq(viewingReq);
                                        }}
                                        className="px-6 py-2.5 rounded-xl bg-[#29258D] text-white text-xs font-bold hover:bg-[#29258D]/90 transition-all shadow-lg shadow-[#29258D]/20 flex items-center gap-2"
                                    >
                                        <PiCheckCircle className="text-lg" />
                                        Proceed to Fulfill
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add Item Modal */}
            {addingItemTo && (
                <AddItemModal
                    isOpen={true}
                    onClose={() => setAddingItemTo(null)}
                    requisitionId={addingItemTo.id}
                    currency={addingItemTo.currency || "USD"}
                    onItemAdded={() => {
                        showToast("Item added successfully", "success");
                        router.refresh();
                    }}
                />
            )}

            {/* Edit Requisition Modal */}
            {editingReq && mounted && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
                    <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
                        {/* Header */}
                        <div className="h-[80px] shrink-0 flex items-center justify-between px-6 bg-gradient-to-r from-[#29258D] to-[#3d39c4] text-white">
                            <div>
                                <h2 className="text-sm font-bold">Edit Requisition</h2>
                                <p className="text-[10px] text-white/60 font-mono mt-0.5">#{editingReq.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setEditingReq(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <BiX className="text-2xl" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 overflow-y-auto bg-[#f8f9fa]">
                            {editError && (
                                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                                    <PiWarning className="text-base shrink-0" />
                                    {editError}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Title <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all"
                                    placeholder="Requisition title"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Justification <span className="text-rose-500">*</span></label>
                                <textarea
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    rows={4}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all resize-none"
                                    placeholder="Explain the business need..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Branch</label>
                                    <input
                                        type="text"
                                        value={editBranch}
                                        onChange={e => setEditBranch(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all"
                                        placeholder="e.g. Nairobi"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Department</label>
                                    <input
                                        type="text"
                                        value={editDepartment}
                                        onChange={e => setEditDepartment(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all"
                                        placeholder="e.g. Finance"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Expected Date</label>
                                <input
                                    type="date"
                                    value={editExpectedDate}
                                    onChange={e => setEditExpectedDate(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all"
                                />
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <PiWarning className="text-amber-500 text-base mt-0.5 shrink-0" />
                                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                    Only <strong>PENDING</strong> requisitions can be edited. Once approved, contact an admin to make changes.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="h-[72px] shrink-0 flex items-center justify-end gap-3 px-6 bg-white border-t border-gray-100">
                            <button
                                onClick={() => setEditingReq(null)}
                                className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={editSaving}
                                className="px-6 py-2.5 text-xs font-bold text-white bg-[#29258D] rounded-xl hover:bg-[#29258D]/90 transition-all flex items-center gap-2 disabled:opacity-60"
                            >
                                {editSaving ? (
                                    <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                                ) : (
                                    <><PiCheckCircle className="text-sm" /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
