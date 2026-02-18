
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    PiX,
    PiUploadSimple,
    PiFilePdf,
    PiImage,
    PiCheckCircle,
    PiArrowRight,
    PiReceipt,
    PiFloppyDisk
} from "react-icons/pi";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import { uploadQuickInvoice } from "@/app/dashboard/invoices/actions";

interface QuickInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickInvoiceModal({ isOpen, onClose }: QuickInvoiceModalProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [uploadError, setUploadError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            const data = await res.json();
            setFileUrl(data.url);
            setFileName(file.name);
            showToast("Invoice uploaded successfully", "success");
        } catch (error: any) {
            console.error("Upload error:", error);
            setUploadError(error.message);
            showToast("Failed to upload invoice", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleContinue = () => {
        if (!fileUrl) return;
        router.push(`/dashboard/invoices/new?fileUrl=${encodeURIComponent(fileUrl)}`);
        onClose();
    };

    const handleQuickSave = async () => {
        if (!fileUrl) return;
        setIsSaving(true);
        try {
            const res = await uploadQuickInvoice(fileUrl, fileName);
            if (res.success) {
                showToast("Invoice stored as draft", "success");
                onClose();
                router.refresh();
            } else {
                showToast(res.error || "Failed to save", "error");
            }
        } catch (e) {
            showToast("An unexpected error occurred", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
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
                        className="relative bg-white border border-gray-200 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="h-[88px] px-6 flex justify-between items-center bg-white border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-lg bg-[var(--gds-emerald)]/10 text-[var(--gds-emerald)]">
                                    <PiReceipt className="text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
                                        Quick Invoice Upload
                                    </h3>
                                    <p className="text-gray-500 text-xs font-medium">
                                        Upload vendor bills to start the recording process
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <PiX className="text-xl" />
                            </button>
                        </div>

                        {/* Body - Grey Background */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fa] p-8 space-y-8">
                            <div className={cn(
                                "border-2 border-dashed rounded-xl p-12 text-center transition-all relative group h-64 flex flex-col items-center justify-center bg-white",
                                fileUrl
                                    ? "border-[var(--gds-emerald)]/50 bg-[var(--gds-emerald)]/5"
                                    : "border-gray-200 hover:border-[#29258D] hover:bg-[#29258D]/5"
                            )}>
                                {!fileUrl && (
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={isUploading}
                                    />
                                )}

                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-2 border-[#29258D]/30 border-t-[#29258D] rounded-full animate-spin" />
                                        <p className="text-sm font-semibold text-[#29258D]">Uploading...</p>
                                    </div>
                                ) : fileUrl ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-3 rounded-full bg-[var(--gds-emerald)]/20">
                                            <PiCheckCircle className="text-4xl text-[var(--gds-emerald)]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-gray-900 truncate max-w-[250px]">{fileName}</p>
                                            <p className="text-[10px] text-[var(--gds-emerald)] font-bold mt-1">Ready</p>
                                        </div>
                                        <button
                                            onClick={() => { setFileUrl(""); setFileName(""); }}
                                            className="text-xs text-rose-500 font-bold hover:underline relative z-20"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm border border-gray-100">
                                            <PiUploadSimple className="text-3xl text-gray-400 group-hover:text-[#29258D]" />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-gray-900 group-hover:text-[#29258D] transition-colors">
                                                Click to upload invoice
                                            </p>
                                            <p className="text-xs text-gray-500 font-medium mt-1">
                                                PDF, JPG or PNG up to 10MB
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {uploadError && <p className="text-xs text-rose-500 font-bold mt-4 animate-shake">{uploadError}</p>}
                            </div>

                            <div className="flex items-center justify-center gap-12 pt-2 grayscale opacity-30">
                                <PiFilePdf className="text-2xl" />
                                <PiImage className="text-2xl" />
                                <div className="w-px h-6 bg-gray-300" />
                                <PiReceipt className="text-2xl" />
                            </div>
                        </div>

                        {/* Footer - Fixed Height */}
                        <div className="h-[88px] px-6 bg-white border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-none"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!fileUrl || isSaving}
                                onClick={handleQuickSave}
                                className="px-5 py-2.5 rounded-md text-xs font-medium text-[#29258D] bg-indigo-50 hover:bg-indigo-100 border border-[#29258D]/10 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
                            >
                                {isSaving ? <div className="w-3 h-3 border-2 border-[#29258D] border-t-transparent rounded-full animate-spin"></div> : <PiFloppyDisk className="text-lg" />}
                                <span>Quick Save</span>
                            </button>
                            <button
                                disabled={!fileUrl || isSaving}
                                onClick={handleContinue}
                                className="px-5 py-2.5 rounded-md text-xs font-medium text-white bg-[#29258D] hover:bg-[#29258D]/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
                            >
                                <span>Record Details</span>
                                <PiArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
