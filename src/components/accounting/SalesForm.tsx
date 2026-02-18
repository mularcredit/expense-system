
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import {
    PiUser,
    PiCalendarBlank,
    PiInvoice,
    PiPlus,
    PiTrash,
    PiSpinner,
    PiPaperPlaneRight,
    PiFloppyDisk
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { format, parseISO } from "date-fns";
import { ConfirmationModal } from "@/components/ui/Modal";

interface SaleItem {
    id: number | string;
    description: string;
    quantity: number;
    unitPrice: number;
}

interface Customer {
    id: string;
    name: string;
    currency: string;
}

export interface SalesFormProps {
    customers: Customer[];
    initialData?: {
        id: string;
        customerId: string;
        invoiceNumber: string;
        issueDate: string | Date;
        dueDate: string | Date;
        notes?: string | null;
        status: string;
        items: SaleItem[];
    };
}

export function SalesForm({ customers, initialData }: SalesFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        customerId: initialData?.customerId || "",
        invoiceNumber: initialData?.invoiceNumber || "",
        issueDate: initialData?.issueDate
            ? new Date(initialData.issueDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        dueDate: initialData?.dueDate
            ? new Date(initialData.dueDate).toISOString().split('T')[0]
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: initialData?.notes || "",
        items: initialData?.items?.map(i => ({
            ...i,
            id: i.id || Date.now() + Math.random(), // Ensure unique ID for key
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice)
        })) || [
                { id: Date.now(), description: "", quantity: 1, unitPrice: "" as any }
            ]
    });

    const activeCustomer = customers.find(c => c.id === formData.customerId);
    const currency = activeCustomer?.currency || "USD";

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                { id: Date.now(), description: "", quantity: 1, unitPrice: "" as any }
            ]
        });
    };

    const handleRemoveItem = (id: number | string) => {
        if (formData.items.length === 1) return;
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.id !== id)
        });
    };

    const handleItemChange = (id: number | string, field: string, value: any) => {
        setFormData({
            ...formData,
            items: formData.items.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        });
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleDelete = async () => {
        if (!initialData?.id) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/accounting/sales/${initialData.id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }

            showToast("Invoice deleted successfully", "success");
            setIsDeleteModalOpen(false);
            router.push("/dashboard/accounting/sales");
            router.refresh();
        } catch (error: any) {
            showToast(error.message, "error");
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (status: 'DRAFT' | 'SENT') => {
        if (!formData.customerId) {
            showToast("Please select a customer", "error");
            return;
        }
        if (formData.items.some(i => !i.description || i.unitPrice <= 0)) {
            showToast("Please complete all line items", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const url = initialData?.id
                ? `/api/accounting/sales/${initialData.id}`
                : "/api/accounting/sales";

            const method = initialData?.id ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, status })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save sale");
            }

            const sale = await res.json();
            showToast(
                initialData
                    ? "Invoice updated successfully"
                    : (status === 'SENT' ? "Invoice saved and posted!" : "Draft saved successfully"),
                "success"
            );

            // Redirect to the list
            router.push("/dashboard/accounting/sales");
            router.refresh();

        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-white px-6 py-6 flex flex-col justify-center border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900">Invoice Details</h2>
                        <p className="text-xs text-gray-500 mt-1">Manage customer and sales information</p>
                    </div>

                    {/* Body */}
                    <div className="p-6 lg:p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Customer <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <PiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                    <select
                                        className="w-full pl-10 pr-4 h-11 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] focus:bg-white transition-all text-sm font-medium text-gray-900 cursor-pointer appearance-none"
                                        value={formData.customerId}
                                        onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                    >
                                        <option value="">Select a customer...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Invoice Number</label>
                                <div className="relative">
                                    <PiInvoice className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                    <Input
                                        type="text"
                                        className="pl-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all h-11 font-mono"
                                        placeholder="Auto-generated"
                                        value={formData.invoiceNumber}
                                        onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <DatePicker
                                    label="ISSUE DATE"
                                    value={formData.issueDate ? parseISO(formData.issueDate) : undefined}
                                    onChange={(d) => setFormData({ ...formData, issueDate: format(d, 'yyyy-MM-dd') })}
                                    placeholder="Issue Date"
                                />
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="pt-8 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Item Details</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAddItem}
                                    className="text-xs font-bold text-[#29258D] hover:bg-indigo-50 hover:text-[#29258D] gap-1 h-8"
                                >
                                    <PiPlus /> Add Line Item
                                </Button>
                            </div>

                            <div className="space-y-3 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                {formData.items.map((item, index) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start animate-fade-in group">
                                        <div className="flex-1 w-full">
                                            <Input
                                                type="text"
                                                placeholder="Description"
                                                className="bg-white border-gray-200 focus:ring-[#29258D] h-10"
                                                value={item.description}
                                                onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-3 w-full sm:w-auto">
                                            <div className="w-24">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Qty"
                                                    className="bg-white border-gray-200 focus:ring-[#29258D] text-center h-10"
                                                    value={item.quantity || ""}
                                                    onChange={e => handleItemChange(item.id, 'quantity', e.target.value ? parseInt(e.target.value) : "")}
                                                />
                                            </div>
                                            <div className="w-32">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Price"
                                                    step="0.01"
                                                    className="bg-white border-gray-200 focus:ring-[#29258D] text-right font-mono h-10"
                                                    value={item.unitPrice || ""}
                                                    onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value ? parseFloat(e.target.value) : "")}
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors h-10 w-10 shrink-0"
                                            >
                                                <PiTrash className="text-lg" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Notes / Terms</label>
                            <textarea
                                className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] focus:bg-white transition-all text-sm h-32 resize-none placeholder:text-gray-400"
                                placeholder="Payment terms, delivery notes, etc."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-8">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 pb-2 border-b border-gray-100">
                        Summary
                    </h3>

                    <div className="space-y-3 mb-8">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">Subtotal</span>
                            <span className="font-mono font-bold text-gray-900">{calculateTotal().toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">Tax (0%)</span>
                            <span className="font-mono font-bold text-gray-900">0.00 {currency}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-4 border-t border-gray-100">
                            <span className="text-gray-900">Total</span>
                            <span className="text-[#29258D]">{calculateTotal().toFixed(2)} {currency}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={() => handleSubmit('SENT')}
                            disabled={isSubmitting}
                            className="w-full h-11 bg-[#29258D] hover:bg-[#29258D]/90 text-white font-bold shadow-lg shadow-indigo-500/20"
                        >
                            {isSubmitting ? <PiSpinner className="animate-spin text-lg" /> : (initialData ? <PiFloppyDisk className="text-lg" /> : <PiPaperPlaneRight className="text-lg" />)}
                            <span className="ml-2">{initialData ? "Update Invoice" : "Save & Post to Ledger"}</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit('DRAFT')}
                            disabled={isSubmitting}
                            className="w-full h-11 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold"
                        >
                            <PiFloppyDisk className="text-lg mr-2" />
                            Save as Draft
                        </Button>

                        {initialData && (
                            <Button
                                variant="ghost"
                                onClick={() => setIsDeleteModalOpen(true)}
                                type="button"
                                disabled={isSubmitting}
                                className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold h-11"
                            >
                                <PiTrash className="text-lg mr-2" />
                                Delete Invoice
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Invoice?"
                description={`Are you sure you want to delete invoice ${formData.invoiceNumber || 'this invoice'}? This action will permanently remove it and all associated ledger entries. This cannot be undone.`}
                confirmText="Yes, Delete"
                cancelText="Cancel"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    );
}
