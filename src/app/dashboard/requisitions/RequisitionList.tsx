"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BiX, BiReceipt } from "react-icons/bi";
import { PiCaretRight, PiCheckCircle, PiUploadSimple, PiBuilding, PiTag, PiCalendar, PiCurrencyDollar, PiFileText, PiPlus } from "react-icons/pi";
import { fulfillRequisition } from "./actions";
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
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="pl-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID</th>
                            <th className="py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item / Purpose</th>
                            <th className="py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                            <th className="py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="pr-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
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
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="pl-6 py-4 font-mono text-[10px] text-gray-400">
                                        {req.id.slice(0, 8).toUpperCase()}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900">{req.title}</span>
                                                {req.listType === 'MONTHLY' && (
                                                    <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">PLAN</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-tight">
                                                {req.branch || "Global"} {req.department && `• ${req.department}`}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-xs text-gray-500">
                                        {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="py-4 text-sm font-mono font-medium text-gray-900">
                                        ${req.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-4">
                                        <span className={getStatusStyles(req.status)}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="pr-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {req.listType === 'STANDARD' && (req.status === 'PENDING' || req.status === 'APPROVED') && (
                                                <button
                                                    onClick={() => setAddingItemTo(req)}
                                                    className="text-[10px] font-bold text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-200 transition-all uppercase tracking-widest flex items-center gap-1.5"
                                                    title="Add another item to this requisition"
                                                >
                                                    <PiPlus className="text-sm" />
                                                    Add Item
                                                </button>
                                            )}

                                            {req.listType === 'STANDARD' && req.status === 'APPROVED' ? (
                                                <button
                                                    onClick={() => setSelectedReq(req)}
                                                    className="text-[10px] font-bold text-[#29258D] bg-[#29258D]/5 border border-[#29258D]/10 px-3 py-1.5 rounded hover:bg-[#29258D] hover:text-white transition-all uppercase tracking-widest"
                                                >
                                                    Submit Receipt
                                                </button>
                                            ) : null}

                                            {req.listType === 'STANDARD' && (req.status === 'APPROVED' || req.status === 'PAID' || req.status === 'FULFILLED') ? (
                                                <Link
                                                    href={`/receipt-studio?requisitionId=${req.id}`}
                                                    className="text-[10px] font-bold text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-200 transition-all uppercase tracking-widest flex items-center gap-1.5"
                                                >
                                                    <BiReceipt className="text-sm" />
                                                    Generate Voucher
                                                </Link>
                                            ) : null}

                                            {req.listType === 'STANDARD' && ((req.status === 'FULFILLED' || req.status === 'COMPLETED') && req.receiptUrl) ? (
                                                <a
                                                    href={req.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded hover:bg-emerald-100 transition-all uppercase tracking-widest flex items-center gap-1.5"
                                                >
                                                    <BiReceipt className="text-sm" />
                                                    View Receipt
                                                </a>
                                            ) : null}

                                            <button
                                                onClick={() => setViewingReq(req)}
                                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
                                                title="View Details"
                                            >
                                                <PiCaretRight className="text-base" />
                                            </button>

                                            {req.listType === 'STANDARD' && req.status !== 'FULFILLED' && (
                                                <DeleteEntityButton
                                                    id={req.id}
                                                    entityType="requisition"
                                                    entityName={req.title}
                                                    className="p-1.5"
                                                />
                                            )}
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
        </>
    );
}
