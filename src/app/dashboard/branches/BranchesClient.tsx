"use client";

import { useState, useEffect } from "react";
import { PiBuildings, PiPlus, PiPencil, PiTrash, PiMapPin, PiUsers, PiCheck, PiX, PiSpinner, PiUploadSimple } from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";

interface Region { id: string; name: string; code: string; branches: any[]; }
interface Branch { id: string; name: string; code: string; address?: string; regionId: string; teamLeaderId?: string; isActive: boolean; region: Region; teamLeader?: { id: string; name: string; email: string }; wallet?: { balance: number; currency: string }; }
interface User { id: string; name: string; email: string; role: string; }

export default function BranchesClient() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editBranch, setEditBranch] = useState<Branch | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeRegion, setActiveRegion] = useState<string>("all");

    const [form, setForm] = useState({ name: "", code: "", address: "", regionId: "", teamLeaderId: "" });
    const [bulkText, setBulkText] = useState("");
    const [bulkError, setBulkError] = useState("");

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const [bRes, rRes, uRes] = await Promise.all([
            fetch("/api/branches"),
            fetch("/api/regions"),
            fetch("/api/team")
        ]);
        if (bRes.ok) { const d = await bRes.json(); setBranches(d.branches || []); }
        if (rRes.ok) { const d = await rRes.json(); setRegions(d.regions || []); }
        if (uRes.ok) { const d = await uRes.json(); setUsers(d.users || d.members || []); }
        setLoading(false);
    };

    const openCreate = () => { setEditBranch(null); setForm({ name: "", code: "", address: "", regionId: "", teamLeaderId: "" }); setShowModal(true); };
    const openEdit = (b: Branch) => { setEditBranch(b); setForm({ name: b.name, code: b.code, address: b.address || "", regionId: b.regionId, teamLeaderId: b.teamLeaderId || "" }); setShowModal(true); };

    const saveBranch = async () => {
        if (!form.name || !form.code || !form.regionId) return;
        setSaving(true);
        const url = editBranch ? `/api/branches/${editBranch.id}` : "/api/branches";
        const method = editBranch ? "PATCH" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        setSaving(false);
        if (res.ok) { setShowModal(false); fetchData(); }
    };

    const deactivateBranch = async (id: string) => {
        if (!confirm("Deactivate this branch?")) return;
        await fetch(`/api/branches/${id}`, { method: "DELETE" });
        fetchData();
    };

    const saveBulk = async () => {
        setBulkError("");
        let parsed: any[] = [];
        try {
            // Try JSON first
            parsed = JSON.parse(bulkText);
        } catch {
            // Try CSV
            const lines = bulkText.trim().split("\n");
            const headers = lines[0].split(",").map(h => h.trim());
            parsed = lines.slice(1).map(line => {
                const vals = line.split(",").map(v => v.trim());
                const obj: any = {};
                headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
                return obj;
            });
        }
        if (!Array.isArray(parsed) || parsed.length === 0) { setBulkError("Could not parse input. Use JSON or CSV."); return; }
        setSaving(true);
        const res = await fetch("/api/branches/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branches: parsed }) });
        setSaving(false);
        if (res.ok) { setShowBulkModal(false); setBulkText(""); fetchData(); }
        else { const d = await res.json(); setBulkError(d.error || "Failed to import"); }
    };

    const filtered = activeRegion === "all" ? branches : branches.filter(b => b.regionId === activeRegion);

    return (
        <div className="space-y-8 animate-fade-in-up pb-12 font-sans">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <PiBuildings className="text-[#29258D]" /> Branch Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">{branches.length} branches across {regions.length} regions</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowBulkModal(true)} className="flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm h-10 px-4 py-2">
                        <PiUploadSimple className="mr-2 text-lg" /> Bulk Import
                    </button>
                    <button onClick={openCreate} className="flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 shadow h-10 px-4 py-2 bg-[#29258D] text-white hover:bg-[#29258D]/90">
                        <PiPlus className="mr-2 text-lg" /> New Branch
                    </button>
                </div>
            </div>

            {/* Region filter tabs */}
            <div className="flex gap-2 flex-wrap pb-2 border-b border-gray-100">
                <button onClick={() => setActiveRegion("all")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeRegion === "all" ? "bg-indigo-50 text-[#29258D] shadow-sm border border-indigo-100" : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-gray-200"}`}>
                    All Regions
                </button>
                {regions.map(r => (
                    <button key={r.id} onClick={() => setActiveRegion(r.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeRegion === r.id ? "bg-indigo-50 text-[#29258D] shadow-sm border border-indigo-100" : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-gray-200"}`}>
                        {r.name} <span className="ml-1 opacity-70 text-xs">({r.branches?.length || 0})</span>
                    </button>
                ))}
            </div>

            {/* Branches Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64"><PiSpinner className="text-[#29258D] text-4xl animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <PiBuildings className="text-3xl text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium">No branches found</p>
                    <p className="text-gray-500 text-sm mt-1">Create a new branch to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(b => (
                        <motion.div key={b.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#29258D]/30 transition-all hover:shadow-md hover:shadow-indigo-500/5 group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border tracking-wider text-gray-500 bg-gray-100 border-gray-200">{b.code}</span>
                                        {b.isActive ?
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">Active</span> :
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-medium">Inactive</span>
                                        }
                                    </div>
                                    <h3 className="text-gray-900 font-semibold text-lg group-hover:text-[#29258D] transition-colors">{b.name}</h3>
                                </div>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(b)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 flex items-center justify-center text-lg transition-all border border-transparent hover:border-indigo-100">
                                        <PiPencil />
                                    </button>
                                    <button onClick={() => deactivateBranch(b.id)} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center text-lg transition-all border border-transparent hover:border-rose-100">
                                        <PiTrash />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2.5 text-sm">
                                <div className="flex items-center gap-2.5 text-gray-500">
                                    <PiMapPin className="text-gray-400 text-lg" />
                                    <span className="truncate">{b.region?.name || "—"}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-gray-500">
                                    <PiUsers className="text-gray-400 text-lg" />
                                    <span className="truncate">{b.teamLeader?.name || <span className="text-gray-400 italic">No assigned leader</span>}</span>
                                </div>
                            </div>

                            {b.wallet && (
                                <div className="mt-5 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Wallet</span>
                                        <span className={`text-base font-bold ${b.wallet.balance > 0 ? "text-emerald-600" : "text-gray-700"}`}>
                                            {b.wallet.currency} {b.wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-gray-900 font-bold text-xl">{editBranch ? "Edit Branch" : "New Branch"}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"><PiX className="text-lg" /></button>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-gray-700 font-medium text-sm mb-1.5 block">Branch Name <span className="text-rose-500">*</span></label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all"
                                        placeholder="e.g. Nairobi CBD Branch" />
                                </div>
                                <div>
                                    <label className="text-gray-700 font-medium text-sm mb-1.5 block">Branch Code <span className="text-rose-500">*</span></label>
                                    <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all"
                                        placeholder="e.g. NRB-001" />
                                </div>
                                <div>
                                    <label className="text-gray-700 font-medium text-sm mb-1.5 block">Region <span className="text-rose-500">*</span></label>
                                    <select value={form.regionId} onChange={e => setForm(p => ({ ...p, regionId: e.target.value }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all appearance-none cursor-pointer">
                                        <option value="">Select region...</option>
                                        {regions.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-700 font-medium text-sm mb-1.5 block">Address</label>
                                    <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all"
                                        placeholder="Physical address" />
                                </div>
                                <div>
                                    <label className="text-gray-700 font-medium text-sm mb-1.5 block">Team Leader</label>
                                    <select value={form.teamLeaderId} onChange={e => setForm(p => ({ ...p, teamLeaderId: e.target.value }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all appearance-none cursor-pointer">
                                        <option value="">No Leader Assigned</option>
                                        {users.filter(u => !["SYSTEM_ADMIN", "FINANCE_APPROVER"].includes(u.role)).map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pt-2">
                                    <button onClick={saveBranch} disabled={saving || !form.name || !form.code || !form.regionId}
                                        className="w-full flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 shadow h-11 px-4 py-2 bg-[#29258D] text-white hover:bg-[#29258D]/90">
                                        {saving ? <PiSpinner className="animate-spin text-lg" /> : (editBranch ? "Save Changes" : "Create Branch")}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Import Modal */}
            <AnimatePresence>
                {showBulkModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-lg shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-gray-900 font-bold text-xl">Bulk Import Branches</h2>
                                <button onClick={() => { setShowBulkModal(false); setBulkError(""); }} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"><PiX className="text-lg" /></button>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">Paste a JSON array or CSV data. Required fields: <code className="text-[#29258D] bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100 font-mono text-xs">name, code, regionId</code></p>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-xs font-mono text-gray-500 overflow-x-auto">
                                {`[{"name":"Branch A","code":"BRA-001","regionId":"..."},\n {"name":"Branch B","code":"BRB-001","regionId":"..."}]`}
                            </div>

                            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8}
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] resize-none transition-all"
                                placeholder="Paste JSON or CSV here..." />

                            {bulkError && <p className="text-rose-500 font-medium text-sm mt-3 bg-rose-50 p-3 rounded-lg border border-rose-100">{bulkError}</p>}

                            <div className="pt-4 mt-2 border-t border-gray-100">
                                <button onClick={saveBulk} disabled={saving || !bulkText.trim()}
                                    className="w-full flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 shadow h-11 px-4 py-2 bg-[#29258D] text-white hover:bg-[#29258D]/90">
                                    {saving ? <PiSpinner className="animate-spin mr-2 text-lg" /> : <PiUploadSimple className="mr-2 text-lg" />}
                                    {saving ? "Importing..." : "Import Branches"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
