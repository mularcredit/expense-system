"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PiX, PiWallet, PiBank, PiUser } from "react-icons/pi";

interface SalaryDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    expense: {
        id: string;
        title: string;
        amount: number;
        description: string;
        status: string;
        createdAt: string | Date;
    } | null;
}

interface SalaryRow {
    name: string;
    bank: string;
    account: string;
    amount: string;
}

export function SalaryDetailsModal({ isOpen, onClose, expense }: SalaryDetailsModalProps) {
    if (!isOpen || !expense) return null;

    // Parse the description to extract the table rows
    const parseSalaryData = (text: string): SalaryRow[] => {
        if (!text) return [];
        const lines = text.split('\n');
        const rows: SalaryRow[] = [];
        let isTableStarted = false;

        for (const line of lines) {
            if (line.trim().startsWith('| Name |')) {
                isTableStarted = true;
                continue;
            }
            if (!isTableStarted) continue;
            if (line.trim().startsWith('|---|')) continue;
            if (!line.trim().startsWith('|')) continue;

            // Split by '|' and trim whitespace
            const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
            if (parts.length >= 4) {
                rows.push({
                    name: parts[0],
                    bank: parts[1],
                    account: parts[2],
                    amount: parts[3]
                });
            }
        }
        return rows;
    };

    const salaryRows = parseSalaryData(expense.description || "");
    const hasTableData = salaryRows.length > 0;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <PiWallet className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{expense.title}</h3>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                        Total: ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} • {salaryRows.length} Payees
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <PiX className="text-lg" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            {hasTableData ? (
                                <div className="min-w-full inline-block align-middle">
                                    <div className="border-b border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        Employee Name
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        Bank Details
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        Account Number
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {salaryRows.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors group">
                                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
                                                                {row.name.charAt(0)}
                                                            </div>
                                                            {row.name}
                                                        </td>
                                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500 font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <PiBank className="text-gray-400" />
                                                                {row.bank}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500 font-mono tracking-wide">
                                                            {row.account}
                                                        </td>
                                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 font-bold text-right tabular-nums">
                                                            {row.amount}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 border-t border-gray-200">
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Total</td>
                                                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900 tabular-nums">
                                                        ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <p className="text-sm">No detailed breakdown available for this expense.</p>
                                    <pre className="mt-4 text-xs bg-gray-50 p-4 rounded text-left overflow-auto max-h-60 border border-gray-200">
                                        {expense.description}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
