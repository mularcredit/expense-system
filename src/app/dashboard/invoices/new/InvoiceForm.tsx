
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
    PiUploadSimple,
    PiTrash,
    PiPlus,
    PiFloppyDisk,
    PiReceipt,
    PiCheckCircle,
    PiSpinner
} from "react-icons/pi";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface InvoiceFormProps {
    vendors: Array<{ id: string; name: string }>;
}

interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    category: string;
}

interface InvoiceFormData {
    vendorId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;
    description: string;
    fileUrl: string;
    items: InvoiceItem[];
}

export function InvoiceForm({ vendors }: InvoiceFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const searchParams = useSearchParams();
    const initialFileUrl = searchParams.get("fileUrl") || "";

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
        defaultValues: {
            vendorId: "",
            invoiceNumber: "",
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: "",
            currency: "USD",
            description: "",
            fileUrl: initialFileUrl,
            items: [{ description: "", quantity: 1, unitPrice: 0, total: 0, category: "" }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Watch items to calculate totals
    const items = watch("items");
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            const data = await res.json();
            setValue("fileUrl", data.url);
            showToast("Receipt uploaded successfully", "success");
        } catch (error: any) {
            console.error("Upload error:", error);
            setUploadError(error.message);
            showToast("Failed to upload receipt", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: any) => {
        if (data.items.length === 0) {
            showToast("Please add at least one line item", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            // Recalculate item totals just in case
            const formattedItems = data.items.map((item: any) => ({
                ...item,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                total: Number(item.quantity) * Number(item.unitPrice)
            }));

            const payload = {
                ...data,
                amount: subtotal,
                items: formattedItems
            };

            const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to create invoice");
            }

            showToast("Invoice recorded successfully!", "success");
            router.push("/dashboard/invoices");
            router.refresh();
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in-up font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Vendor & Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-white px-6 h-[72px] flex items-center gap-3 border-b border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-[#29258D]/10 flex items-center justify-center">
                                <PiReceipt className="text-lg text-[#29258D]" />
                            </div>
                            <h2 className="text-base font-semibold text-gray-900">
                                Invoice Details
                            </h2>
                        </div>

                        <div className="p-6 bg-[#F6F6F6] space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1.5 uppercase tracking-wide">Vendor</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 transition-all shadow-sm"
                                        {...register("vendorId", { required: "Vendor is required" })}
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                    {errors.vendorId && <span className="text-xs text-rose-500 font-medium mt-1 block">{errors.vendorId.message as string}</span>}
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1.5 uppercase tracking-wide">Invoice Number</label>
                                    <Input
                                        type="text"
                                        placeholder="INV-2024-001"
                                        {...register("invoiceNumber", { required: "Invoice Number is required" })}
                                        className="bg-white"
                                    />
                                    {errors.invoiceNumber && <span className="text-xs text-rose-500 font-medium mt-1 block">{errors.invoiceNumber.message as string}</span>}
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1.5 uppercase tracking-wide">Invoice Date</label>
                                    <Input
                                        type="date"
                                        {...register("invoiceDate", { required: "Date is required" })}
                                        className="bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1.5 uppercase tracking-wide">Due Date</label>
                                    <Input
                                        type="date"
                                        {...register("dueDate", { required: "Due Date is required" })}
                                        className="bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1.5 uppercase tracking-wide">Currency</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 transition-all shadow-sm"
                                        {...register("currency")}
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="SSP">SSP (£)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                                <textarea
                                    className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#29258D] focus:border-[#29258D] disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 transition-all shadow-sm h-20 resize-none"
                                    placeholder="Brief description of services or goods..."
                                    {...register("description")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-white px-6 h-[60px] flex justify-between items-center border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
                            <button
                                type="button"
                                onClick={() => append({ description: "", quantity: 1, unitPrice: 0, total: 0, category: "" })}
                                className="text-xs font-medium text-[#29258D] hover:underline flex items-center gap-1"
                            >
                                <PiPlus /> Add Item
                            </button>
                        </div>

                        <div className="p-6 bg-[#F6F6F6] space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-4 items-end group">
                                    <div className="col-span-5">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Description</label>
                                        <Input
                                            type="text"
                                            placeholder="Item name"
                                            {...register(`items.${index}.description` as const, { required: true })}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Qty</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            {...register(`items.${index}.quantity` as const, { required: true })}
                                            className="bg-white text-center"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Unit Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                                                {watch("currency") === 'USD' ? '$' : '£'}
                                            </span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...register(`items.${index}.unitPrice` as const, { required: true })}
                                                className="bg-white pl-7"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex items-center mb-2 gap-2 justify-end">
                                        <p className="font-mono font-bold text-sm text-gray-900">
                                            {watch("currency") === 'USD' ? '$' : '£'}{(Number(watch(`items.${index}.quantity`)) * Number(watch(`items.${index}.unitPrice`))).toFixed(2)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <PiTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end">
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Amount</p>
                                <p className="text-2xl font-bold text-[#29258D]">
                                    {watch("currency") === 'USD' ? '$' : '£'}{subtotal.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Meta */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
                        <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">Actions</h3>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? (
                                <PiSpinner className="animate-spin text-lg" />
                            ) : (
                                <PiFloppyDisk className="text-lg mr-2" />
                            )}
                            {isSubmitting ? "Saving..." : "Save Invoice"}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => router.back()}
                            variant="secondary"
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
                        <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">File Upload</h3>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative group">
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={isUploading}
                            />
                            {isUploading ? (
                                <div className="flex flex-col items-center">
                                    <PiSpinner className="animate-spin text-2xl text-[#29258D] mb-2" />
                                    <p className="text-xs font-bold text-[#29258D]">Uploading...</p>
                                </div>
                            ) : watch("fileUrl") ? (
                                <div className="flex flex-col items-center">
                                    <PiCheckCircle className="text-3xl text-emerald-500 mb-2" />
                                    <p className="text-sm font-bold text-emerald-600">File attached</p>
                                    <p className="text-xs text-gray-500 mt-1 break-all px-4">{watch("fileUrl")?.split('/').pop()}</p>
                                    <p className="text-[10px] text-[#29258D] font-bold mt-2 z-20 relative pointer-events-none">Click to replace</p>
                                </div>
                            ) : (
                                <>
                                    <PiUploadSimple className="text-3xl text-gray-400 mx-auto mb-2 group-hover:text-[#29258D] transition-colors" />
                                    <p className="text-sm font-bold text-gray-900">Click to upload invoice PDF</p>
                                    <p className="text-xs text-gray-500 mt-1">or drag and drop here</p>
                                    {uploadError && <p className="text-xs text-rose-500 font-bold mt-2">{uploadError}</p>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form >
    );
}
