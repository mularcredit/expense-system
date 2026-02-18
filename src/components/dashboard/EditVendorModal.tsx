'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { PiX, PiCheck, PiBuilding } from 'react-icons/pi'
import { updateVendor } from '@/app/actions/vendors'
import { useToast } from '@/components/ui/ToastProvider'
import { PhoneInput } from '@/components/ui/PhoneInput'

interface EditVendorModalProps {
    isOpen: boolean
    onClose: () => void
    vendor: {
        id: string
        name: string
        category: string
        email: string | null
        phone: string | null
        website: string | null
        paymentTerms: string | null
        currency: string
        description: string | null
    }
}

export function EditVendorModal({ isOpen, onClose, vendor }: EditVendorModalProps) {
    const { showToast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        try {
            const result = await updateVendor(vendor.id, formData)
            if (result.success) {
                showToast(result.message, 'success')
                onClose()
            } else {
                showToast(result.message, 'error')
            }
        } catch (error) {
            showToast('Something went wrong', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
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
                    className="relative bg-white border border-gray-200 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-geist"
                >
                    <div className="h-[72px] px-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-[#F6F6F6] flex items-center justify-center overflow-hidden">
                                <img
                                    src="/online-shopping.png"
                                    alt="Vendor"
                                    className="w-8 h-8 object-contain"
                                />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Edit Vendor</h3>
                                <p className="text-gray-500 text-xs mt-0.5 font-medium">Update supplier profile information</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                        >
                            <PiX className="text-xl" />
                        </button>
                    </div>

                    <form action={handleSubmit} className="flex-1 overflow-y-auto bg-[#f8f9fa] p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Business Name *</label>
                                <input
                                    name="name"
                                    required
                                    defaultValue={vendor.name}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">High-Level Description</label>
                                <textarea
                                    name="description"
                                    rows={2}
                                    defaultValue={vendor.description || ''}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all resize-none"
                                    placeholder="Brief summary of vendor services..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Category *</label>
                                    <select
                                        name="category"
                                        required
                                        defaultValue={vendor.category}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Travel">Travel</option>
                                        <option value="Accommodation">Accommodation</option>
                                        <option value="Meals & Entertainment">Meals & Entertainment</option>
                                        <option value="Logistics">Logistics</option>
                                        <option value="Communication">Communication</option>
                                        <option value="Services">Services</option>
                                        <option value="Software">Software</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Currency</label>
                                    <select
                                        name="currency"
                                        defaultValue={vendor.currency}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="KES">KES</option>
                                        <option value="SSP">SSP</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        defaultValue={vendor.email || ''}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                        placeholder="contact@vendor.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Phone</label>
                                    <PhoneInput name="phone" defaultValue={vendor.phone || ''} placeholder="+254..." />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Website</label>
                                <input
                                    name="website"
                                    type="url"
                                    defaultValue={vendor.website || ''}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1.5">Payment Terms</label>
                                <select
                                    name="paymentTerms"
                                    defaultValue={vendor.paymentTerms || ''}
                                    className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29258D] transition-all"
                                >
                                    <option value="">Select...</option>
                                    <option value="Due on Receipt">Due on Receipt</option>
                                    <option value="Net 7">Net 7</option>
                                    <option value="Net 15">Net 15</option>
                                    <option value="Net 30">Net 30</option>
                                    <option value="Net 45">Net 45</option>
                                    <option value="Net 60">Net 60</option>
                                    {vendor.paymentTerms &&
                                        !["Due on Receipt", "Net 7", "Net 15", "Net 30", "Net 45", "Net 60"].includes(vendor.paymentTerms) && (
                                            <option value={vendor.paymentTerms}>{vendor.paymentTerms}</option>
                                        )}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100/50 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-lg bg-[#29258D] hover:bg-[#29258D]/90 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#29258D]/20"
                            >
                                {isSubmitting ? 'Updating...' : (
                                    <>
                                        <PiCheck className="text-lg" />
                                        Update Vendor
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    )
}
