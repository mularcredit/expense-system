"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import {
    PiCheckCircle,
    PiXCircle,
    PiClock,
    PiUser,
    PiCalendar,
    PiMoney,
    PiReceipt,
    PiFileText,
    PiBuildings,
    PiEye,
    PiX,
    PiUserSwitch,
    PiPlus
} from "react-icons/pi";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { DelegateModal } from "@/components/workflow/DelegationEscalation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";

interface User {
    name: string | null;
    email: string | null;
    department: string | null;
}

interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    merchant: string | null;
    expenseDate: Date;
    createdAt: Date;
    receiptUrl: string | null;
    user: User;
}

interface Requisition {
    id: string;
    title: string;
    amount: number;
    category: string;
    businessJustification: string | null;
    createdAt: Date;
    user: User;
}

interface MonthlyBudget {
    id: string;
    month: number;
    year: number;
    branch: string;
    department: string;
    totalAmount: number;
    createdAt: Date;
    user: User;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    vendor: { name: string };
    amount: number;
    currency: string;
    dueDate: Date;
    invoiceDate: Date;
    status: string;
    createdAt: Date;
    fileUrl: string | null;
    createdBy: User;
}

interface Approval {
    id: string;
    status: string;
    comments: string | null;
    createdAt: Date;
    expense: (Expense & { user: { name: string | null } }) | null;
    requisition: (Requisition & { user: { name: string | null } }) | null;
    monthlyBudget: (MonthlyBudget & { user: { name: string | null } }) | null;
    invoice: (Invoice & { createdBy: { name: string | null } }) | null;
}

interface ApprovalQueueProps {
    expenses: Expense[];
    requisitions: Requisition[];
    budgets: MonthlyBudget[];
    invoices: Invoice[];
    history: Approval[];
}

