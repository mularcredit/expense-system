
"use client";

import { useState } from "react";
import Link from "next/link";
import { PiPlus, PiUploadSimple } from "react-icons/pi";
import { QuickInvoiceModal } from "@/components/dashboard/QuickInvoiceModal";

export function InvoiceHeaderActions() {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => setIsUploadModalOpen(true)}
                className="gds-btn-secondary flex items-center gap-2 group py-2.5 px-5"
            >
                <PiUploadSimple className="text-lg group-hover:scale-110 transition-transform" />
                Quick Upload
            </button>
            <Link
                href="/dashboard/invoices/new"
                className="gds-btn-premium flex items-center gap-2 group py-2.5 px-5"
            >
                <PiPlus className="text-lg group-hover:rotate-90 transition-transform" />
                Record Invoice
            </Link>

            <QuickInvoiceModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
            />
        </div>
    );
}
