"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import Image from "next/image";
import {
    PiPlus,
    PiX,
    PiCheck,
    PiArrowsLeftRight,
    PiWifiHigh,
    PiArrowUpRight,
    PiArrowDownLeft,
} from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { UnifiedExpenseModal } from "@/components/expenses/UnifiedExpenseModal";

interface WalletCardProps {
    balance: number;
    currency?: string;
    categories: string[];
    branches: string[];
    isStripe?: boolean;
    holderName?: string;
}

export function WalletCard({ balance, currency = "USD", categories, branches, isStripe = false, holderName = "Card Holder" }: WalletCardProps) {
    const [isAllocateOpen, setIsAllocateOpen] = useState(false);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);

    // Generate consistent card details based on holder name
    const getCardDetails = () => {
        let hash = 0;
        for (let i = 0; i < holderName.length; i++) {
            hash = holderName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const last4 = Math.abs(hash).toString().slice(0, 4).padEnd(4, '0');
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 3);
        const month = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
        const year = expiryDate.getFullYear().toString().slice(-2);
        return { last4, expiry: `${month}/${year}` };
    };

    const { last4, expiry } = getCardDetails();

    return (
        <>
            <div className="w-full">
                {/* ── CARD ── */}
                <div className="relative w-full rounded-2xl overflow-hidden select-none"
                    style={{ aspectRatio: '1.586 / 1', background: 'linear-gradient(135deg, #052e1b 0%, #0a4a2a 45%, #064d2c 100%)' }}>

                    {/* Decorative circle blobs */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-emerald-400/10 blur-3xl" />
                    <div className="absolute top-1/2 right-8 w-24 h-24 rounded-full bg-lime-300/10 blur-xl" />

                    {/* Subtle grid pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />

                    {/* Card content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">

                        {/* Top row */}
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                                    {isStripe ? "Stripe" : "Capital Pay"} Balance
                                </p>
                                <h2 className="text-2xl font-bold text-white leading-none tracking-tight">
                                    <span className="text-sm font-normal text-white/60 mr-1">{currency}</span>
                                    {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h2>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {isStripe ? (
                                    <span className="text-lg font-bold tracking-tighter text-white">
                                        stripe<span className="text-[#635BFF]">.</span>
                                    </span>
                                ) : (
                                    <Image
                                        src="/capitalpay.png"
                                        alt="Capital Pay"
                                        width={72}
                                        height={16}
                                        className="h-5 w-auto object-contain brightness-0 invert opacity-80"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Chip + Contactless */}
                        <div className="flex items-center gap-3">
                            {/* EMV Chip */}
                            <div className="w-9 h-7 rounded-md bg-gradient-to-br from-yellow-200/80 to-yellow-400/60 relative overflow-hidden flex items-center justify-center shadow-inner">
                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-0.5 opacity-60">
                                    {[...Array(9)].map((_, i) => <div key={i} className="bg-yellow-600/40 rounded-[1px]" />)}
                                </div>
                                <div className="w-3 h-3 border border-yellow-600/50 rounded-sm z-10" />
                            </div>
                            <PiWifiHigh className="text-white/50 text-xl rotate-90" />
                        </div>

                        {/* Card number */}
                        <div>
                            <p className="font-mono text-[13px] tracking-[0.22em] text-white/80">
                                •••• &nbsp;•••• &nbsp;•••• &nbsp;{last4}
                            </p>
                        </div>

                        {/* Bottom row */}
                        <div className="flex justify-between items-end">
                            <div className="flex gap-5">
                                <div>
                                    <p className="text-[7px] text-white/35 uppercase tracking-widest mb-0.5">Expires</p>
                                    <p className="font-mono text-[10px] font-bold text-white/80 tracking-wider">{expiry}</p>
                                </div>
                                <div>
                                    <p className="text-[7px] text-white/35 uppercase tracking-widest mb-0.5">Holder</p>
                                    <p className="font-mono text-[10px] font-bold text-white/80 tracking-wider uppercase truncate max-w-[100px]">{holderName}</p>
                                </div>
                            </div>
                            {/* Mastercard-style two circles */}
                            <div className="flex -space-x-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/10" />
                                <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm border border-white/10" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── QUICK ACTIONS BELOW CARD ── */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setIsSubmitOpen(true)}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0a4a2a] hover:bg-[#0d5c35] text-white text-xs font-bold transition-all hover:-translate-y-0.5"
                    >
                        <PiArrowUpRight className="text-base" />
                        Add Expense
                    </button>
                    <button
                        onClick={() => setIsAllocateOpen(true)}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all hover:-translate-y-0.5"
                    >
                        <PiArrowsLeftRight className="text-base" />
                        Allocate
                    </button>
                </div>
            </div>

            {/* Allocate Funds Modal */}
            {isAllocateOpen && (
                <AllocateModal
                    onClose={() => setIsAllocateOpen(false)}
                    branches={branches}
                    categories={categories}
                />
            )}

            {/* Unified Expense Modal */}
            <UnifiedExpenseModal
                isOpen={isSubmitOpen}
                onClose={() => setIsSubmitOpen(false)}
                mode="quick"
            />
        </>
    );
}

// ── ALLOCATE MODAL (unchanged logic, refreshed UI) ──

function AllocateModal({ onClose, branches, categories }: { onClose: () => void, branches: string[], categories: string[] }) {
    const { showToast } = useToast();
    const [selectedBranch, setSelectedBranch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleAllocate = async () => {
        if (!selectedBranch || !amount || !selectedCategory) {
            setError("Please fill in all required fields");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const response = await fetch('/api/wallet/allocate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branch: selectedBranch,
                    amount: parseFloat(amount),
                    category: selectedCategory,
                    description: description || `Allocated to ${selectedBranch} for ${selectedCategory}`
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to allocate funds');
            showToast(`Successfully allocated $${amount} to ${selectedBranch}`, 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (err: any) {
            setError(err.message || 'Failed to allocate funds');
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-white/40 backdrop-blur-xl"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white border border-gray-200 w-full max-w-xl rounded-xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    <div className="h-[88px] px-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="shrink-0 w-12 h-12">
                                <img src="/cards/atm-card.png" alt="Allocate Funds" className="w-full h-full object-contain drop-shadow-sm" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Allocate Funds</h3>
                                <p className="text-gray-500 text-xs mt-1 font-medium">Distribute corporate funds to branches</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
                            <PiX className="text-xl" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#f8f9fa] p-8 space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-bold flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Target Branch *</label>
                            <div className="grid grid-cols-2 gap-4">
                                {branches.map(branch => (
                                    <button
                                        key={branch}
                                        type="button"
                                        onClick={() => setSelectedBranch(branch)}
                                        className={`p-4 rounded-xl border text-left text-xs font-bold transition-all duration-200 ${selectedBranch === branch
                                            ? 'bg-[#29258D] text-white border-[#29258D]'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-[#29258D]/30 hover:bg-gray-50'
                                            }`}
                                    >
                                        {branch}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Category *</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select category</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Amount *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-8 pr-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Context (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full bg-white border border-gray-200 rounded-lg p-4 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all resize-none font-medium"
                                placeholder="Allocation reasoning..."
                            />
                        </div>
                    </div>

                    <div className="h-[88px] px-8 bg-white border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-md text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAllocate}
                            disabled={isSubmitting || !selectedBranch || !amount || !selectedCategory}
                            className="px-6 py-2.5 rounded-md text-xs font-bold text-white bg-[#29258D] hover:bg-[#29258D]/90 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? "Processing..." : (
                                <>
                                    <PiCheck className="text-sm" />
                                    Confirm Allocation
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
