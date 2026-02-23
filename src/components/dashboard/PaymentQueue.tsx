"use client";


import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import {
    PiHandCoins,
    PiCheckCircle,
    PiReceipt,
    PiUser,
    PiBank,
    PiClock,
    PiEye,
    PiArrowRight,
    PiX,
    PiMoney,
    PiTrendUp,
    PiWarningCircle,
    PiFileText,
    PiBuildings,
    PiInfo,
    PiLightbulb,
    PiCaretLeft,
    PiCaretRight,
    PiFunnel
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

// Types
interface UserBasic {
    name: string | null;
    email: string | null;
    department?: string | null;
    bankAccount?: string | null;
}

interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    merchant: string | null;
    receiptUrl: string | null;
    updatedAt: Date;
    user: UserBasic;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    vendor: { name: string };
    amount: number;
    dueDate: Date;
    description: string | null;
    createdBy: UserBasic;
}

interface Requisition {
    id: string;
    title: string;
    amount: number;
    category: string;
    updatedAt: Date;
    user: UserBasic;
}

interface Budget {
    id: string;
    month: number;
    year: number;
    totalAmount: number;
    branch: string;
    department: string;
    user: UserBasic;
}

interface PaymentBatch {
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    notes: string | null;
    createdAt: Date;
    maker: UserBasic;
    _count?: {
        invoices: number;
        expenses: number;
        requisitions?: number;
        monthlyBudgets?: number;
    };
}

interface PaymentQueueProps {
    expenses: Expense[];
    invoices: Invoice[];
    requisitions?: Requisition[];
    budgets?: Budget[];
    pendingPayments: PaymentBatch[];
    authorizedPayments?: PaymentBatch[];
    history: any[];
    userRole: string;
    stripeStatus?: string;
}

