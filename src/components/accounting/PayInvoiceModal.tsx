"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    PiX,
    PiCurrencyDollar,
    PiBank,
    PiCalendar,
    PiCheckCircle,
    PiWarning
} from "react-icons/pi";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { DatePicker } from "@/components/ui/DatePicker";
import { format, parseISO } from "date-fns";

interface PayInvoiceModalProps {
    invoice: {
        id: string;
        invoiceNumber: string;
        amount: number;
        vendor: {
            name: string;
            bankName?: string | null;
            bankAccount?: string | null;
        };
    };
    onClose: () => void;
}

export function PayInvoiceModal({ invoice, onClose }: PayInvoiceModalProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: invoice.amount,
        paymentDate: new Date().toISOString().split('T')[0],
        method: 'BANK_TRANSFER',
        reference: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/invoices/${invoice.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Payment failed');

            showToast('Payment recorded successfully', 'success');
            router.refresh();
            onClose();
        } catch (error) {
            showToast('Failed to record payment', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <PiCurrencyDollar className="text-2xl text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                            <p className="text-sm text-gray-600">Invoice {invoice.invoiceNumber}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-gray-900"
                    >
                        <PiX className="text-xl" />
                    </button>
                </div>

                {/* Vendor Info */}
                <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Payee</p>
                            <p className="text-sm font-bold text-gray-900">{invoice.vendor.name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Invoice Amount</p>
                            <p className="text-lg font-heading font-bold text-gray-900">
                                ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        {invoice.vendor.bankAccount && (
                            <>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bank</p>
                                    <p className="text-sm font-medium text-gray-700">{invoice.vendor.bankName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Account</p>
                                    <p className="text-sm font-mono font-medium text-gray-700">{invoice.vendor.bankAccount}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Payment Amount
                            </label>
                            <div className="relative">
                                <PiCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Payment Date
                            </label>
                            <DatePicker
                                value={formData.paymentDate ? parseISO(formData.paymentDate) : undefined}
                                onChange={(d) => setFormData({ ...formData, paymentDate: format(d, 'yyyy-MM-dd') })}
                                placeholder="Payment Date"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Payment Method
                        </label>
                        <div className="relative">
                            <PiBank className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={formData.method}
                                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                required
                            >
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CHECK">Check</option>
                                <option value="CASH">Cash</option>
                                <option value="MOBILE_MONEY">Mobile Money</option>
                                <option value="WIRE">Wire Transfer</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Reference / Transaction ID
                        </label>
                        <input
                            type="text"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="e.g., TXN-123456, Check #789"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Add any additional payment details..."
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none placeholder:text-gray-400"
                        />
                    </div>

                    {/* Warning if partial payment */}
                    {formData.amount < invoice.amount && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                            <PiWarning className="text-xl text-amber-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-900">Partial Payment</p>
                                <p className="text-xs text-amber-700 mt-1">
                                    This is a partial payment. Remaining balance: ${(invoice.amount - formData.amount).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                'Processing...'
                            ) : (
                                <>
                                    <PiCheckCircle className="mr-2 text-lg" />
                                    Record Payment
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
