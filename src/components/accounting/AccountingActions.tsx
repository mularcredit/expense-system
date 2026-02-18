
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PiPlus, PiX, PiCheckCircle, PiBookOpenText, PiSpinner, PiBank, PiNotebook, PiTrash } from "react-icons/pi";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AccountingActionsProps {
    type: "NEW_ACCOUNT" | "MANUAL_JOURNAL" | "DELETE_ENTRY";
    entryId?: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
}

interface JournalLine {
    id: number;
    accountId: string;
    debit: number;
    credit: number;
}

export function AccountingActions({ type, entryId }: AccountingActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch Chart of Accounts
    useEffect(() => {
        if (isOpen && type === "MANUAL_JOURNAL") {
            fetchAccounts();
        }
    }, [isOpen, type]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch("/api/accounting/accounts");
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
        }
    };

    // ACCOUNT FORM STATE
    const [accountData, setAccountData] = useState({
        code: "",
        name: "",
        type: "EXPENSE",
        subtype: "OPERATING_EXPENSE",
        description: ""
    });

    // JOURNAL FORM STATE
    const [journalData, setJournalData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: "",
        reference: "",
        lines: [
            { id: 1, accountId: "", debit: 0, credit: 0 },
            { id: 2, accountId: "", debit: 0, credit: 0 }
        ] as JournalLine[]
    });

    const addLine = () => {
        const newId = Math.max(...journalData.lines.map(l => l.id), 0) + 1;
        setJournalData(prev => ({
            ...prev,
            lines: [...prev.lines, { id: newId, accountId: "", debit: 0, credit: 0 }]
        }));
    };

    const removeLine = (id: number) => {
        if (journalData.lines.length <= 2) {
            showToast("You must have at least 2 lines", "error");
            return;
        }
        setJournalData(prev => ({
            ...prev,
            lines: prev.lines.filter(l => l.id !== id)
        }));
    };

    const updateLine = (id: number, field: keyof JournalLine, value: any) => {
        setJournalData(prev => ({
            ...prev,
            lines: prev.lines.map(l =>
                l.id === id ? { ...l, [field]: value } : l
            )
        }));
    };

    const getTotals = () => {
        const totalDebit = journalData.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
        const totalCredit = journalData.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
        const difference = totalDebit - totalCredit;
        return { totalDebit, totalCredit, difference, isBalanced: Math.abs(difference) < 0.01 };
    };

    const handleCreateAccount = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/accounting/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(accountData)
            });
            if (!res.ok) throw new Error("Failed to create account");
            showToast("Account created successfully", "success");
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            showToast("Error creating account", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateJournal = async () => {
        setIsSubmitting(true);
        const { isBalanced, totalDebit, totalCredit } = getTotals();
        if (!isBalanced) {
            showToast(`Entry not balanced! Debits: $${totalDebit.toFixed(2)}, Credits: $${totalCredit.toFixed(2)}`, "error");
            setIsSubmitting(false);
            return;
        }
        try {
            const res = await fetch("/api/accounting/journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(journalData)
            });
            if (!res.ok) throw new Error("Failed to post journal entry");
            showToast("Journal entry posted successfully", "success");
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            showToast("Error posting journal", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEntry = async () => {
        if (!entryId) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/accounting/journal?id=${entryId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete entry");
            showToast("Journal entry deleted successfully", "success");
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            showToast("Error deleting journal entry", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totals = getTotals();

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-white/60 backdrop-blur-xl"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                            "relative bg-white border border-gray-200 w-full rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col",
                            type === "DELETE_ENTRY" ? "max-w-md" : "max-w-4xl"
                        )}
                    >
                        {/* Header */}
                        <div className={cn(
                            "px-8 flex justify-between items-center bg-white border-b border-gray-100 shrink-0",
                            type === "DELETE_ENTRY" ? "h-16" : "h-[88px]"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-3 rounded-xl",
                                    type === "DELETE_ENTRY" ? "bg-red-50 text-red-600 p-2" : "bg-[#F6F6F6] text-[#29258D]"
                                )}>
                                    {type === "NEW_ACCOUNT" ? <PiBank className="text-2xl" /> : type === "MANUAL_JOURNAL" ? <PiNotebook className="text-2xl" /> : <PiTrash className="text-xl" />}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-0.5">
                                        {type === "NEW_ACCOUNT" ? "Create New Account" : type === "MANUAL_JOURNAL" ? "Post Journal Entry" : "Delete Journal Entry"}
                                    </h3>
                                    {type !== "DELETE_ENTRY" && (
                                        <p className="text-gray-500 text-xs font-medium">
                                            {type === "NEW_ACCOUNT" ? "Add a new GL code" : "Record double-entry transaction"}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-900 h-10 w-10">
                                <PiX className="text-xl" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className={cn(
                            "flex-1 overflow-y-auto custom-scrollbar bg-[#F6F6F6] space-y-6",
                            type === "DELETE_ENTRY" ? "p-6" : "p-8"
                        )}>
                            {type === "NEW_ACCOUNT" ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Account Code</label>
                                        <Input
                                            type="text"
                                            className="bg-white border-gray-200 h-11 font-mono"
                                            value={accountData.code}
                                            onChange={(e) => setAccountData(prev => ({ ...prev, code: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Account Name</label>
                                        <Input
                                            type="text"
                                            className="bg-white border-gray-200 h-11"
                                            value={accountData.name}
                                            onChange={(e) => setAccountData(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Type</label>
                                        <select
                                            className="w-full px-4 h-11 bg-white border border-gray-200 rounded-xl outline-none text-sm font-medium"
                                            value={accountData.type}
                                            onChange={(e) => setAccountData(prev => ({ ...prev, type: e.target.value }))}
                                        >
                                            <option value="ASSET">Asset</option>
                                            <option value="LIABILITY">Liability</option>
                                            <option value="EQUITY">Equity</option>
                                            <option value="REVENUE">Revenue</option>
                                            <option value="EXPENSE">Expense</option>
                                        </select>
                                    </div>
                                </div>
                            ) : type === "MANUAL_JOURNAL" ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input type="date" value={journalData.date} onChange={e => setJournalData(p => ({ ...p, date: e.target.value }))} />
                                        <Input placeholder="Reference" value={journalData.reference} onChange={e => setJournalData(p => ({ ...p, reference: e.target.value }))} />
                                        <Input placeholder="Description" value={journalData.description} onChange={e => setJournalData(p => ({ ...p, description: e.target.value }))} />
                                    </div>
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        {journalData.lines.map(line => (
                                            <div key={line.id} className="p-4 grid grid-cols-12 gap-3 border-b border-gray-100 last:border-0">
                                                <div className="col-span-6">
                                                    <select className="w-full h-10 bg-white border border-gray-200 rounded-lg text-sm" value={line.accountId} onChange={e => updateLine(line.id, 'accountId', e.target.value)}>
                                                        <option value="">Select account...</option>
                                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-span-2"><Input type="number" placeholder="Debit" value={line.debit || ''} onChange={e => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)} /></div>
                                                <div className="col-span-2"><Input type="number" placeholder="Credit" value={line.credit || ''} onChange={e => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)} /></div>
                                                <div className="col-span-2 flex justify-end">
                                                    {journalData.lines.length > 2 && <Button size="icon" variant="ghost" className="text-red-500" onClick={() => removeLine(line.id)}><PiTrash /></Button>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-2 text-center">
                                    <h3 className="text-lg font-bold">Confirm Deletion</h3>
                                    <p className="text-gray-500 text-sm mt-1 px-4">This will permanently remove this journal entry from the ledger.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className={cn(
                            "px-8 bg-white border-t border-gray-100 flex items-center justify-end gap-3 shrink-0",
                            type === "DELETE_ENTRY" ? "h-16" : "h-[88px]"
                        )}>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            {type === "DELETE_ENTRY" ? (
                                <Button onClick={handleDeleteEntry} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                                    {isSubmitting ? "Deleting..." : "Confirm Delete"}
                                </Button>
                            ) : (
                                <Button onClick={type === "NEW_ACCOUNT" ? handleCreateAccount : handleCreateJournal} disabled={isSubmitting} className="bg-[#29258D] text-white font-bold">
                                    {isSubmitting ? "Processing..." : "Submit"}
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {type === "NEW_ACCOUNT" ? (
                <Button onClick={() => setIsOpen(true)} className="bg-[#29258D] text-white">
                    <PiPlus className="mr-2" /> New Account
                </Button>
            ) : type === "MANUAL_JOURNAL" ? (
                <Button onClick={() => setIsOpen(true)} className="bg-[#29258D] text-white">
                    <PiBookOpenText className="mr-2" /> Manual Journal
                </Button>
            ) : (
                <Button onClick={() => setIsOpen(true)} variant="ghost" size="icon" className="text-gray-400 hover:text-red-600">
                    <PiTrash />
                </Button>
            )}
            {mounted && createPortal(modalContent, document.body)}
        </>
    );
}
