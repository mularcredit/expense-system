"use client";

import { useState, useEffect } from "react";
import { PiPlus, PiX, PiCaretDown, PiMagnifyingGlass } from "react-icons/pi";
import { addItemToRequisition, getCategoriesAction } from "@/app/dashboard/requisitions/new/multi-item-actions";

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    requisitionId: string;
    currency: string;
    onItemAdded: () => void;
}

export function AddItemModal({
    isOpen,
    onClose,
    requisitionId,
    currency,
    onItemAdded,
}: AddItemModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [unitPrice, setUnitPrice] = useState("");
    const [category, setCategory] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !category || !unitPrice || parseFloat(unitPrice) <= 0) {
            setError("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        const itemData = {
            title,
            description,
            quantity: parseInt(quantity) || 1,
            unitPrice: parseFloat(unitPrice),
            category,
        };

        const result = await addItemToRequisition(requisitionId, itemData);

        if (result.error) {
            setError(result.error);
            setIsSubmitting(false);
        } else {
            // Reset form
            setTitle("");
            setDescription("");
            setQuantity("1");
            setUnitPrice("");
            setCategory("");
            setIsSubmitting(false);
            onItemAdded();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[#29258D]/5 to-transparent">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Add Item to Requisition</h2>
                        <p className="text-xs text-gray-500">Add another item to this purchase request</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <PiX className="text-xl text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Item Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/10 focus:border-[#29258D] transition-all"
                                placeholder="e.g., Laptop Computer"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/10 focus:border-[#29258D] transition-all resize-none"
                                rows={2}
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
                                    {category ? (
                                        <span className="text-sm text-gray-900">{category}</span>
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
                                                                setCategory(cat);
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Quantity <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/10 focus:border-[#29258D] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Unit Price ({currency}) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                        {currency === 'USD' ? '$' : '£'}
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        required
                                        className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#29258D]/10 focus:border-[#29258D] transition-all font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {quantity && unitPrice && (
                            <div className="bg-[#29258D]/5 border border-[#29258D]/20 rounded-lg p-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Item Total</span>
                                <span className="text-lg font-bold text-[#29258D]">
                                    {currency === 'USD' ? '$' : '£'}{(parseInt(quantity) * parseFloat(unitPrice)).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-[#29258D] text-white rounded-lg font-medium text-xs hover:bg-[#29258D]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <PiPlus className="text-sm" />
                            {isSubmitting ? "Adding..." : "Add Item"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
