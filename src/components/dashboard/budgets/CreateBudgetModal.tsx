"use client";

import { useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
    PiX,
    PiCheckCircle,
    PiCurrencyDollar,
    PiCalendarBlank,
    PiTag,
    PiTrendUp,
    PiWarningCircle
} from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

interface CreateBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateBudgetModal({ isOpen, onClose, onSuccess }: CreateBudgetModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [frequency, setFrequency] = useState<"MONTHLY" | "WEEKLY">("MONTHLY");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [alertThreshold, setAlertThreshold] = useState("80");
    const [rollover, setRollover] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            onSuccess?.();
            onClose();
        }, 1000);
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-gray-900/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="h-[88px] px-6 bg-white border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 flex items-center justify-center bg-indigo-50 rounded-full shrink-0">
                                <Image src="/accounting.png" alt="Budget Icon" width={36} height={36} className="object-contain" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">New Budget Rule</h2>
                                <p className="text-xs text-gray-500">Set spending limits and alerts</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <PiX className="text-lg" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gray-50/50">

                        {/* Frequency Toggle */}
                        <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                            <button
                                type="button"
                                onClick={() => setFrequency("MONTHLY")}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${frequency === "MONTHLY"
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "text-gray-500 hover:bg-gray-50"
                                    }`}
                            >
                                Monthly Budget
                            </button>
                            <button
                                type="button"
                                onClick={() => setFrequency("WEEKLY")}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${frequency === "WEEKLY"
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "text-gray-500 hover:bg-gray-50"
                                    }`}
                            >
                                Weekly Budget
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                    Expense Category
                                </label>
                                <div className="relative">
                                    <PiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        required
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-all cursor-pointer"
                                    >
                                        <option value="">Select Category...</option>
                                        {EXPENSE_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                    Budget Limit
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            {/* Alert Threshold */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Alert Threshold
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                        {alertThreshold}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    step="5"
                                    value={alertThreshold}
                                    onChange={(e) => setAlertThreshold(e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                    <PiWarningCircle />
                                    Receive notification when spending reaches {alertThreshold}% of budget
                                </p>
                            </div>

                            {/* Rollover Toggle */}
                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                                <div className={`p-2 rounded-lg ${rollover ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <PiTrendUp className="text-lg" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold text-gray-900">Rollover Unused Funds</h4>
                                    <p className="text-[10px] text-gray-500">Remaining budget carries over to next period</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={rollover}
                                    onChange={(e) => setRollover(e.target.checked)}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !category || !amount}
                                className="flex-[2] px-4 py-2.5 bg-[#29258D] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#29258D]/90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>Saving...</>
                                ) : (
                                    <>
                                        <PiCheckCircle className="text-lg" />
                                        Create Budget
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
