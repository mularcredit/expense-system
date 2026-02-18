"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PiX, PiUploadSimple, PiSpinner, PiFileXls, PiCheckCircle } from "react-icons/pi";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import { processSalaryFile } from "@/app/dashboard/expenses/salary-upload-action";
import { useRouter } from "next/navigation";

interface SalaryUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SalaryUploadModal({ isOpen, onClose }: SalaryUploadModalProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await processSalaryFile(formData);
            if (res.success) {
                showToast(res.message || "Salary file processed successfully", "success");
                onClose();
                router.refresh();
            } else {
                showToast(res.error || "Failed to process salary file", "error");
            }
        } catch (error) {
            showToast("An unexpected error occurred", "error");
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

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
                        className="relative bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Upload Salary Sheet</h3>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                                <PiX />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-[#29258D]/50 hover:bg-[#29258D]/5 transition-all group cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <PiFileXls className="text-2xl text-emerald-600" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">
                                    {file ? file.name : "Click to upload Excel file"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Supports .xlsx and .xls
                                </p>
                            </div>

                            {file && (
                                <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
                                    <PiCheckCircle className="text-lg shrink-0" />
                                    <span>Ready to upload: <strong>{file.name}</strong></span>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={onClose} disabled={isUploading}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={!file || isUploading}
                                    className="bg-[#29258D] text-white hover:bg-[#29258D]/90"
                                >
                                    {isUploading ? <PiSpinner className="animate-spin mr-2" /> : <PiUploadSimple className="mr-2" />}
                                    {isUploading ? "Processing..." : "Process Salaries"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}


