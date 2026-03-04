"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
    PiX,
    PiPlus,
    PiTrash,
    PiCheckCircle,
    PiCaretDown,
    PiMagnifyingGlass,
    PiWarning
} from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/components/ui/ToastProvider";
import { updateMonthlyBudget } from "@/app/dashboard/requisitions/budget-actions";

interface EditBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    budget: any; // The existing budget record
}

export function EditBudgetModal({ isOpen, onClose, budget }: EditBudgetModalProps) {
    const { showToast } = useToast();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [month, setMonth] = useState(1);
    const [year, setYear] = useState(1);
    const [branch, setBranch] = useState("");
    const [department, setDepartment] = useState("");
    const [items, setItems] = useState([{ description: "", category: "Operations", amount: 0 }]);

    const [isMonthOpen, setIsMonthOpen] = useState(false);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
    const [categorySearch, setCategorySearch] = useState("");

    const [submitError, setSubmitError] = useState("");

    // Initialize state when modal opens or budget changes
    useEffect(() => {
        if (budget && isOpen) {
            setMonth(budget.month || new Date().getMonth() + 1);
            setYear(budget.year || new Date().getFullYear());
            setBranch(budget.branch || "");
            setDepartment(budget.department || "");

            if (budget.items && budget.items.length > 0) {
                setItems(budget.items.map((item: any) => ({
                    description: item.description || "",
                    category: item.category || "Operations",
                    amount: item.amount || 0
                })));
            } else {
                setItems([{ description: "", category: "Operations", amount: 0 }]);
            }
            setSubmitError("");
        }
    }, [budget, isOpen]);

    if (!isOpen || !budget) return null;

    const filteredCategories = EXPENSE_CATEGORIES.filter(c =>
        c.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const addItem = () => {
        setItems([...items, { description: "", category: "Operations", amount: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount as any) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        if (!branch || !department) {
            setSubmitError("Branch and Department are required");
            return;
        }

        if (items.some(item => !item.description || item.amount <= 0)) {
            setSubmitError("Please fill in all item details with valid amounts greater than 0");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await updateMonthlyBudget(budget.id, {
                month,
                year,
                branch,
                department,
                items: items.map(item => ({
                    ...item,
                    amount: parseFloat(item.amount as any)
                }))
            });

            if (result?.error) {
                setSubmitError(result.error);
            } else if (result?.success) {
                showToast("Budget plan updated successfully", "success");
                router.refresh(); // Refresh the list to reflect changes
                onClose();
            }
        } catch (e: any) {
            setSubmitError(e.message || "Failed to update budget requisition");
        } finally {
            setIsSubmitting(false);
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
                >
                    {/* Header */}
                    <div className="h-[88px] px-6 bg-gradient-to-r from-green-100 to-white border-b border-gray-100 rounded-t-2xl flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center shrink-0">
                                <Image src="/accounting.png" alt="Budget Icon" width={64} height={64} className="object-contain" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Edit Monthly Budget</h2>
                                <p className="text-xs text-gray-500 font-mono mt-1">#{budget.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <PiX className="text-lg" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
                        {submitError && (
                            <div className="mb-6 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium shrink-0">
                                <PiWarning className="text-base shrink-0" />
                                {submitError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Context & Details */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white p-6 space-y-6 border border-gray-200 rounded-xl shadow-sm">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">Configuration</h3>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Planning Period
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {/* Custom Month Dropdown */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
                                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 flex items-center justify-between hover:border-[#29258D] transition-colors focus:outline-none focus:ring-1 focus:ring-[#29258D]"
                                                    >
                                                        {months[month - 1]}
                                                        <PiCaretDown className={`text-xs text-gray-400 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {isMonthOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setIsMonthOpen(false)} />
                                                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-40 max-h-60 overflow-y-auto custom-scrollbar">
                                                                {months.map((m, i) => (
                                                                    <button
                                                                        key={m}
                                                                        onClick={() => { setMonth(i + 1); setIsMonthOpen(false); }}
                                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${month === i + 1 ? 'text-[#29258D] font-bold bg-[#29258D]/5' : 'text-gray-600'}`}
                                                                    >
                                                                        {m}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Custom Year Dropdown */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }}
                                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 flex items-center justify-between hover:border-[#29258D] transition-colors focus:outline-none focus:ring-1 focus:ring-[#29258D]"
                                                    >
                                                        {year}
                                                        <PiCaretDown className={`text-xs text-gray-400 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {isYearOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setIsYearOpen(false)} />
                                                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-40 max-h-60 overflow-y-auto custom-scrollbar">
                                                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
                                                                    <button
                                                                        key={y}
                                                                        onClick={() => { setYear(y); setIsYearOpen(false); }}
                                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${year === y ? 'text-[#29258D] font-bold bg-[#29258D]/5' : 'text-gray-600'}`}
                                                                    >
                                                                        {y}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Target Branch
                                            </label>
                                            <input
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all shadow-none"
                                                placeholder="Branch Name"
                                                value={branch}
                                                onChange={e => setBranch(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Department
                                            </label>
                                            <input
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all shadow-none"
                                                placeholder="Department"
                                                value={department}
                                                onChange={e => setDepartment(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Line Items */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                                            Line Items ({items.length})
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="flex items-center gap-2 text-[#29258D] text-xs font-bold hover:underline"
                                        >
                                            <PiPlus /> Add Item
                                        </button>
                                    </div>

                                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                                        {items.map((item, index) => (
                                            <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-white hover:bg-gray-50/50 transition-colors relative">
                                                <div className="flex-1">
                                                    <input
                                                        className="w-full bg-transparent text-sm font-medium focus:outline-none text-gray-900 placeholder:text-gray-400"
                                                        placeholder="Description"
                                                        value={item.description}
                                                        onChange={e => updateItem(index, 'description', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-full md:w-48 relative">
                                                    <div
                                                        className="flex items-center justify-between cursor-pointer border-b border-gray-200 py-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (openDropdownIndex === index) {
                                                                setOpenDropdownIndex(null);
                                                            } else {
                                                                setOpenDropdownIndex(index);
                                                                setCategorySearch("");
                                                            }
                                                        }}
                                                    >
                                                        <span className={`text-sm ${item.category ? 'text-[#29258D] font-medium' : 'text-gray-400'}`}>
                                                            {item.category || "Select Category"}
                                                        </span>
                                                        <PiCaretDown className="text-gray-400 text-xs" />
                                                    </div>

                                                    {/* Dropdown Menu */}
                                                    {openDropdownIndex === index && (
                                                        <div
                                                            className="absolute top-full right-0 md:left-0 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 mt-1"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <div className="relative mb-2">
                                                                <PiMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                                                <input
                                                                    autoFocus
                                                                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#29258D]"
                                                                    placeholder="Search..."
                                                                    value={categorySearch}
                                                                    onChange={e => setCategorySearch(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                                                                {filteredCategories.length > 0 ? (
                                                                    filteredCategories.map(cat => (
                                                                        <button
                                                                            key={cat}
                                                                            onClick={() => {
                                                                                updateItem(index, 'category', cat);
                                                                                setOpenDropdownIndex(null);
                                                                            }}
                                                                            className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors ${item.category === cat
                                                                                ? 'bg-[#29258D]/5 text-[#29258D] font-medium'
                                                                                : 'text-gray-600 hover:bg-gray-50'
                                                                                }`}
                                                                        >
                                                                            {cat}
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            updateItem(index, 'category', categorySearch);
                                                                            setOpenDropdownIndex(null);
                                                                        }}
                                                                        className="w-full text-left px-2 py-2 text-xs text-[#29258D] hover:bg-[#29258D]/5 rounded-md flex items-center gap-2 font-medium"
                                                                    >
                                                                        <PiPlus /> Create "{categorySearch}"
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Backdrop */}
                                                    {openDropdownIndex === index && (
                                                        <div
                                                            className="fixed inset-0 z-40"
                                                            onClick={() => setOpenDropdownIndex(null)}
                                                        />
                                                    )}
                                                </div>
                                                <div className="w-full md:w-28 flex items-center gap-1 border-b border-gray-100">
                                                    <span className="text-gray-400 text-xs">$</span>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-transparent text-sm font-mono text-right focus:outline-none px-1 text-gray-900 placeholder:text-gray-300"
                                                        placeholder="0.00"
                                                        value={item.amount || ""}
                                                        onChange={e => updateItem(index, 'amount', e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-gray-300 hover:text-rose-500 transition-colors pt-2 md:pt-0"
                                                >
                                                    <PiTrash />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="h-[88px] px-6 bg-white border-t border-gray-100 flex items-center justify-between shrink-0 rounded-b-2xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Estimated Total</span>
                            <span className="text-xl font-mono font-bold text-[#29258D]">
                                ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-none uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-[#29258D] text-white rounded-xl font-bold text-xs hover:bg-[#29258D]/90 transition-all shadow-lg shadow-[#29258D]/20 disabled:opacity-50 flex items-center gap-2 uppercase tracking-wider"
                            >
                                {isSubmitting ? (
                                    <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                                ) : (
                                    <>
                                        <PiCheckCircle className="text-base" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
