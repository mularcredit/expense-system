"use client";

import { useState, useEffect } from "react";
import {
    PiCheck,
    PiUploadSimple,
    PiPaperPlaneRight,
    PiWarningCircle,
    PiCheckCircle,
    PiInfo,
    PiPaperclip,
    PiArrowRight,
    PiCaretDown,
    PiMagnifyingGlass,
    PiPlus
} from "react-icons/pi";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createExpense } from "@/app/dashboard/expenses/new/actions";
import { checkBudget } from "@/app/dashboard/expenses/new/budget-actions";
import { getVendors } from "@/app/dashboard/vendors/actions";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { DatePicker } from "@/components/ui/DatePicker";
import { format, parseISO } from "date-fns";

interface ExpenseFormProps {
    mode: "quick" | "full";
    onSuccess: () => void;
    onCancel?: () => void;
}

export function ExpenseForm({ mode, onSuccess, onCancel }: ExpenseFormProps) {
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [budgetStatus, setBudgetStatus] = useState<any>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [category, setCategory] = useState("");
    const [merchant, setMerchant] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState("");
    const [fileName, setFileName] = useState("");

    // Category Dropdown State
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");
    const [vendors, setVendors] = useState<{ id: string, name: string }[]>([]);
    const [isVendorOpen, setIsVendorOpen] = useState(false);
    const [vendorSearch, setVendorSearch] = useState("");

    const filteredCategories = EXPENSE_CATEGORIES.filter(c =>
        c.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(vendorSearch.toLowerCase())
    );

    // Fetch Vendors
    useEffect(() => {
        const fetchVendors = async () => {
            const result = await getVendors();
            if (result.success && result.vendors) {
                setVendors(result.vendors);
            }
        };
        fetchVendors();
    }, []);

    // Budget Validation Effect
    useEffect(() => {
        const validateBudget = async () => {
            if (category && amount && parseFloat(amount) > 0) {
                setIsValidating(true);
                try {
                    const result = await checkBudget(category, parseFloat(amount));
                    setBudgetStatus(result);
                } catch (error) {
                    console.error("Budget check failed", error);
                } finally {
                    setIsValidating(false);
                }
            } else {
                setBudgetStatus(null);
            }
        };

        const timer = setTimeout(validateBudget, 500);
        return () => clearTimeout(timer);
    }, [amount, category]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !category || (!title && mode === "full")) {
            showToast("Required fields are missing", "error");
            return;
        }

        if (budgetStatus && !budgetStatus.allowed) {
            showToast("Budget Exceeded", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            const finalTitle = title || (mode === "quick" ? `Expense: ${merchant || category}` : "");

            formData.append("title", finalTitle);
            formData.append("amount", amount);
            formData.append("currency", currency);
            formData.append("category", category);
            formData.append("expenseDate", date);
            formData.append("merchant", merchant);
            formData.append("description", description || (mode === "quick" ? "Direct entry via dashboard" : ""));

            const result = await createExpense(formData);
            if (result?.errors) throw new Error(Object.values(result.errors)[0][0]);

            showToast("Expense created successfully!", "success");
            onSuccess();
        } catch (error: any) {
            if (error.message !== "NEXT_REDIRECT") {
                showToast(error.message || "Something went wrong", "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full font-sans">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-300 flex flex-col shadow-sm">

                {/* 1. HEADER: Pure White */}
                <div className="bg-white px-6 h-[88px] flex items-center gap-4 border-b border-gray-100 rounded-t-xl">
                    <div className="w-14 h-14 flex items-center justify-center bg-indigo-50 rounded-full shrink-0">
                        <img src="/online-payment.png" alt="Expense Icon" className="w-9 h-9 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">
                            New Transaction
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Enter the details of your expense below.
                        </p>
                    </div>
                </div>

                {/* 2. BODY: Gradient Background with Sections */}
                <div className="bg-gradient-to-b from-gray-50/50 to-[#f5f5ff]/80 p-6 lg:p-8 space-y-8">

                    {/* Section 1: Transaction Details */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Transaction details</h3>
                        <div className="space-y-6">
                            {/* Title (Full Mode) or Description (Quick Mode) */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    {mode === "quick" ? "Description" : "Expense title"} <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    required={mode === "full"}
                                    value={mode === "quick" ? merchant : title}
                                    onChange={(e) => mode === "quick" ? setMerchant(e.target.value) : setTitle(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/10 focus:border-[#29258D] transition-all shadow-none placeholder:text-gray-300"
                                    placeholder={mode === "quick" ? "E.g. Uber ride to airport" : "What is this expense for?"}
                                />
                            </div>

                            {/* Additional Notes (Full Mode) */}
                            {mode === "full" && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Description <span className="text-rose-500">*</span></label>
                                    <Textarea
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/10 focus:border-[#29258D] transition-all min-h-[100px] shadow-none resize-none placeholder:text-gray-300"
                                        placeholder="Add any relevant context..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Financial Overview (Renamed/Moved) */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Financial overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount <span className="text-rose-500">*</span></label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                            {currency === 'USD' ? '$' : '£'}
                                        </span>
                                        <Input
                                            type="number"
                                            required
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/10 focus:border-[#29258D] transition-all font-mono shadow-none placeholder:text-gray-300"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <select
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#29258D]/10 focus:border-[#29258D] transition-all shadow-none cursor-pointer appearance-none"
                                            style={{ backgroundImage: 'none' }}
                                        >
                                            <option value="USD">USD</option>
                                            <option value="SSP">SSP</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Category */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Category <span className="text-rose-500">*</span></label>
                                <div
                                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                    className="w-full bg-white border border-gray-200 rounded-xl min-h-[42px] px-4 py-2.5 cursor-pointer flex items-center justify-between hover:border-[#29258D] transition-colors"
                                >
                                    <div className="flex flex-wrap gap-2">
                                        {category ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#29258D]/10 text-[#29258D] border border-[#29258D]/20">
                                                {category}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">Select a category...</span>
                                        )}
                                    </div>
                                    <PiCaretDown className={`text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {/* Category Dropdown */}
                                {isCategoryOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100 shadow-xl">
                                        <div className="relative mb-3">
                                            <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search categories..."
                                                value={categorySearch}
                                                onChange={(e) => setCategorySearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:bg-white transition-all shadow-none"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                            {filteredCategories.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {filteredCategories.map(cat => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => {
                                                                setCategory(cat);
                                                                setIsCategoryOpen(false);
                                                                setCategorySearch("");
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === cat
                                                                ? 'bg-[#29258D]/5 border-[#29258D]/30 text-[#29258D]'
                                                                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                                                                }`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-2 text-center">
                                                    {categorySearch.trim().length > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCategory(categorySearch.trim());
                                                                setIsCategoryOpen(false);
                                                                setCategorySearch("");
                                                            }}
                                                            className="w-full py-2 px-3 text-xs font-medium text-[#29258D] bg-[#29258D]/5 hover:bg-[#29258D]/10 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                                        >
                                                            <PiPlus className="text-sm" />
                                                            Create "{categorySearch}"
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs">No categories found</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {isCategoryOpen && (
                                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsCategoryOpen(false); }} />
                                )}
                            </div>
                        </div>

                        {/* Budget Widget (Moved inside Financial Overview) */}
                        {budgetStatus && (
                            <div className={`mb-6 px-4 py-3 rounded-xl flex items-center gap-3 text-xs border ${budgetStatus.allowed
                                ? budgetStatus.warning
                                    ? "bg-amber-50 border-amber-200 text-amber-800"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-800"
                                }`}>
                                <div className={`w-2 h-2 rounded-full shrink-0 ${budgetStatus.allowed
                                    ? budgetStatus.warning ? "bg-amber-500" : "bg-emerald-500"
                                    : "bg-rose-500"
                                    }`} />
                                <span className="font-medium text-sm">
                                    {budgetStatus.allowed
                                        ? (budgetStatus.warning ? "Budget Warning" : `Budget Safe ($${budgetStatus.remainingAfter.toFixed(0)} left)`)
                                        : "Limit Exceeded"}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Logistics & Documentation */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Logistics & documentation</h3>

                        {/* Full Mode Logistics */}
                        {mode === "full" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Vendor */}
                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Vendor name</label>
                                    <div
                                        onClick={() => setIsVendorOpen(!isVendorOpen)}
                                        className="w-full bg-white border border-gray-200 rounded-xl min-h-[42px] px-4 py-2.5 cursor-pointer flex items-center justify-between hover:border-[#29258D] transition-colors"
                                    >
                                        <div className="flex flex-wrap gap-2">
                                            {merchant ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#29258D]/10 text-[#29258D] border border-[#29258D]/20">
                                                    {merchant}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">Select vendor...</span>
                                            )}
                                        </div>
                                        <PiCaretDown className={`text-gray-400 transition-transform ${isVendorOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {/* Vendor Dropdown */}
                                    {isVendorOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100 shadow-xl">
                                            <div className="relative mb-3">
                                                <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    placeholder="Search vendors..."
                                                    value={vendorSearch}
                                                    onChange={(e) => setVendorSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:bg-white transition-all shadow-none"
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                {filteredVendors.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {filteredVendors.map(v => (
                                                            <button
                                                                key={v.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setMerchant(v.name);
                                                                    setIsVendorOpen(false);
                                                                    setVendorSearch("");
                                                                }}
                                                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${merchant === v.name
                                                                    ? 'bg-[#29258D]/5 border-[#29258D]/30 text-[#29258D]'
                                                                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                                                                    }`}
                                                            >
                                                                {v.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-2 text-center">
                                                        {vendorSearch.trim().length > 0 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMerchant(vendorSearch.trim());
                                                                    setIsVendorOpen(false);
                                                                    setVendorSearch("");
                                                                }}
                                                                className="w-full py-2 px-3 text-xs font-medium text-[#29258D] bg-[#29258D]/5 hover:bg-[#29258D]/10 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                                            >
                                                                <PiPlus className="text-sm" />
                                                                Use "{vendorSearch}"
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs">No vendors found</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {isVendorOpen && (
                                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsVendorOpen(false); }} />
                                    )}
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Date of expense</label>
                                    <DatePicker
                                        value={date ? parseISO(date) : undefined}
                                        onChange={(d) => setDate(format(d, 'yyyy-MM-dd'))}
                                        placeholder="Select Date"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        ) : null}

                        {/* Receipt Upload */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Receipt</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={`w-full py-3 px-4 border rounded-xl flex items-center justify-between transition-all ${fileName
                                    ? 'bg-[#29258D]/5 border-[#29258D]/20'
                                    : 'bg-white border-gray-200 hover:border-[#29258D]'
                                    }`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {fileName ? <PiCheckCircle className="text-[#29258D] shrink-0 text-lg" /> : <PiPaperclip className="text-gray-400 shrink-0 text-lg" />}
                                        <span className={`text-sm truncate ${fileName ? 'text-[#29258D] font-medium' : 'text-gray-500 '}`}>
                                            {fileName || "Click to upload receipt"}
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">Browse</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. FOOTER: Gradient Background */}
                <div className="h-[88px] px-6 bg-gradient-to-b from-[#f5f5ff]/80 to-[#f0f0ff] border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-xl">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-none"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-md text-xs font-medium text-white bg-[#29258D] hover:bg-[#29258D]/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
                    >
                        {isSubmitting ? "Saving..." : (mode === "quick" ? "Save" : "Submit Claim")}
                    </button>
                </div>
            </form>
        </div>
    );
}
