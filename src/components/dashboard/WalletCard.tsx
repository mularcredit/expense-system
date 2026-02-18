"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import Link from "next/link";
import Image from "next/image";
import {
    PiPlus,
    PiX,
    PiCheck,
    PiArrowsLeftRight,
    PiWifiHigh,
} from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { UnifiedExpenseModal } from "@/components/expenses/UnifiedExpenseModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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

    // Generate consistent "random" card details based on holder name
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
            {/* Maglo-Inspired "Stacked" Wallet Design */}
            <div className="w-full max-w-sm mx-auto">

                {/* Visual Card Stack Container */}
                <div className="relative h-[220px] mb-8 isolate">

                    {/* Back Card (Peeking out) - Glass/Light */}
                    <div className="absolute top-12 left-4 right-4 h-full bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl transform rotate-[-2deg] opacity-60 -z-10"></div>
                    <div className="absolute top-6 left-2 right-2 h-full bg-white/20 backdrop-blur-md border border-white/10 rounded-2xl transform rotate-[-1deg] opacity-80 -z-10"></div>

                    {/* Front Main Card - Dark Travel Themed */}
                    {/* Front Main Card - Dark Travel Themed with Gradient Border */}
                    <div className="absolute inset-0 rounded-2xl p-[1px] border border-white/10 z-10 transition-transform hover:-translate-y-1 duration-300 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
                        <div className="relative w-full h-full bg-[#0F0E3E] rounded-[15px] p-6 text-white flex flex-col justify-between overflow-hidden">

                            {/* World Map Background Pattern */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <Image
                                    src="/assets/globe.svg"
                                    alt="World Map"
                                    fill
                                    className="object-cover object-center scale-150 opacity-30"
                                />
                            </div>

                            {/* Shimmer/Reflection Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40 opacity-50 pointer-events-none rounded-[15px]"></div>

                            {/* Card Header */}
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-2">
                                    {isStripe ? (
                                        <span className="text-2xl font-bold tracking-tighter text-white">
                                            stripe<span className="text-[#635BFF]">.</span>
                                        </span>
                                    ) : (
                                        <div className="flex flex-col">
                                            {/* Branding removed */}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] tracking-widest font-bold text-gray-300 uppercase">
                                    {isStripe ? "Stripe Wallet" : "WALLET"}
                                </span>
                            </div>

                            {/* Chip & Contactless */}
                            <div className="flex justify-between items-center px-1 relative z-10">
                                <div className="w-11 h-8 rounded border border-white/20 relative flex items-center justify-center bg-white/10 shadow-inner backdrop-blur-sm">
                                    {/* Abstract Chip Lines */}
                                    <div className="absolute w-full h-[1px] bg-white/30 top-1/2"></div>
                                    <div className="absolute h-full w-[1px] bg-white/30 left-1/3"></div>
                                    <div className="absolute h-full w-[1px] bg-white/30 right-1/3"></div>
                                    <div className="w-4 h-4 border border-white/30 rounded-sm"></div>
                                </div>
                                <PiWifiHigh className="text-2xl text-gray-300 rotate-90" />
                            </div>

                            {/* Balance Display on Card */}
                            <div className="relative z-10 py-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold opacity-80">
                                        {isStripe ? "Stripe" : "Capital Pay"} Balance
                                    </p>
                                    {isStripe && (
                                        <div className="flex items-center gap-1 bg-[#635BFF]/10 px-1.5 py-0.5 rounded-full border border-[#635BFF]/20">
                                            <div className="w-1 h-1 rounded-full bg-[#635BFF] animate-pulse"></div>
                                            <span className="text-[7px] font-black text-[#635BFF] uppercase">Live</span>
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-2xl font-heading font-bold text-white tracking-tighter leading-none flex items-baseline gap-1">
                                    <span className="text-sm opacity-60 font-bold">$</span>
                                    {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h2>
                            </div>

                            {/* Card Number - Dynamic */}
                            <div className="relative z-10">
                                <p className="font-mono text-[14px] tracking-[0.25em] text-white/90 flex items-center">
                                    <span>••••</span>
                                    <span className="mx-2">••••</span>
                                    <span className="mx-2">••••</span>
                                    <span className="mx-1 text-white font-bold">{last4}</span>
                                </p>
                            </div>

                            {/* Footer: Expiry & Brand & Name */}
                            <div className="flex justify-between items-end relative z-10">
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-[7px] text-gray-400 uppercase mb-0.5 tracking-widest font-bold opacity-80">Expires</p>
                                        <p className="font-mono text-[10px] font-bold tracking-wider text-white">{expiry}</p>
                                    </div>
                                    <div>
                                        <p className="text-[7px] text-gray-400 uppercase mb-0.5 tracking-widest font-bold opacity-80">Holder</p>
                                        <p className="font-mono text-[10px] font-bold tracking-wider text-white uppercase truncate max-w-[120px]">{holderName}</p>
                                    </div>
                                </div>

                                {/* Brand Logo (Bottom Right) */}
                                <div className="flex items-end">
                                    {isStripe ? (
                                        <div className="flex -space-x-3 opacity-90 items-center scale-90 origin-right">
                                            <div className="w-8 h-8 rounded-full border bg-[#635BFF] border-[#635BFF]/20"></div>
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 transform translate-x-1"></div>
                                        </div>
                                    ) : (
                                        <Image
                                            src="/capitalpay.png"
                                            alt="Capital Pay"
                                            width={80}
                                            height={16}
                                            className="h-6 w-auto object-contain brightness-0 invert opacity-90"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Action Button */}
                <Button
                    onClick={() => setIsSubmitOpen(true)}
                    variant="secondary"
                    className="w-full py-6 rounded-xl border-dashed hover:border-solid gap-2 group bg-[var(--gds-surface)]/50 text-[var(--gds-text-muted)] hover:text-[var(--gds-text-main)]"
                >
                    <div className="w-6 h-6 rounded-full bg-[var(--gds-emerald)] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PiPlus className="text-xs font-bold" />
                    </div>
                    <span>Add New Expense</span>
                </Button>

                <div className="mt-3 text-center">
                    <Button
                        variant="link"
                        onClick={() => setIsAllocateOpen(true)}
                        className="text-[10px] font-bold text-[var(--gds-text-muted)] h-auto p-0"
                    >
                        Allocate Funds to Branch
                    </Button>
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

// Helper Components for Modals with Premium Icons

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

            if (!response.ok) {
                throw new Error(data.error || 'Failed to allocate funds');
            }

            // Success - show toast and refresh
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
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-white/40 backdrop-blur-xl"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white border border-gray-200 w-full max-w-xl rounded-xl overflow-hidden max-h-[90vh] flex flex-col font-geist"
                >
                    {/* Header: Fixed 88px */}
                    <div className="h-[88px] px-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-[#F6F6F6] text-[#29258D]">
                                <PiArrowsLeftRight className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Allocate Funds
                                </h3>
                                <p className="text-gray-500 text-xs mt-1 font-medium">
                                    Distribute corporate funds to branches
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                        >
                            <PiX className="text-xl" />
                        </button>
                    </div>

                    {/* Body: Gray Background */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fa] p-8 space-y-6">
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
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Spending Category *</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
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
                                        className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-8 pr-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Business Context (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full bg-white border border-gray-200 rounded-lg p-4 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all resize-none font-medium"
                                placeholder="Allocation reasoning..."
                            />
                        </div>
                    </div>

                    {/* Footer: Fixed 88px */}
                    <div className="h-[88px] px-8 bg-white border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-md text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAllocate}
                            disabled={isSubmitting || !selectedBranch || !amount || !selectedCategory}
                            className="px-6 py-2.5 rounded-md text-xs font-medium text-white bg-[#29258D] hover:bg-[#29258D]/90 transition-all flex items-center gap-2 disabled:opacity-50 shadow-none font-bold"
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

