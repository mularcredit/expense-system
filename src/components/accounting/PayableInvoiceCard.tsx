"use client";

import Link from "next/link";
import { useState } from "react";
import {
    PiInvoice,
    PiClock,
    PiCheckCircle,
    PiWarning,
    PiCalendar,
    PiBuildings,
    PiCurrencyDollar
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { PayInvoiceModal } from "@/components/accounting/PayInvoiceModal";

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: Date;
    status: string;
    vendor: {
        name: string;
        bankName?: string | null;
        bankAccount?: string | null;
    };
}

interface PayableInvoiceCardProps {
    invoice: Invoice;
    variant?: 'overdue' | 'upcoming';
}

export function PayableInvoiceCard({ invoice, variant = 'upcoming' }: PayableInvoiceCardProps) {
    const [showPayModal, setShowPayModal] = useState(false);

    const colorScheme = variant === 'overdue'
        ? { border: 'rose', hover: 'rose', icon: 'rose' }
        : { border: 'amber', hover: 'amber', icon: 'amber' };

    return (
        <>
            <div className={cn(
                "flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl transition-all group",
                variant === 'overdue' && "hover:border-rose-300 hover:bg-rose-50/50",
                variant === 'upcoming' && "hover:border-amber-300 hover:bg-amber-50/50"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-2 bg-gray-100 rounded-lg transition-colors",
                        variant === 'overdue' && "group-hover:bg-rose-100",
                        variant === 'upcoming' && "group-hover:bg-amber-100"
                    )}>
                        <PiBuildings className={cn(
                            "text-lg text-gray-600",
                            variant === 'overdue' && "group-hover:text-rose-600",
                            variant === 'upcoming' && "group-hover:text-amber-600"
                        )} />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-gray-900">{invoice.vendor.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{invoice.invoiceNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="font-bold text-sm text-gray-900">
                            ${invoice.amount.toLocaleString()}
                        </p>
                        <p className={cn(
                            "text-xs font-medium",
                            variant === 'overdue' && "text-rose-600",
                            variant === 'upcoming' && "text-amber-600"
                        )}>
                            Due {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowPayModal(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
                    >
                        <PiCurrencyDollar className="text-base" />
                        Pay Now
                    </button>
                </div>
            </div>

            {showPayModal && (
                <PayInvoiceModal
                    invoice={invoice}
                    onClose={() => setShowPayModal(false)}
                />
            )}
        </>
    );
}
