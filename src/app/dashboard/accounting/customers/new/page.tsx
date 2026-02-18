"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import {
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
    PiUserCircle
} from "react-icons/pi";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";

export default function NewCustomerPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        contactPerson: "",
        address: "",
        city: "Juba",
        country: "South Sudan",
        taxId: "",
        currency: "USD"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/accounting/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create customer");
            }

            showToast("Customer added successfully", "success");
            router.push("/dashboard/accounting/customers");
            router.refresh();
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12 font-sans animate-fade-in-up">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">

                {/* 1. HEADER */}
                <div className="bg-white px-6 h-[88px] flex flex-col justify-center border-b border-gray-100">
                    <h1 className="text-base font-semibold text-gray-900">
                        Add New Customer
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Enter the details of your new client or customer below.
                    </p>
                </div>

                {/* 2. BODY */}
                <div className="bg-[#f8f9fa] p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* SECTION: Company Info */}
                    <div className="md:col-span-2 pb-2 border-b border-gray-200/50 mb-2">
                        <div className="flex items-center gap-2 text-[#29258D]">
                            <PiBuildings className="text-lg" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Company Details</h3>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Customer / Company Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <PiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                required
                                type="text"
                                className="pl-9 bg-white border border-gray-200 text-gray-900 rounded-md focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all text-sm py-2 w-full shadow-none placeholder:text-gray-400"
                                placeholder="e.g. Acme Corp Ltd."
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <PiEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="email"
                                className="pl-9 bg-white border border-gray-200 text-gray-900 rounded-md focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all text-sm py-2 w-full shadow-none placeholder:text-gray-400"
                                placeholder="billing@acme.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Phone Number
                        </label>
                        <PhoneInput
                            value={formData.phone}
                            onChange={(val) => setFormData({ ...formData, phone: val })}
                            placeholder="+211 ..."
                        />
                    </div>

                    {/* SECTION: Address */}
                    <div className="md:col-span-2 pb-2 border-b border-gray-200/50 mb-2 mt-4">
                        <div className="flex items-center gap-2 text-[#29258D]">
                            <PiMapPin className="text-lg" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Location & Contact</h3>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Billing Address
                        </label>
                        <textarea
                            className="bg-white border border-gray-200 text-gray-900 rounded-md focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all text-sm p-3 w-full shadow-none resize-none placeholder:text-gray-400 h-20"
                            placeholder="Street address, PO Box..."
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            City
                        </label>
                        <Input
                            type="text"
                            className="bg-white border border-gray-200 text-gray-900 rounded-md focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all text-sm py-2 w-full shadow-none"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Country
                        </label>
                        <div className="relative">
                            <PiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                className="pl-9 bg-white border border-gray-200 text-gray-900 rounded-md focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all text-sm py-2 w-full shadow-none"
                                value={formData.country}
                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Primary Contact Person
                        </label>
                        <div className="relative">
                            <PiUserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                className="pl-9 bg-white border border-gray-200 text-gray-900 rounded-md focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all text-sm py-2 w-full shadow-none placeholder:text-gray-400"
                                placeholder="e.g. John Doe"
                                value={formData.contactPerson}
                                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* SECTION: Financials */}
                    <div className="md:col-span-2 pb-2 border-b border-gray-200/50 mb-2 mt-4">
                        <div className="flex items-center gap-2 text-[#29258D]">
                            <PiIdentificationCard className="text-lg" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Financial Details</h3>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Tax ID / TIN
                        </label>
                        <Input
                            type="text"
                            className="bg-white border border-gray-200 text-gray-900 rounded-md focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all text-sm py-2 w-full shadow-none placeholder:text-gray-400"
                            placeholder="Tax Identification Number"
                            value={formData.taxId}
                            onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Default Currency
                        </label>
                        <div className="relative">
                            <select
                                className="w-full px-3 py-2.5 pl-3 bg-white border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] transition-all appearance-none text-sm text-gray-900 shadow-none cursor-pointer"
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="SSP">SSP - South Sudanese Pound</option>
                                <option value="KES">KES - Kenyan Shilling</option>
                            </select>
                            <PiCaretDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* 3. FOOTER */}
                <div className="bg-white px-6 h-[88px] flex items-center justify-end gap-3 border-t border-gray-100">
                    <Link href="/dashboard/accounting/customers">
                        <button
                            type="button"
                            className="px-3 py-2.5 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-none"
                        >
                            Cancel
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2.5 rounded-md text-xs font-medium text-white bg-[#29258D] hover:bg-[#29258D]/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
                    >
                        {isSubmitting ? (
                            <>
                                <PiSpinner className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <PiCheckCircle />
                                Create Customer
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