export function ApprovalQueue({ expenses, requisitions, budgets = [], invoices = [], history }: ApprovalQueueProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'expenses' | 'requisitions' | 'budgets' | 'invoices' | 'history'>('expenses');
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [comments, setComments] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState<string | null>(null);
    const [delegateData, setDelegateData] = useState<{ id: string; title: string } | null>(null);

    // Reset selection when tab changes to avoid state ghosting
    useEffect(() => {
        setSelectedItem(null);
        setComments("");
    }, [activeTab]);

    // Automatically switch to first tab with items
    useEffect(() => {
        if (expenses.length > 0) setActiveTab('expenses');
        else if (requisitions.length > 0) setActiveTab('requisitions');
        else if (budgets.length > 0) setActiveTab('budgets');
        else if (invoices.length > 0) setActiveTab('invoices');
    }, []); // Only on mount

    const handleApproval = async (approvalId: string, action: 'APPROVE' | 'REJECT') => {
        setIsProcessing(true);

        try {
            const response = await fetch(`/api/approvals/${approvalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                    comments: comments || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process approval');
            }

            showToast(
                data.message || `Successfully ${action.toLowerCase()}ed`,
                action === 'APPROVE' ? 'success' : 'info'
            );

            // Reset and refresh
            setSelectedItem(null);
            setComments("");
            router.refresh();

        } catch (error: any) {
            showToast(error.message || 'Failed to process approval', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {[
                    { id: 'expenses', label: 'Expenses', icon: PiReceipt, count: expenses.length },
                    { id: 'requisitions', label: 'Requisitions', icon: PiFileText, count: requisitions.length },
                    { id: 'budgets', label: 'Budgets', icon: PiCalendar, count: budgets.length },
                    { id: 'invoices', label: 'Invoices', icon: PiReceipt, count: invoices.length },
                    { id: 'history', label: 'History', icon: PiClock }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-md font-bold text-xs transition-all flex items-center justify-center gap-2",
                            activeTab === tab.id
                                ? 'bg-white text-[#29258D] shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                        )}
                    >
                        <tab.icon className="text-sm" />
                        <span>{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[10px]",
                                activeTab === tab.id ? "bg-indigo-50 text-[#29258D]" : "bg-gray-200 text-gray-600"
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expenses.length === 0 ? (
                        <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border border-gray-200">
                            <PiReceipt className="text-5xl text-gray-400 mx-auto mb-4" />
                            <p className="font-bold text-gray-900 mb-1">No pending expense approvals</p>
                            <p className="text-sm text-gray-500">All caught up! 🎉</p>
                        </div>
                    ) : (
                        expenses.map(expense => (
                            <div key={expense.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center justify-center">
                                            <img src="/checked.png" alt="Approval" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{expense.category}</h3>
                                            <p className="text-xs text-gray-500">{expense.user.name || 'Unknown'}</p>
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
                                            {formatCurrency(expense.amount)}
                                        </p>
                                        <h4 className="text-xs font-medium text-gray-500 mt-1 line-clamp-1" title={expense.title}>{expense.title}</h4>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <PiBuildings className="text-gray-400" />
                                            {expense.user.department || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <PiCalendar className="text-gray-400" />
                                            {formatDate(expense.expenseDate)}
                                        </p>
                                        {expense.merchant && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <span className="font-semibold text-gray-600">Merchant:</span> {expense.merchant}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Footer / Actions */}
                                <div className="px-4 py-3 border-t border-gray-200 mt-auto bg-gray-50/30">
                                    {selectedItem === expense.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={comments}
                                                onChange={(e) => setComments(e.target.value)}
                                                placeholder="Add review notes..."
                                                rows={2}
                                                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#29258D]"
                                                autoFocus
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => handleApproval((expense as any).approvalId, 'APPROVE')}
                                                    disabled={isProcessing}
                                                    className="py-2 bg-[#29258D] text-white text-xs font-bold rounded-md hover:bg-[#29258D]/90 transition-all flex items-center justify-center gap-1"
                                                >
                                                    <PiCheckCircle /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleApproval((expense as any).approvalId, 'REJECT')}
                                                    disabled={isProcessing}
                                                    className="py-2 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-md hover:bg-rose-50 transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedItem(null); setComments(""); }}
                                                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1"
                                            >
                                                Cancel Review
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {expense.receiptUrl && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShowReceipt(expense.receiptUrl); }}
                                                    className="w-full py-1.5 text-xs font-bold text-[#29258D] hover:bg-indigo-50 rounded-md transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <PiEye /> View Receipt
                                                </button>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedItem(expense.id)}
                                                    className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    Review
                                                </button>
                                                <button
                                                    onClick={() => setDelegateData({ id: (expense as any).approvalId, title: expense.title })}
                                                    className="px-3 py-2 bg-white border border-gray-200 text-gray-400 hover:text-[#29258D] rounded-md transition-colors"
                                                    title="Delegate"
                                                >
                                                    <PiUserSwitch className="text-lg" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Requisitions Tab */}
            {activeTab === 'requisitions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requisitions.length === 0 ? (
                        <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border border-gray-200">
                            <PiFileText className="text-5xl text-gray-400 mx-auto mb-4" />
                            <p className="font-bold text-gray-900 mb-1">No pending requisition approvals</p>
                            <p className="text-sm text-gray-500">All caught up! 🎉</p>
                        </div>
                    ) : (
                        requisitions.map(req => (
                            <div key={req.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center justify-center">
                                            <img src="/checked.png" alt="Approval" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{req.category}</h3>
                                            <p className="text-xs text-gray-500">{req.user.name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                                        Pending
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="px-4 py-4 flex-1">
                                    <div className="mb-3">
                                        <p className="text-2xl font-heading font-bold text-gray-900">
                                            {formatCurrency(req.amount)}
                                        </p>
                                        <h4 className="text-xs font-medium text-gray-500 mt-1 line-clamp-1" title={req.title}>{req.title}</h4>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <PiCalendar className="text-gray-400" />
                                            {formatDate(req.createdAt)}
                                        </p>
                                        {req.businessJustification && (
                                            <p className="text-xs text-gray-500 italic mt-2 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-2">
                                                "{req.businessJustification}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-3 border-t border-gray-200 mt-auto bg-gray-50/30">
                                    {selectedItem === req.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={comments}
                                                onChange={(e) => setComments(e.target.value)}
                                                placeholder="Add review notes..."
                                                rows={2}
                                                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#29258D]"
                                                autoFocus
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => handleApproval((req as any).approvalId, 'APPROVE')}
                                                    disabled={isProcessing}
                                                    className="py-2 bg-[#29258D] text-white text-xs font-bold rounded-md hover:bg-[#29258D]/90 transition-all flex items-center justify-center gap-1"
                                                >
                                                    <PiCheckCircle /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleApproval((req as any).approvalId, 'REJECT')}
                                                    disabled={isProcessing}
                                                    className="py-2 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-md hover:bg-rose-50 transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedItem(null); setComments(""); }}
                                                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1"
                                            >
                                                Cancel Review
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedItem(req.id)}
                                                className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-md hover:bg-gray-50 transition-colors"
                                            >
                                                Review
                                            </button>
                                            <button
                                                onClick={() => setDelegateData({ id: (req as any).approvalId, title: req.title })}
                                                className="px-3 py-2 bg-white border border-gray-200 text-gray-400 hover:text-[#29258D] rounded-md transition-colors"
                                                title="Delegate"
                                            >
                                                <PiUserSwitch className="text-lg" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Budgets Tab */}
            {activeTab === 'budgets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgets.length === 0 ? (
                        <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border border-gray-200">
                            <PiCalendar className="text-5xl text-gray-400 mx-auto mb-4" />
                            <p className="font-bold text-gray-900 mb-1">No pending budget approvals</p>
                            <p className="text-sm text-gray-500">All caught up! 🎉</p>
                        </div>
                    ) : (
                        budgets.map(budget => {
                            const months = [
                                "January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"
                            ];
                            const title = `${months[budget.month - 1]} ${budget.year} Budget Plan`;

                            return (
                                <div key={budget.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                    {/* Header */}
                                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex items-center justify-center">
                                                <img src="/checked.png" alt="Approval" className="w-8 h-8 object-contain" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">MONTHLY PLAN</h3>
                                                <p className="text-xs text-gray-500">{budget.user.name || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium">
                                            Pending
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div className="px-4 py-4 flex-1">
                                        <div className="mb-3">
                                            <p className="text-2xl font-heading font-bold text-gray-900">
                                                {formatCurrency(budget.totalAmount)}
                                            </p>
                                            <h4 className="text-xs font-medium text-gray-500 mt-1 line-clamp-1" title={title}>{title}</h4>
                                        </div>

                                        <div className="space-y-1.5">
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <PiBuildings className="text-gray-400" />
                                                {budget.branch} • {budget.department}
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                <PiCalendar className="text-gray-400" />
                                                {formatDate(budget.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-4 py-3 border-t border-gray-200 mt-auto bg-gray-50/30">
                                        {selectedItem === budget.id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={comments}
                                                    onChange={(e) => setComments(e.target.value)}
                                                    placeholder="Add review notes..."
                                                    rows={2}
                                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#29258D]"
                                                    autoFocus
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => handleApproval((budget as any).approvalId, 'APPROVE')}
                                                        disabled={isProcessing}
                                                        className="py-2 bg-[#29258D] text-white text-xs font-bold rounded-md hover:bg-[#29258D]/90 transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <PiCheckCircle /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproval((budget as any).approvalId, 'REJECT')}
                                                        disabled={isProcessing}
                                                        className="py-2 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-md hover:bg-rose-50 transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => { setSelectedItem(null); setComments(""); }}
                                                    className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1"
                                                >
                                                    Cancel Review
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedItem(budget.id)}
                                                    className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    Review
                                                </button>
                                                <button
                                                    onClick={() => setDelegateData({ id: (budget as any).approvalId, title })}
                                                    className="px-3 py-2 bg-white border border-gray-200 text-gray-400 hover:text-[#29258D] rounded-md transition-colors"
                                                    title="Delegate"
                                                >
                                                    <PiUserSwitch className="text-lg" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {invoices.length === 0 ? (
                        <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border border-gray-200">
                            <PiBuildings className="text-5xl text-gray-400 mx-auto mb-4" />
                            <p className="font-bold text-gray-900 mb-1">No pending invoice approvals</p>
                            <p className="text-sm text-gray-500">All caught up! 🎉</p>
                        </div>
                    ) : (
                        invoices.map(invoice => (
                            <div key={invoice.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center justify-center">
                                            <img src="/checked.png" alt="Approval" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{invoice.status.replace(/_/g, ' ')}</h3>
                                            <p className="text-xs text-gray-500">{invoice.createdBy.name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
                                        Pending
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="px-4 py-4 flex-1">
                                    <div className="mb-3">
                                        <p className="text-2xl font-heading font-bold text-gray-900">
                                            {formatCurrency(invoice.amount)}
                                        </p>
                                        <h4 className="text-xs font-medium text-gray-500 mt-1 line-clamp-1" title={invoice.vendor.name}>{invoice.vendor.name}</h4>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <span className="font-semibold text-gray-600">Inv:</span> {invoice.invoiceNumber}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <PiCalendar className="text-gray-400" />
                                            Due: {formatDate(invoice.dueDate)}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-3 border-t border-gray-200 mt-auto bg-gray-50/30">
                                    {selectedItem === invoice.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={comments}
                                                onChange={(e) => setComments(e.target.value)}
                                                placeholder="Add review notes..."
                                                rows={2}
                                                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#29258D]"
                                                autoFocus
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => handleApproval((invoice as any).approvalId, 'APPROVE')}
                                                    disabled={isProcessing}
                                                    className="py-2 bg-[#29258D] text-white text-xs font-bold rounded-md hover:bg-[#29258D]/90 transition-all flex items-center justify-center gap-1"
                                                >
                                                    <PiCheckCircle /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleApproval((invoice as any).approvalId, 'REJECT')}
                                                    disabled={isProcessing}
                                                    className="py-2 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-md hover:bg-rose-50 transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedItem(null); setComments(""); }}
                                                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1"
                                            >
                                                Cancel Review
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {invoice.fileUrl && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.open(invoice.fileUrl!, '_blank'); }}
                                                    className="w-full py-1.5 text-xs font-bold text-[#29258D] hover:bg-indigo-50 rounded-md transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <PiEye /> View Invoice
                                                </button>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedItem(invoice.id)}
                                                    className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    Review
                                                </button>
                                                <button
                                                    onClick={() => setDelegateData({ id: (invoice as any).approvalId, title: invoice.vendor.name })}
                                                    className="px-3 py-2 bg-white border border-gray-200 text-gray-400 hover:text-[#29258D] rounded-md transition-colors"
                                                    title="Delegate"
                                                >
                                                    <PiUserSwitch className="text-lg" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <Card className="overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#29258D] rounded-full"></span>
                            Approval History
                        </CardTitle>
                    </CardHeader>
                    <div className="divide-y divide-gray-50">
                        {history.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 text-xs font-medium italic">
                                No history found
                            </div>
                        ) : (
                            history.map(approval => {
                                const months = [
                                    "January", "February", "March", "April", "May", "June",
                                    "July", "August", "September", "October", "November", "December"
                                ];

                                return (
                                    <div
                                        key={approval.id}
                                        className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900 text-xs">
                                                {approval.expense?.title ||
                                                    approval.requisition?.title ||
                                                    (approval.monthlyBudget && `${months[approval.monthlyBudget.month - 1]} ${approval.monthlyBudget.year} Budget Plan`) ||
                                                    (approval.invoice && `Invoice: ${approval.invoice.invoiceNumber}`) ||
                                                    'Deleted Item'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">
                                                {approval.expense ? 'Expense' : approval.requisition ? 'Requisition' : approval.monthlyBudget ? 'Monthly Budget' : 'Invoice'} • {formatDate(approval.createdAt)}
                                                {approval.comments && <span className="text-gray-900 ml-1 font-bold italic tracking-normal normal-case">• "{approval.comments}"</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {approval.expense?.receiptUrl && (
                                                <button
                                                    onClick={() => setShowReceipt(approval.expense!.receiptUrl)}
                                                    className="text-[10px] font-bold text-[#29258D] hover:underline flex items-center gap-1"
                                                >
                                                    <PiEye className="text-sm" />
                                                    View
                                                </button>
                                            )}
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-widest",
                                                approval.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                            )}>
                                                {approval.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>
            )}

            {/* Receipt Modal Overlay */}
            {showReceipt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <Card className="max-w-2xl w-full relative animate-scale-in overflow-hidden shadow-2xl bg-white">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <PiReceipt className="text-xl text-[#29258D]" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">Expense Evidence</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Document Registry • Verified</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowReceipt(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-gray-900"
                                >
                                    <PiX className="text-xl" />
                                </button>
                            </div>

                            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner">
                                <Image
                                    src={showReceipt}
                                    alt="Receipt Evidence"
                                    fill
                                    className="object-contain p-4"
                                    unoptimized
                                />
                            </div>

                            <div className="mt-6 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[70%]">
                                    REF: {showReceipt.split('/').pop()}
                                </p>
                                <button
                                    onClick={() => window.open(showReceipt, '_blank')}
                                    className="text-[10px] font-bold text-[#29258D] hover:underline uppercase tracking-widest"
                                >
                                    Open Original
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Delegation Modal */}
            {delegateData && (
                <DelegateModal
                    approvalId={delegateData.id}
                    itemTitle={delegateData.title}
                    onClose={() => setDelegateData(null)}
                    onSuccess={() => {
                        showToast("Approval delegated successfully", "success");
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
