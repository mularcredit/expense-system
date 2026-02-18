"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { PiCheckCircle, PiWarningCircle, PiInfo, PiX } from 'react-icons/pi';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { id, message, type };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <PiCheckCircle className="text-2xl" />;
            case 'error': return <PiWarningCircle className="text-2xl" />;
            case 'warning': return <PiWarningCircle className="text-2xl" />;
            default: return <PiInfo className="text-2xl" />;
        }
    };

    const getStyles = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
            case 'error': return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
            case 'warning': return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
            default: return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] space-y-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl animate-slide-in-right min-w-[320px] ${getStyles(toast.type)}`}
                    >
                        {getIcon(toast.type)}
                        <p className="flex-1 font-bold text-sm">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                        >
                            <PiX className="text-lg" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
