
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    PiPlus,
    PiMagnifyingGlass,
    PiPackage,
    PiCheckCircle,
    PiWarning,
    PiTrash,
    PiCurrencyDollar,
    PiCalendarBlank,
    PiUser,
    PiTag,
    PiX,
    PiCaretDown
} from "react-icons/pi";

const ASSET_CATEGORIES = [
    "Vehicles & Transport",
    "Generators & Power Systems",
    "IT & Communications",
    "Office Furniture",
    "Land & Buildings",
    "Security Equipment",
    "Water Infrastructure",
    "Machinery & Heavy Plant",
    "Fixtures & Fittings",
    "Software Licenses",
    "Other Assets"
];
import { StatsCard } from "@/components/dashboard/StatsCard";
import { createAsset, deleteAsset, runDepreciation } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import { DatePicker } from "@/components/ui/DatePicker";

export function AssetManager({ assets, stats }: { assets: any[], stats: any }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");
    const [isDepreciationOpen, setIsDepreciationOpen] = useState(false);
    const [isDepreciating, setIsDepreciating] = useState(false);

    const filteredCategories = ASSET_CATEGORIES.filter(c =>
        c.toLowerCase().includes(categorySearch.toLowerCase())
    );

    // New Asset Form State
    const [newAsset, setNewAsset] = useState({
        name: "",
        category: "IT & Communications",
        status: "ACTIVE",
        purchaseDate: new Date().toISOString().split("T")[0],
        purchasePrice: "",
        serialNumber: "",
        assetTag: "",
        location: "Main Office",
        assignedToId: "",
        notes: "",
        depreciationMethod: "NONE",
        usefulLifeYears: "",
        salvageValue: "",
        depreciationRate: ""
    });

    const handleSearch = (term: string) => {
        setSearchQuery(term);
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        router.replace(`/dashboard/assets?${params.toString()}`);
    };

    const handleSubmit = async () => {
        if (!newAsset.name || !newAsset.purchasePrice) {
            showToast("Please fill in required fields", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createAsset(newAsset);
            if (result.success) {
                showToast("Asset created successfully", "success");
                setIsAddModalOpen(false);
                setNewAsset({
                    name: "",
                    category: "IT & Communications",
                    status: "ACTIVE",
                    purchaseDate: new Date().toISOString().split("T")[0],
                    purchasePrice: "",
                    serialNumber: "",
                    assetTag: "",
                    location: "Main Office",
                    assignedToId: "",
                    notes: "",
                    depreciationMethod: "NONE",
                    usefulLifeYears: "",
                    salvageValue: "",
                    depreciationRate: ""
                });
                router.refresh();
            } else {
                showToast(result.error || "Failed to create asset", "error");
            }
        } catch (error) {
            showToast("An error occurred", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this asset?")) {
            const result = await deleteAsset(id);
            if (result.success) {
                showToast("Asset deleted", "success");
                router.refresh();
            } else {
                showToast("Failed to delete asset", "error");
            }
        }
    };

    const handleRunDepreciation = async () => {
        if (!confirm("Are you sure you want to run depreciation for all active assets? This will create journal entries.")) return;

        setIsDepreciating(true);
        try {
            const result = await runDepreciation();
            if (result.success) {
                showToast(`Depreciation complete. Posted ${result.count} entries.`, "success");
                router.refresh();
            } else {
                showToast(result.error || "Failed to run depreciation", "error");
            }
        } catch (error) {
            showToast("An error occurred", "error");
        } finally {
            setIsDepreciating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Assets"
                    value={stats.total.toString()}
                    icon={PiPackage}
                    color="purple"
                    trend={`${stats.active} Active`}
                />
                <StatsCard
                    title="Asset Value"
                    value={`$${stats.totalValue.toLocaleString()}`}
                    icon={PiCurrencyDollar}
                    color="emerald"
                    trend="Total Investment"
                    trendUp={true}
                />
                <StatsCard
                    title="Maintenance"
                    value={stats.maintenance.toString()}
                    icon={PiWarning}
                    color="cyan"
                    trend="Needs Attention"
                />
                <StatsCard
                    title="Retired"
                    value={stats.retired.toString()}
                    icon={PiTrash}
                    color="purple"
                    trend="Disposed/Lost"
                />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-[#29258D]/20 transition-all placeholder:text-gray-400"
                        placeholder="Search assets by name, tag, or serial..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleRunDepreciation}
                        disabled={isDepreciating}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isDepreciating ? "Running..." : "Run Depreciation"}
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-2 bg-[#29258D] text-white rounded-lg text-sm font-medium hover:bg-[#29258D]/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <PiPlus className="text-lg" />
                        Add New Asset
                    </button>
                </div>
            </div>

            {/* Asset List */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Asset Details</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Location</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Value</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Purchase Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {assets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <PiPackage className="text-4xl text-gray-300" />
                                            <p>No assets found. Create your first asset to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                assets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[#29258D]/5 flex items-center justify-center text-[#29258D]">
                                                    <PiPackage className="text-lg" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{asset.name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <PiTag className="text-[10px]" />
                                                        {asset.assetTag || asset.serialNumber || "No Tag"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${asset.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    asset.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex flex-col">
                                                <span>{asset.location}</span>
                                                {asset.assignedTo && (
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <PiUser className="text-[10px]" /> {asset.assignedTo.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-900">
                                            ${asset.purchasePrice.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(asset.purchaseDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                                            >
                                                <PiTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Asset Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-bold text-gray-900">Add New Asset</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                <PiX />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Asset Name</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-[#29258D] transition-all"
                                        placeholder="e.g. MacBook Pro 16"
                                        value={newAsset.name}
                                        onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Category</label>
                                    <div className="relative">
                                        <div
                                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#29258D] transition-all"
                                        >
                                            <span className={`text-sm ${newAsset.category ? "text-gray-900" : "text-gray-400"}`}>
                                                {newAsset.category || "Select Category"}
                                            </span>
                                            <PiCaretDown className="text-gray-400 text-xs" />
                                        </div>
                                        {isCategoryOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
                                                <div className="relative w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-sm z-50 p-2">
                                                    <div className="relative mb-2">
                                                        <PiMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                                        <input
                                                            autoFocus
                                                            className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#29258D]"
                                                            placeholder="Search..."
                                                            value={categorySearch}
                                                            onChange={e => setCategorySearch(e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                                                        {filteredCategories.length > 0 ? (
                                                            filteredCategories.map(cat => (
                                                                <button
                                                                    key={cat}
                                                                    onClick={() => {
                                                                        setNewAsset({ ...newAsset, category: cat });
                                                                        setIsCategoryOpen(false);
                                                                        setCategorySearch("");
                                                                    }}
                                                                    className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${newAsset.category === cat ? 'bg-[#29258D]/5 text-[#29258D] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                                >
                                                                    {cat}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-2 py-2 text-xs text-gray-400 text-center">
                                                                No categories found
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Purchase Price ($)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-[#29258D] transition-all"
                                        placeholder="0.00"
                                        value={newAsset.purchasePrice}
                                        onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <DatePicker
                                            label="Purchase Date"
                                            value={newAsset.purchaseDate ? new Date(newAsset.purchaseDate) : undefined}
                                            onChange={(date) => setNewAsset({ ...newAsset, purchaseDate: date.toISOString().split("T")[0] })}
                                            placeholder="Select purchase date"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Serial Number</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-[#29258D] transition-all"
                                        placeholder="Optional"
                                        value={newAsset.serialNumber}
                                        onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Asset Tag</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-[#29258D] transition-all"
                                        placeholder="Optional"
                                        value={newAsset.assetTag}
                                        onChange={(e) => setNewAsset({ ...newAsset, assetTag: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Location</label>
                                <input
                                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-[#29258D] transition-all"
                                    placeholder="e.g. Headquarters - Floor 2"
                                    value={newAsset.location}
                                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4">Valuation & Depreciation</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Depreciation Method</label>
                                        <div className="relative">
                                            <div
                                                onClick={() => setIsDepreciationOpen(!isDepreciationOpen)}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#29258D] transition-all"
                                            >
                                                <span className="text-sm text-gray-900">
                                                    {newAsset.depreciationMethod === "NONE" ? "None" :
                                                        newAsset.depreciationMethod === "STRAIGHT_LINE" ? "Straight Line" :
                                                            newAsset.depreciationMethod === "DECLINING_BALANCE" ? "Declining Balance" : "Select Method"}
                                                </span>
                                                <PiCaretDown className="text-gray-400 text-xs" />
                                            </div>
                                            {isDepreciationOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsDepreciationOpen(false)} />
                                                    <div className="relative w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-sm z-50 p-2">
                                                        <div className="space-y-0.5">
                                                            {[
                                                                { value: "NONE", label: "None" },
                                                                { value: "STRAIGHT_LINE", label: "Straight Line" },
                                                                { value: "DECLINING_BALANCE", label: "Declining Balance" }
                                                            ].map(option => (
                                                                <button
                                                                    key={option.value}
                                                                    onClick={() => {
                                                                        setNewAsset({ ...newAsset, depreciationMethod: option.value });
                                                                        setIsDepreciationOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${newAsset.depreciationMethod === option.value ? 'bg-[#29258D]/5 text-[#29258D] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                                >
                                                                    {option.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {newAsset.depreciationMethod !== "NONE" && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Useful Life (Years)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-[#29258D] transition-all"
                                                    placeholder="e.g. 5"
                                                    value={newAsset.usefulLifeYears}
                                                    onChange={(e) => setNewAsset({ ...newAsset, usefulLifeYears: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Salvage Value ($)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-[#29258D] transition-all"
                                                    placeholder="0.00"
                                                    value={newAsset.salvageValue}
                                                    onChange={(e) => setNewAsset({ ...newAsset, salvageValue: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Depreciation Rate (%)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-[#29258D] transition-all"
                                                    placeholder="e.g. 20"
                                                    value={newAsset.depreciationRate}
                                                    onChange={(e) => setNewAsset({ ...newAsset, depreciationRate: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-[#29258D] text-white text-sm font-medium rounded-lg hover:bg-[#29258D]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <PiCheckCircle /> Save Asset
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
