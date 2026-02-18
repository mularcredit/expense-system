"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { PiPlus, PiFilePlus, PiListPlus, PiX } from "react-icons/pi";
import { AddItemModal } from "@/components/requisitions/AddItemModal";

interface RequisitionTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingRequisitions?: any[]; // For the add item flow
    isLoading?: boolean;
}

export function RequisitionTypeModal({ isOpen, onClose, existingRequisitions = [], isLoading = false }: RequisitionTypeModalProps) {
    const router = useRouter();
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen) return null;
    if (!mounted) return null;

    let content;

    if (showAddItemModal && selectedRequisition) {
        content = (
            <AddItemModal
                isOpen={true}
                onClose={() => {
                    setShowAddItemModal(false);
                    setSelectedRequisition(null);
                    onClose();
                }}
                requisitionId={selectedRequisition.id}
                currency={selectedRequisition.currency || "USD"}
                onItemAdded={() => {
                    onClose();
                    router.refresh();
                }}
            />
        );
    } else if (showAddItemModal && !selectedRequisition) {
        // Improved Add Item Flow: First select a requisition
        content = (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Select Requisition</h2>
                            <p className="text-xs text-gray-500">Choose a requisition to add items to</p>
                        </div>
                        <button onClick={() => setShowAddItemModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <PiX className="text-xl text-gray-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#29258D]"></div>
                            </div>
                        ) : existingRequisitions.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <p>No eligible requisitions found.</p>
                                <p className="text-xs mt-1">You can only add items to Pending, Approved, or Paid requisitions.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {existingRequisitions.map((req) => (
                                    <button
                                        key={req.id}
                                        onClick={() => setSelectedRequisition(req)}
                                        className="text-left p-4 rounded-xl border border-gray-200 hover:border-[#29258D] hover:bg-[#29258D]/5 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-900 group-hover:text-[#29258D]">{req.title}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                req.status === 'PAID' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex gap-3">
                                            <span>{req.id.slice(0, 8).toUpperCase()}</span>
                                            <span>•</span>
                                            <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="font-medium text-gray-700">{req.currency} {req.amount.toLocaleString()}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    } else {
        // Initial Choice
        content = (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Create Request</h2>
                            <p className="text-xs text-gray-500">What would you like to do?</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <PiX className="text-xl text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 grid gap-4">
                        <button
                            onClick={() => {
                                onClose();
                                router.push('/dashboard/requisitions/new');
                            }}
                            className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#29258D] hover:bg-[#29258D]/5 transition-all group text-left"
                        >
                            <div className="p-3 rounded-lg bg-[#29258D]/10 text-[#29258D] group-hover:scale-110 transition-transform">
                                <PiFilePlus className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-[#29258D]">New Requisition</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Create a completely new purchase request. Start fresh with a new approval workflow.
                                </p>
                            </div>
                        </button>

                        <button
                            onClick={() => setShowAddItemModal(true)}
                            className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50 transition-all group text-left"
                        >
                            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                                <PiListPlus className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-emerald-700">Add Item to Existing</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Add an item to a requisition that is already in progress, approved, or paid.
                                </p>
                            </div>
                        </button>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return createPortal(content, document.body);
}
