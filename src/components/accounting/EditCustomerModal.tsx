
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
    PiX,
    PiUser,
    PiEnvelope,
    PiPhone,
    PiMapPin,
    PiIdentificationCard,
    PiGlobe,
    PiCaretDown,
    PiCheckCircle,
    PiSpinner,
    PiBuildings,
    PiUserCircle,
    PiPencilSimple
} from "react-icons/pi";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { useToast } from "@/components/ui/ToastProvider";

interface EditCustomerModalProps {
    customer: any; // Using any for simplicity here, but should be typed ideally
}

export function EditCustomerModal({ customer }: EditCustomerModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        id: customer.id,
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        contactPerson: customer.contactPerson || "",
        address: customer.address || "",
        city: customer.city || "",
        country: customer.country || "",
        taxId: customer.taxId || "",
        currency: customer.currency || "USD",
        isActive: customer.isActive
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/accounting/customers", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to update customer");

            showToast("Customer updated successfully", "success");
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            showToast("Failed to update customer", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-indigo-50"
                title="Edit Details"
            >
                <PiPencilSimple className="text-lg" />
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div
                        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Edit Customer Details</h2>
                                <p className="text-xs text-gray-500 mt-1">Update profile information for {customer.name}</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <PiX className="text-xl" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="overflow-y-auto p-6 space-y-6">
                            <form id="edit-customer-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Company Name</label>
                                        <div className="relative">
                                            <PiBuildings className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                required
                                                className="pl-9"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Email</label>
                                        <div className="relative">
                                            <PiEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                type="email"
                                                className="pl-9"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Phone</label>
                                        <PhoneInput
                                            value={formData.phone}
                                            onChange={val => setFormData({ ...formData, phone: val })}
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Address</label>
                                        <div className="relative">
                                            <textarea
                                                className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-sm h-20 resize-none outline-none transition-all placeholder:text-gray-400"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Street Address..."
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">City</label>
                                            <Input
                                                value={formData.city}
                                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Country</label>
                                            <div className="relative">
                                                <PiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <Input
                                                    className="pl-9"
                                                    value={formData.country}
                                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Contact Person</label>
                                        <div className="relative">
                                            <PiUserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                className="pl-9"
                                                value={formData.contactPerson}
                                                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Tax ID / TIN</label>
                                        <div className="relative">
                                            <PiIdentificationCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                className="pl-9"
                                                value={formData.taxId}
                                                onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Status</label>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isActive}
                                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-medium text-gray-900">Active Customer</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="edit-customer-form"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-[#29258D] hover:bg-[#1e1b66] text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? <PiSpinner className="animate-spin" /> : <PiCheckCircle className="text-lg" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
