"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PiTrash, PiSpinner, PiWarning } from "react-icons/pi";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmationModal } from "@/components/ui/Modal";

export function InvoiceActions({ id, invoiceNumber }: { id: string; invoiceNumber: string }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete invoice");
            }

            showToast("Invoice deleted successfully", "success");
            setShowConfirm(false);
            router.push("/dashboard/invoices");
            router.refresh();
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isDeleting}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center"
                title="Delete Invoice"
            >
                {isDeleting ? <PiSpinner className="animate-spin text-xl" /> : <PiTrash className="text-xl" />}
            </button>

            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Invoice?"
                description={`Are you sure you want to delete ${invoiceNumber}? This action cannot be undone.`}
                entityName={invoiceNumber}
                confirmText="Yes, Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </>
    );
}
