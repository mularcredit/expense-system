"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
    PiCaretLeft,
    PiCheckCircle,
    PiCaretDown,
    PiMagnifyingGlass,
    PiPlus,
    PiCalendarBlank,
    PiStorefront,
    PiTrash,
    PiX
} from "react-icons/pi";
import { DatePicker } from "@/components/ui/DatePicker";
import { createRequisitionWithItems, getCategoriesAction } from "./multi-item-actions";

interface RequisitionItem {
    id: string;
    title: string;
    description: string;
    quantity: number;
    unitPrice: number;
    category: string;
}

export default function NewRequisitionPage() {
    const { data: session } = useSession();
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [formMessage, setFormMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [branch, setBranch] = useState("");
    const [department, setDepartment] = useState("");
    const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined);
    const [vendor, setVendor] = useState("");
    const [isSSCAEnabled, setIsSSCAEnabled] = useState(false);
    const [isStrictApproval, setIsStrictApproval] = useState(false);

    // Items management
    const [items, setItems] = useState<RequisitionItem[]>([]);
    const [showItemForm, setShowItemForm] = useState(false);

    // Current item being added
    const [itemTitle, setItemTitle] = useState("");
    const [itemDescription, setItemDescription] = useState("");
    const [itemQuantity, setItemQuantity] = useState("1");
    const [itemUnitPrice, setItemUnitPrice] = useState("");
    const [itemCategory, setItemCategory] = useState("");

    // Categories
    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const categories = await getCategoriesAction();
        setAllCategories(categories);
    };

    const filteredCategories = allCategories.filter(c =>
        c.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const addItem = () => {
        if (!itemTitle.trim() || !itemCategory || !itemUnitPrice || parseFloat(itemUnitPrice) <= 0) {
            setFormMessage("Please fill in all item fields");
            return;
        }

        const newItem: RequisitionItem = {
            id: Date.now().toString(),
            title: itemTitle,
            description: itemDescription,
            quantity: parseInt(itemQuantity) || 1,
            unitPrice: parseFloat(itemUnitPrice),
            category: itemCategory,
        };

        setItems([...items, newItem]);

        // Reset item form
        setItemTitle("");
        setItemDescription("");
        setItemQuantity("1");
        setItemUnitPrice("");
        setItemCategory("");
        setShowItemForm(false);
        setFormMessage("");
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setFormMessage("");

        if (!title.trim()) {
            setFormMessage("Requisition title is required");
            return;
        }

        if (!description.trim()) {
            setFormMessage("Justification is required");
            return;
        }

        if (items.length === 0) {
            setFormMessage("Please add at least one item");
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("currency", currency);
        formData.append("items", JSON.stringify(items));
        formData.append("branch", branch);
        formData.append("department", department);
        formData.append("vendor", vendor);
        if (expectedDate) formData.append("expectedDate", expectedDate.toISOString());
        if (isSSCAEnabled) {
            formData.append("isSSCA", "true");
            if (isStrictApproval) formData.append("isStrictApproval", "true");
        }

        try {
            const result = await createRequisitionWithItems(formData);
            if (result?.errors) {
                setErrors(result.errors);
                setFormMessage("Please correct the errors below");
                setIsSubmitting(false);
            }
            if (result?.message) {
                setFormMessage(result.message);
                setIsSubmitting(false);
            }
        } catch (e) {
            console.error(e);
            setFormMessage("Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 font-sans">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-300 rounded-xl shadow-sm flex flex-col">
                {/* Header */}
                <div className="h-[88px] px-6 flex items-center justify-between bg-white border-b border-gray-200 rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/requisitions" className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
                            <PiCaretLeft className="text-xl" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 flex items-center justify-center bg-indigo-50 rounded-full">
                                <img src="/pos%20(1).png" alt="Requisition Icon" className="w-9 h-9 object-contain" />
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-gray-900">New Requisition</h1>
                                <p className="text-xs text-gray-500 mt-1">Create a purchase request with multiple items</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Error Message */}
                {formMessage && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mx-6 mt-6 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <PiCheckCircle className="h-5 w-5 text-rose-400 transform rotate-180" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-rose-700">{formMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="bg-gradient-to-b from-gray-50/50 to-[#f5f5ff]/80 p-6 lg:p-8 space-y-8">
                    {/* Section 1: Request Details */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Request details</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Requisition title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:border-[#29258D] focus:ring-[#29258D]/10 transition-all shadow-none placeholder:text-gray-300"
                                    placeholder="What is this request for?"
                                />
                            </div>

                            {/* Special Workflow Toggle */}
                            <div className={`border rounded-xl p-4 transition-all duration-300 ${isSSCAEnabled ? 'bg-[#29258D]/5 border-[#29258D]/20 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg shrink-0 ${isSSCAEnabled ? 'bg-[#29258D] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <PiCheckCircle className="text-lg" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label htmlFor="isSSCA" className="text-sm font-semibold text-gray-900 block cursor-pointer select-none">
                                                    South Sudan civil aviation request
                                                </label>
                                                <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                                                    Enable expedited workflow for Civil Aviation fund requests.
                                                </p>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <label htmlFor="isSSCA" className="cursor-pointer flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="isSSCA"
                                                        checked={isSSCAEnabled}
                                                        onChange={(e) => {
                                                            if ((session?.user as any)?.role !== 'SYSTEM_ADMIN') {
                                                                e.preventDefault();
                                                                setShowAccessDenied(true);
                                                                return;
                                                            }
                                                            setIsSSCAEnabled(e.target.checked);
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#29258D]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#29258D]"></div>
                                                </label>
                                            </div>
                                        </div>

                                        {isSSCAEnabled && (
                                            <div className="mt-4 pt-4 border-t border-[#29258D]/10 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id="isStrictApproval"
                                                        checked={isStrictApproval}
                                                        onChange={(e) => setIsStrictApproval(e.target.checked)}
                                                        className="h-4 w-4 text-[#29258D] focus:ring-[#29258D] border-gray-300 rounded cursor-pointer"
                                                    />
                                                    <label htmlFor="isStrictApproval" className="cursor-pointer select-none">
                                                        <span className="text-xs font-semibold text-gray-900 block">Require strict approval</span>
                                                        <span className="text-[10px] text-gray-500 block">Force Manager + Finance approval regardless of amount.</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Justification <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-[#29258D] focus:ring-[#29258D]/10 transition-all min-h-[100px] shadow-none resize-none placeholder:text-gray-300"
                                    placeholder="Explain the business need and expected impact..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Items */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-2 flex-1">
                                Items <span className="text-rose-500">*</span>
                            </h3>
                        </div>

                        {/* Items List */}
                        {items.length > 0 && (
                            <div className="space-y-3 mb-4">
                                {items.map((item) => (
                                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between hover:border-gray-300 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-sm text-gray-900">{item.title}</h4>
                                                    {item.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors group ml-3"
                                                >
                                                    <PiTrash className="text-gray-400 group-hover:text-rose-500" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="px-2 py-1 bg-[#29258D]/10 text-[#29258D] rounded-md font-medium">
                                                    {item.category}
                                                </span>
                                                <span className="text-gray-600">
                                                    Qty: {item.quantity}
                                                </span>
                                                <span className="text-gray-600">
                                                    @ {currency === 'USD' ? '$' : '£'}{item.unitPrice.toFixed(2)}
                                                </span>
                                                <span className="font-semibold text-gray-900 ml-auto">
                                                    {currency === 'USD' ? '$' : '£'}{(item.quantity * item.unitPrice).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Total */}
                                <div className="bg-[#29258D]/5 border border-[#29258D]/20 rounded-lg p-4 flex items-center justify-between">
                                    <span className="font-bold text-sm text-gray-900">Total Amount</span>
                                    <span className="font-bold text-lg text-[#29258D]">
                                        {currency === 'USD' ? '$' : '£'}{calculateTotal().toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Add Item Form */}
                        {showItemForm ? (
                            <div className="bg-white border border-[#29258D]/30 rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-sm text-gray-900">Add New Item</h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowItemForm(false)}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        <PiX className="text-gray-500" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                            Item Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={itemTitle}
                                            onChange={(e) => setItemTitle(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                            placeholder="e.g., Laptop Computer"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                                        <input
                                            type="text"
                                            value={itemDescription}
                                            onChange={(e) => setItemDescription(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                            placeholder="Optional details..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                            Category <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div
                                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                                className="w-full bg-white border border-gray-200 rounded-lg min-h-[42px] px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors hover:border-[#29258D]"
                                            >
                                                {itemCategory ? (
                                                    <span className="text-sm text-gray-900">{itemCategory}</span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Select category...</span>
                                                )}
                                                <PiCaretDown className={`text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                            </div>

                                            {isCategoryOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
                                                    <div className="relative mb-3">
                                                        <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            placeholder="Search categories..."
                                                            value={categorySearch}
                                                            onChange={(e) => setCategorySearch(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:bg-white transition-all"
                                                        />
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {filteredCategories.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {filteredCategories.map(cat => (
                                                                    <button
                                                                        key={cat}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setItemCategory(cat);
                                                                            setIsCategoryOpen(false);
                                                                            setCategorySearch("");
                                                                        }}
                                                                        className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all bg-white border-gray-300 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                                                                    >
                                                                        {cat}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="py-2 text-center text-gray-500 text-xs">
                                                                No categories found
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {isCategoryOpen && (
                                                <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                            Currency
                                        </label>
                                        <select
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all cursor-pointer"
                                        >
                                            <option value="USD">USD</option>
                                            <option value="SSP">SSP</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                            Quantity <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={itemQuantity}
                                            onChange={(e) => setItemQuantity(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                            Unit Price <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                                {currency === 'USD' ? '$' : '£'}
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={itemUnitPrice}
                                                onChange={(e) => setItemUnitPrice(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all font-mono"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex-1 px-4 py-2.5 bg-[#29258D] text-white rounded-lg font-medium text-xs hover:bg-[#29258D]/90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <PiPlus className="text-sm" />
                                        Add Item
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowItemForm(false)}
                                        className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-xs hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowItemForm(true)}
                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#29258D] hover:text-[#29258D] hover:bg-[#29258D]/5 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                            >
                                <PiPlus className="text-lg" />
                                Add Item
                            </button>
                        )}
                    </div>

                    {/* Section 3: Logistics & Timeline */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Logistics & timeline</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Target Branch</label>
                                <input
                                    type="text"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                    placeholder="e.g. Headquarters"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Department</label>
                                <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                    placeholder="e.g. IT, Operations"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Expected Delivery Date</label>
                                <DatePicker
                                    value={expectedDate}
                                    onChange={setExpectedDate}
                                    placeholder="When do you need this?"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Preferred Vendor (Optional)</label>
                                <div className="relative">
                                    <PiStorefront className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={vendor}
                                        onChange={(e) => setVendor(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                        placeholder="Suggested supplier..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="h-[88px] px-6 bg-gradient-to-b from-[#f5f5ff]/80 to-[#f0f0ff] border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-xl">
                    <Link
                        href="/dashboard/requisitions"
                        className="px-4 py-2.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-[#29258D] text-white rounded-md font-medium text-xs hover:bg-[#29258D]/90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? "Submitting..." : (
                            <>
                                <PiCheckCircle className="text-sm" />
                                Submit Requisition
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Access Denied Modal */}
            {showAccessDenied && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">😔</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Access Restricted</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Sorry, you cannot access this service at the moment. Please request an admin for access.
                            </p>
                            <button
                                onClick={() => setShowAccessDenied(false)}
                                className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
