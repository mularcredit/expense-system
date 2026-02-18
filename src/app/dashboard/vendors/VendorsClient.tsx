'use client'

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
    PiBuildings,
    PiEnvelopeSimple,
    PiPhone,
    PiGlobe,
    PiTagBold,
    PiCurrencyDollar,
    PiPlus
} from "react-icons/pi"
import { CreateVendorModal } from "@/components/dashboard/CreateVendorModal"
import { EditVendorModal } from "@/components/dashboard/EditVendorModal"
import { DeleteEntityButton } from "@/components/dashboard/DeleteEntityButton"

interface VendorsClientProps {
    vendors: any[]
}

export function VendorsClient({ vendors }: VendorsClientProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingVendor, setEditingVendor] = useState<any>(null)

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-emerald)]">
                        Approved suppliers & partners
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="gds-btn-premium text-xs font-bold tracking-wider px-6 py-3"
                    >
                        Add vendor
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gds-text-muted italic bg-white border border-dashed border-gray-200 rounded-xl">
                        No vendors found in the system.
                    </div>
                ) : (
                    vendors.map((vendor) => (
                        <div key={vendor.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col group hover:shadow-lg hover:border-indigo-200 transition-all">
                            {/* Header - Matching "Ready to Pay" Batch Header */}
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                                        <img
                                            src="/online-shopping.png"
                                            alt="Vendor"
                                            className="w-6 h-6 object-contain"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-gray-900 truncate">{vendor.name}</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{vendor.category || 'Vendor'}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                    vendor.isActive
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-gray-50 text-gray-500 border-gray-200"
                                )}>
                                    {vendor.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            {/* Body - Clean & Premium */}
                            <div className="px-4 py-6 flex-1 flex flex-col justify-center min-h-[120px]">
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors line-clamp-3 leading-relaxed">
                                        {vendor.description || 'No description available for this vendor.'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {vendor.email && (
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                                            <PiEnvelopeSimple className="text-gray-400" />
                                            <span className="truncate">{vendor.email}</span>
                                        </p>
                                    )}
                                    {vendor.phone && (
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                                            <PiPhone className="text-gray-400" />
                                            <span>{vendor.phone}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Footer - Matching "Confirm Disbursement" Button Styling */}
                            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/30 mt-auto">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingVendor(vendor)}
                                        className="py-2 px-6 rounded-lg text-xs font-bold text-gray-500 bg-transparent border border-gray-200 hover:bg-indigo-50/50 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                                    >
                                        Manage
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {vendor.website && (
                                            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="Visit Website">
                                                <PiGlobe className="text-lg" />
                                            </a>
                                        )}
                                        <DeleteEntityButton
                                            id={vendor.id}
                                            entityType="vendor"
                                            entityName={vendor.name}
                                            className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <CreateVendorModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />

            {editingVendor && (
                <EditVendorModal
                    isOpen={!!editingVendor}
                    vendor={editingVendor}
                    onClose={() => setEditingVendor(null)}
                />
            )}
        </div>
    )
}