export function PaymentQueue({
    expenses = [],
    invoices = [],
    requisitions = [],
    budgets = [],
    pendingPayments = [],
    authorizedPayments = [],
    history = [],
    userRole,
    stripeStatus = 'NOT_CONNECTED'
}: PaymentQueueProps) {
    const { showToast } = useToast();
    const router = useRouter();

    const getDefaultTab = () => {
        if (authorizedPayments.length > 0 && ['FINANCE_TEAM', 'FINANCE_APPROVER', 'SYSTEM_ADMIN'].includes(userRole)) return 'disbursements';
        if (pendingPayments.length > 0 && ['FINANCE_APPROVER', 'MANAGER'].includes(userRole)) return 'approvals';
        if ((expenses.length > 0 || invoices.length > 0 || requisitions.length > 0 || budgets.length > 0)) return 'payables';
        return 'history';
    }

    const [activeTab, setActiveTab] = useState<'payables' | 'approvals' | 'disbursements' | 'history'>(getDefaultTab());
    const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
    const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
    const [selectedRequisitions, setSelectedRequisitions] = useState<Set<string>>(new Set());
    const [selectedBudgets, setSelectedBudgets] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [showHelp, setShowHelp] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CASH'>('BANK_TRANSFER');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        paymentId: string;
        action: 'AUTHORIZE' | 'REJECT' | 'DISBURSE';
        paymentMethod?: 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CASH';
    } | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7; // Show 7 items per page for a cleaner look

    // Calculate pagination
    const totalPages = Math.ceil(history.length / itemsPerPage);
    const currentHistory = history.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const toggleExpense = (id: string) => {
        const newSet = new Set(selectedExpenses);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedExpenses(newSet);
    };

    const toggleInvoice = (id: string) => {
        const newSet = new Set(selectedInvoices);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedInvoices(newSet);
    };

    const toggleRequisition = (id: string) => {
        const newSet = new Set(selectedRequisitions);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRequisitions(newSet);
    };

    const toggleBudget = (id: string) => {
        const newSet = new Set(selectedBudgets);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedBudgets(newSet);
    };

    const totalSelectedAmount =
        expenses.filter(e => selectedExpenses.has(e.id)).reduce((sum, e) => sum + e.amount, 0) +
        invoices.filter(i => selectedInvoices.has(i.id)).reduce((sum, i) => sum + i.amount, 0) +
        requisitions.filter(r => selectedRequisitions.has(r.id)).reduce((sum, r) => sum + r.amount, 0) +
        budgets.filter(b => selectedBudgets.has(b.id)).reduce((sum, b) => sum + b.totalAmount, 0);

    const handleCreateBatch = async () => {
        if (selectedExpenses.size === 0 && selectedInvoices.size === 0 && selectedRequisitions.size === 0 && selectedBudgets.size === 0) return;

        setIsProcessing(true);
        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expenseIds: Array.from(selectedExpenses),
                    invoiceIds: Array.from(selectedInvoices),
                    requisitionIds: Array.from(selectedRequisitions),
                    budgetIds: Array.from(selectedBudgets),
                    method: 'BANK_TRANSFER',
                    notes: `Batch payment for items`
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            showToast('Payment batch created! Awaiting authorization.', 'success');
            setSelectedExpenses(new Set());
            setSelectedInvoices(new Set());
            setSelectedRequisitions(new Set());
            setSelectedBudgets(new Set());
            router.refresh();
            setActiveTab('approvals');
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleAuthorization = (paymentId: string, action: 'AUTHORIZE' | 'REJECT' | 'DISBURSE') => {
        setConfirmationModal({ isOpen: true, paymentId, action, paymentMethod: paymentMethod });
        setSelectedFile(null); // Reset file selection
    };

    const proceedAuthorization = async () => {
        if (!confirmationModal) return;
        const { paymentId, action } = confirmationModal;

        setIsProcessing(true);
        try {
            let noteAttachment = "";

            if (action === 'DISBURSE' && selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload proof of payment');

                noteAttachment = ` [Proof: ${uploadData.url}]`;
            }

            const response = await fetch('/api/payments/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId,
                    action,
                    paymentMethod: confirmationModal.paymentMethod || 'BANK_TRANSFER',
                    proofUrl: noteAttachment ? noteAttachment.replace(' [Proof: ', '').replace(']', '') : undefined
                })
            });

            // Update: I will update the route to accept notes/proofUrl because user requirement is strict.
            // But first let's get the UI working. The upload works.

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            const successMessage = action === 'AUTHORIZE'
                ? 'Payment Authorized & ready for payout'
                : action === 'DISBURSE'
                    ? 'Payment disbursed successfully'
                    : 'Payment Rejected';

            showToast(successMessage, 'success');
            setConfirmationModal(null);
            router.refresh();

            if (action === 'AUTHORIZE') {
                setActiveTab('disbursements');
            }
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Help Banner */}
            {showHelp && activeTab === 'payables' && (expenses.length > 0 || invoices.length > 0) && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 relative">
                    <button
                        onClick={() => setShowHelp(false)}
                        className="absolute top-4 right-4 p-1 hover:bg-white rounded-lg transition-colors"
                    >
                        <PiX className="text-gray-400" />
                    </button>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <PiLightbulb className="text-2xl text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">How to Process Payments</h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                    <p><strong>Select items</strong> - Click on expenses or invoices to select them for payment</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                    <p><strong>Create batch</strong> - Click "Create Payment Batch" to group selected items</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                    <p><strong>Get approval</strong> - Finance approver authorizes the payment in the "Approvals" tab</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                                    <p><strong>Payment processed</strong> - Once authorized, funds are transferred to recipients</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── NEW LAYOUT: SIDEBAR + CONTENT ── */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* ── VERTICAL STEPPER SIDEBAR ── */}
                <div className="w-full lg:w-[280px] shrink-0 bg-[#0f1023] rounded-3xl p-8 sticky top-6 shadow-2xl border border-white/5 bg-[url('/assets/grain.png')]">

                    {/* Header text inside stepper */}
                    <div className="mb-10 pl-2">
                        <h3 className="text-white font-bold text-lg">Payment Process</h3>
                        <p className="text-white/40 text-xs mt-1">Follow the steps to complete payouts.</p>
                    </div>

                    <div className="relative space-y-0">
                        {/* Vertical Line */}
                        <div className="absolute left-[22px] top-4 bottom-10 w-[2px] bg-white/10 z-0"></div>

                        {[
                            { id: 'payables', label: 'Select Payables', sub: 'Browse and select', icon: PiCheckCircle },
                            { id: 'approvals', label: 'Approvals', sub: 'Authorize batches', icon: PiCheckCircle },
                            { id: 'disbursements', label: 'Disbursement', sub: 'Ready to pay', icon: PiCheckCircle },
                            { id: 'history', label: 'History', sub: 'Past transactions', icon: PiCheckCircle }
                        ].map((step, idx) => {
                            const isActive = activeTab === step.id;
                            const isPast = ['payables', 'approvals', 'disbursements', 'history'].indexOf(activeTab) > idx;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setActiveTab(step.id as any)}
                                    className="relative z-10 w-full flex items-center gap-4 py-6 text-left group transition-all"
                                >
                                    {/* Icon Circle */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300",
                                        isActive
                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110"
                                            : isPast
                                                ? "bg-[#1a1c35] border-emerald-500/50 text-emerald-500"
                                                : "bg-[#1a1c35] border-white/10 text-gray-500 group-hover:border-white/30"
                                    )}>
                                        <step.icon className={cn("text-xl", isActive && "animate-pulse")} />
                                    </div>

                                    {/* Text */}
                                    <div className={cn("transition-all duration-300", isActive ? "translate-x-1" : "")}>
                                        <p className={cn(
                                            "font-bold text-sm",
                                            isActive ? "text-white" : "text-white/60 group-hover:text-white/90"
                                        )}>
                                            {step.label}
                                        </p>
                                        <p className="text-[10px] text-white/30 font-medium mt-0.5">
                                            {step.sub}
                                        </p>
                                    </div>

                                    {/* Active Dot indicator on right edge */}
                                    {isActive && (
                                        <div className="absolute right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── MAIN CONTENT AREA ── */}
                <div className="flex-1 w-full min-w-0">


                    {/* TAB: PAYABLES */}
                    {activeTab === 'payables' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Selection Summary */}
                            {(selectedExpenses.size > 0 || selectedInvoices.size > 0 || selectedRequisitions.size > 0 || selectedBudgets.size > 0) && (
                                <div className="p-2 pl-3 pr-2 bg-[#0f1023] text-white rounded-xl shadow-2xl shadow-black/20 border border-white/10 flex items-center justify-between sticky top-6 z-30 mb-8 mx-auto max-w-2xl backdrop-blur-xl">
                                    <div className="flex items-center gap-4 pl-4">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <PiCheckCircle className="text-xl text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white/40">Total selected</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-lg font-bold tracking-tight text-white">
                                                    ${totalSelectedAmount.toFixed(2)}
                                                </p>
                                                <span className="text-[10px] text-emerald-400 font-medium hidden sm:inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                                    {[
                                                        selectedExpenses.size > 0 && `${selectedExpenses.size} expenses`,
                                                        selectedInvoices.size > 0 && `${selectedInvoices.size} invoices`,
                                                        selectedRequisitions.size > 0 && `${selectedRequisitions.size} requisitions`,
                                                        selectedBudgets.size > 0 && `${selectedBudgets.size} budgets`
                                                    ].filter(Boolean).join(', ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setSelectedExpenses(new Set());
                                                setSelectedInvoices(new Set());
                                                setSelectedRequisitions(new Set());
                                                setSelectedBudgets(new Set());
                                            }}
                                            className="px-3 py-1.5 text-[10px] font-bold text-white/40 hover:text-white transition-colors"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={handleCreateBatch}
                                            disabled={isProcessing}
                                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                                        >
                                            {isProcessing ? <PiClock className="animate-spin" /> : <PiHandCoins className="text-base" />}
                                            Create batch
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                {expenses.length === 0 && invoices.length === 0 && requisitions.length === 0 && budgets.length === 0 ? (
                                    <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-200">
                                        <PiCheckCircle className="text-5xl text-emerald-500 mx-auto mb-4" />
                                        <p className="font-bold text-gray-900 mb-1">All Caught Up!</p>
                                        <p className="text-sm text-gray-500">No pending items to pay.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Requisitions Section */}
                                        {requisitions.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 px-1">
                                                    <PiFileText className="text-gray-400" />
                                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Purchase Requisitions ({requisitions.length})</h3>
                                                </div>
                                                {requisitions.map(req => (
                                                    <div
                                                        key={req.id}
                                                        className={cn(
                                                            "p-4 bg-white border rounded-xl flex items-center gap-4 cursor-pointer hover:border-indigo-300 transition-all",
                                                            selectedRequisitions.has(req.id) ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200"
                                                        )}
                                                        onClick={() => toggleRequisition(req.id)}
                                                    >
                                                        <div className={cn(
                                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                                            selectedRequisitions.has(req.id)
                                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                                : "border-gray-300"
                                                        )}>
                                                            {selectedRequisitions.has(req.id) && <PiCheckCircle className="text-sm" />}
                                                        </div>
                                                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                            <PiFileText className="text-xl text-amber-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{req.title}</p>
                                                            <p className="text-xs text-gray-500 font-medium">{req.user.name} • {req.category}</p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-lg font-bold text-gray-900">${req.amount.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Budgets Section */}
                                        {budgets.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 px-1">
                                                    <PiHandCoins className="text-gray-400" />
                                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monthly Budgets ({budgets.length})</h3>
                                                </div>
                                                {budgets.map(bud => (
                                                    <div
                                                        key={bud.id}
                                                        className={cn(
                                                            "p-4 bg-white border rounded-xl flex items-center gap-4 cursor-pointer hover:border-indigo-300 transition-all",
                                                            selectedBudgets.has(bud.id) ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200"
                                                        )}
                                                        onClick={() => toggleBudget(bud.id)}
                                                    >
                                                        <div className={cn(
                                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                                            selectedBudgets.has(bud.id)
                                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                                : "border-gray-300"
                                                        )}>
                                                            {selectedBudgets.has(bud.id) && <PiCheckCircle className="text-sm" />}
                                                        </div>
                                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                            <PiHandCoins className="text-xl text-indigo-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate">Budget: {bud.month}/{bud.year}</p>
                                                            <p className="text-xs text-gray-500 font-medium">{bud.branch} • {bud.department}</p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-lg font-bold text-gray-900">${bud.totalAmount.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Invoices Section */}
                                        {invoices.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 px-1">
                                                    <PiBuildings className="text-gray-400" />
                                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor Invoices ({invoices.length})</h3>
                                                </div>
                                                {invoices.map(invoice => (
                                                    <div
                                                        key={invoice.id}
                                                        className={cn(
                                                            "p-4 bg-white border rounded-xl flex items-center gap-4 cursor-pointer hover:border-indigo-300 transition-all",
                                                            selectedInvoices.has(invoice.id) ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200"
                                                        )}
                                                        onClick={() => toggleInvoice(invoice.id)}
                                                    >
                                                        <div className={cn(
                                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                                            selectedInvoices.has(invoice.id)
                                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                                : "border-gray-300"
                                                        )}>
                                                            {selectedInvoices.has(invoice.id) && <PiCheckCircle className="text-sm" />}
                                                        </div>
                                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                            <PiBuildings className="text-xl text-purple-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{invoice.vendor.name}</p>
                                                            <p className="text-xs text-gray-500 font-medium">Inv: {invoice.invoiceNumber} • Due: {formatDate(invoice.dueDate)}</p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-lg font-bold text-gray-900">${invoice.amount.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Expenses Section */}
                                        {expenses.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 px-1">
                                                    <PiUser className="text-gray-400" />
                                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Reimbursements ({expenses.length})</h3>
                                                </div>
                                                {expenses.map(expense => (
                                                    <div
                                                        key={expense.id}
                                                        className={cn(
                                                            "p-4 bg-white border rounded-xl flex items-center gap-4 cursor-pointer hover:border-indigo-300 transition-all",
                                                            selectedExpenses.has(expense.id) ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200"
                                                        )}
                                                        onClick={() => toggleExpense(expense.id)}
                                                    >
                                                        <div className={cn(
                                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                                            selectedExpenses.has(expense.id)
                                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                                : "border-gray-300"
                                                        )}>
                                                            {selectedExpenses.has(expense.id) && <PiCheckCircle className="text-sm" />}
                                                        </div>
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <PiUser className="text-xl text-blue-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{expense.title}</p>
                                                            <p className="text-xs text-gray-500 font-medium">{expense.user.name} • {formatDate(expense.updatedAt)}</p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-lg font-bold text-gray-900">${expense.amount.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: APPROVALS */}
                    {activeTab === 'approvals' && (
                        <div className="animate-fade-in">
                            {pendingPayments.length === 0 ? (
                                <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-200">
                                    <PiCheckCircle className="text-5xl text-emerald-500 mx-auto mb-4" />
                                    <p className="font-bold text-gray-900 mb-1">No Payments Pending Authorization</p>
                                    <p className="text-sm text-gray-500">You're all set.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {pendingPayments.map(batch => (
                                        <div key={batch.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                                            {/* Header */}
                                            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex items-center justify-center">
                                                        <img src="/pos-terminal (2).png" alt="POS" className="w-10 h-10 object-contain" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900">Payment Batch</h3>
                                                        <p className="text-xs text-gray-500">{batch.maker.name}</p>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                                                    Pending
                                                </span>
                                            </div>

                                            {/* Body */}
                                            <div className="px-4 py-4 flex-1">
                                                <div className="mb-3">
                                                    <p className="text-2xl font-heading font-bold text-gray-900">
                                                        ${batch.amount.toFixed(2)}
                                                    </p>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <p className="text-xs text-gray-500 flex flex-wrap gap-x-2">
                                                        <span className="font-medium text-gray-700">{batch._count?.invoices || 0}</span> invoices,
                                                        <span className="font-medium text-gray-700">{batch._count?.expenses || 0}</span> expenses,
                                                        <span className="font-medium text-gray-700">{batch._count?.requisitions || 0}</span> requisitions,
                                                        <span className="font-medium text-gray-700">{batch._count?.monthlyBudgets || 0}</span> budgets
                                                    </p>
                                                    <p className="text-xs text-gray-500">{formatDate(batch.createdAt)}</p>
                                                    {batch.notes && (
                                                        <p className="text-xs text-gray-600 line-clamp-2 mt-2">"{batch.notes}"</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="px-4 py-3 border-t border-gray-200 mt-auto">
                                                <Link
                                                    href={`/receipt-studio?paymentId=${batch.id}`}
                                                    className="w-full py-2 mb-3 rounded-md text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <PiReceipt className="text-sm" />
                                                    Generate Voucher
                                                </Link>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => handleAuthorization(batch.id, 'REJECT')}
                                                        disabled={isProcessing}
                                                        className="py-2 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleAuthorization(batch.id, 'AUTHORIZE')}
                                                        disabled={isProcessing}
                                                        className="py-2 rounded-md text-xs font-medium text-white bg-cyan-500 hover:bg-cyan-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                    >
                                                        <PiCheckCircle className="text-sm" />
                                                        Approve
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: DISBURSEMENTS */}
                    {activeTab === 'disbursements' && (
                        <div className="animate-fade-in">
                            {authorizedPayments.length === 0 ? (
                                <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-200">
                                    <PiHandCoins className="text-5xl text-blue-500 mx-auto mb-4" />
                                    <p className="font-bold text-gray-900 mb-1">No Payments Ready for Payout</p>
                                    <p className="text-sm text-gray-500">All authorized batches have been processed.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {authorizedPayments.map(batch => (
                                        <div key={batch.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
                                            {/* Header */}
                                            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex items-center justify-center">
                                                        <img src="/pos-terminal (2).png" alt="POS" className="w-10 h-10 object-contain" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900">Authorized Batch</h3>
                                                        <p className="text-xs text-gray-500">{batch.maker.name}</p>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                                                    Authorized
                                                </span>
                                            </div>

                                            {/* Body */}
                                            <div className="px-4 py-4 flex-1">
                                                <div className="mb-3">
                                                    <p className="text-2xl font-heading font-bold text-gray-900">
                                                        ${batch.amount.toFixed(2)}
                                                    </p>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <p className="text-xs text-gray-500 flex flex-wrap gap-x-2">
                                                        <span className="font-medium text-gray-700">{batch._count?.invoices || 0}</span> invoices,
                                                        <span className="font-medium text-gray-700">{batch._count?.expenses || 0}</span> expenses,
                                                        <span className="font-medium text-gray-700">{batch._count?.requisitions || 0}</span> requisitions,
                                                        <span className="font-medium text-gray-700">{batch._count?.monthlyBudgets || 0}</span> budgets
                                                    </p>
                                                    <p className="text-xs text-gray-500">{formatDate(batch.createdAt)}</p>
                                                    {batch.notes && (
                                                        <p className="text-xs text-gray-600 line-clamp-2 mt-2">"{batch.notes}"</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="px-4 py-3 border-t border-gray-200 mt-auto space-y-2">
                                                <Link
                                                    href={`/receipt-studio?paymentId=${batch.id}`}
                                                    className="w-full py-2 rounded-md text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <PiReceipt className="text-sm" />
                                                    Generate Voucher
                                                </Link>
                                                <button
                                                    onClick={() => handleAuthorization(batch.id, 'DISBURSE')}
                                                    disabled={isProcessing}
                                                    className="w-full py-2.5 rounded-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <PiHandCoins className="text-sm" />
                                                    Confirm Disbursement
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: HISTORY */}
                    {activeTab === 'history' && (
                        <div className="animate-fade-in space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide px-1">Transaction History</h3>
                                <div className="text-xs text-gray-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                    Total Records: {history.length}
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initiator</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Approver</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Date</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {history.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-16 text-center">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <PiClock className="text-2xl text-gray-300" />
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-900">No transaction history found</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                currentHistory.map((item: any) => (
                                                    <tr key={item.id} className="group hover:bg-gray-50/80 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100 uppercase">
                                                                    {(item.maker?.name || 'U').charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900">{item.maker?.name || 'Unknown'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-medium text-gray-700">{item.checker?.name || 'Pending'}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={cn(
                                                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                                                item.status === 'COMPLETED' || item.status === 'PAID' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                    item.status === 'REJECTED' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                                        "bg-amber-50 text-amber-600 border-amber-100"
                                                            )}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <p className="text-sm font-bold text-gray-900 font-mono">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <p className="text-xs font-medium text-gray-500">{formatDate(item.createdAt)}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Link
                                                                href={`/receipt-studio?paymentId=${item.id}`}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                                                            >
                                                                <PiArrowRight className="text-sm" />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                        {totalPages > 1 && (
                                            <tfoot className="border-t border-gray-100">
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-4 bg-gray-50/30">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs text-gray-500 font-medium">Page {currentPage} of {totalPages}</p>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                                    disabled={currentPage === 1}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:border-indigo-300 disabled:opacity-50"
                                                                >
                                                                    <PiCaretLeft />
                                                                </button>
                                                                <button
                                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                                    disabled={currentPage === totalPages}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:border-indigo-300 disabled:opacity-50"
                                                                >
                                                                    <PiCaretRight />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            {/* Custom Confirmation Modal */}
            {mounted && confirmationModal && confirmationModal.isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in relative z-[10000]">
                        <div className="p-6 text-center">
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                                confirmationModal.action === 'AUTHORIZE' ? "bg-cyan-50" :
                                    confirmationModal.action === 'DISBURSE' ? "bg-indigo-50" : "bg-rose-50"
                            )}>
                                {confirmationModal.action === 'AUTHORIZE' ? (
                                    <PiCheckCircle className="text-3xl text-cyan-500" />
                                ) : confirmationModal.action === 'DISBURSE' ? (
                                    <PiHandCoins className="text-3xl text-indigo-500" />
                                ) : (
                                    <PiWarningCircle className="text-3xl text-rose-500" />
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {confirmationModal.action === 'AUTHORIZE' ? 'Approve Payment?' :
                                    confirmationModal.action === 'DISBURSE' ? 'Disburse Payment?' : 'Reject Payment?'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to {
                                    confirmationModal.action === 'DISBURSE' ? 'confirm the payout for' : confirmationModal.action.toLowerCase()
                                } this payment batch?
                                {(confirmationModal.action === 'AUTHORIZE' || confirmationModal.action === 'DISBURSE') && " This action cannot be undone."}
                            </p>


                            {confirmationModal.action === 'DISBURSE' && (
                                <>
                                    <div className="mb-4 text-left">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                                            Payment Method *
                                        </label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value as 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CASH')}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                            <option value="MOBILE_MONEY">Mobile Money</option>
                                            <option value="CASH">Cash</option>
                                        </select>
                                    </div>

                                    <div className="mb-6 text-left">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                                            Proof of Payment (Optional)
                                        </label>
                                        <input
                                            type="file"
                                            onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                            className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-gray-200 rounded-lg"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Upload receipt or transfer confirmation (PDF/IMG)</p>
                                    </div>
                                </>
                            )}


                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setConfirmationModal(null)}
                                    className="py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={proceedAuthorization}
                                    disabled={isProcessing}
                                    className={cn(
                                        "py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2",
                                        confirmationModal.action === 'AUTHORIZE' ? "bg-cyan-500 hover:bg-cyan-600" :
                                            confirmationModal.action === 'DISBURSE' ? "bg-indigo-600 hover:bg-indigo-700" : "bg-rose-500 hover:bg-rose-600"
                                    )}
                                >
                                    {isProcessing ? (
                                        <span>Processing...</span>
                                    ) : (
                                        <>
                                            {confirmationModal.action === 'AUTHORIZE' ? 'Approve' :
                                                confirmationModal.action === 'DISBURSE' ? 'Confirm Payout' : 'Reject'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
