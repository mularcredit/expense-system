"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PiX, PiWarning } from "react-icons/pi";
import { cn } from "@/lib/utils";

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
    showCloseButton?: boolean;
}

/**
 * Base Modal Component
 * Enforces the standard dashboard modal design pattern
 * - White/40 backdrop with blur-xl
 * - Proper portal rendering
 * - Consistent animations
 * - Z-index management
 */
export function BaseModal({
    isOpen,
    onClose,
    children,
    maxWidth = "md",
    showCloseButton = false
}: BaseModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const maxWidthClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl"
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    {/* Standard Dashboard Backdrop */}
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
                        className={`relative bg-white border border-gray-200 w-full ${maxWidthClasses[maxWidth]} rounded-xl shadow-2xl overflow-hidden`}
                    >
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors z-10"
                            >
                                <PiX className="text-xl" />
                            </button>
                        )}
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
    entityName?: string;
}

/**
 * Confirmation Modal Component
 * Pre-configured for delete/confirm actions
 * Automatically handles the standard confirmation pattern
 */
export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    isLoading = false,
    entityName
}: ConfirmationModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleConfirm = async () => {
        await onConfirm();
    };

    if (!mounted) return null;

    const variantStyles = {
        danger: {
            iconBg: "bg-rose-50",
            iconColor: "text-rose-500",
            buttonBg: "bg-rose-600 hover:bg-rose-700"
        },
        warning: {
            iconBg: "bg-amber-50",
            iconColor: "text-amber-500",
            buttonBg: "bg-amber-600 hover:bg-amber-700"
        },
        info: {
            iconBg: "bg-blue-50",
            iconColor: "text-blue-500",
            buttonBg: "bg-blue-600 hover:bg-blue-700"
        }
    };

    const styles = variantStyles[variant];

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
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
                        className="relative bg-white border border-gray-200 w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 text-center">
                            <div className={`w-14 h-14 rounded-full ${styles.iconBg} ${styles.iconColor} flex items-center justify-center mx-auto mb-4`}>
                                <PiWarning className="text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                            <p className="text-sm text-gray-500 mb-8">
                                {entityName ? (
                                    <>
                                        {description.split(entityName)[0]}
                                        <span className="font-semibold text-gray-900">{entityName}</span>
                                        {description.split(entityName)[1]}
                                    </>
                                ) : (
                                    description
                                )}
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className={`px-6 py-2.5 text-sm font-semibold text-white ${styles.buttonBg} rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50`}
                                >
                                    {isLoading && (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {isLoading ? "Processing..." : confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    children: ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
    hideIconBackground?: boolean;
}

/**
 * Form Modal Component
 * Pre-configured for forms with header and gray body
 */
export function FormModal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    children,
    maxWidth = "xl",
    hideIconBackground = false
}: FormModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const maxWidthClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        "6xl": "max-w-6xl"
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
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
                        className={`relative bg-white border border-gray-200 w-full ${maxWidthClasses[maxWidth]} rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
                    >
                        {/* Header */}
                        <div className="h-[72px] px-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                {icon && (
                                    <div className={cn(
                                        !hideIconBackground && "p-2.5 rounded-lg bg-[#F6F6F6] text-[#29258D]"
                                    )}>
                                        {icon}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                                    {subtitle && (
                                        <p className="text-gray-500 text-xs mt-0.5 font-medium">{subtitle}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                            >
                                <PiX className="text-xl" />
                            </button>
                        </div>

                        {/* Body with gray background */}
                        <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
