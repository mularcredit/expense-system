"use client";

import { useState, useEffect } from "react";
import { PiGlobe, PiPlus, PiBuildings, PiUsers, PiPencil, PiX, PiCheck, PiSpinner } from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";

interface Region { id: string; name: string; code: string; isActive: boolean; branches: { id: string; name: string; code: string }[]; }
interface User { id: string; name: string; email: string; role: string; }

export default function RegionsPage() {
    const [regions, setRegions] = useState<Region[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", code: "", managerId: "" });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const [rRes, uRes] = await Promise.all([fetch("/api/regions"), fetch("/api/team")]);
        if (rRes.ok) { const d = await rRes.json(); setRegions(d.regions || []); }
        if (uRes.ok) { const d = await uRes.json(); setUsers(d.users || d.members || []); }
        setLoading(false);
    };

    const saveRegion = async () => {
        if (!form.name || !form.code) return;
        setSaving(true);
        const res = await fetch("/api/regions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        setSaving(false);
        if (res.ok) { setShowModal(false); setForm({ name: "", code: "", managerId: "" }); fetchData(); }
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-12 font-sans">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <PiGlobe className="text-[#29258D]" /> Regions
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">{regions.length} regions configured</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow h-10 px-4 py-2 bg-[#29258D] text-white hover:bg-[#29258D]/90">
                    <PiPlus className="mr-2 text-lg" /> New Region
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><PiSpinner className="text-[#29258D] text-4xl animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regions.map(r => (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#29258D]/30 transition-all hover:shadow-md hover:shadow-indigo-500/5 group cursor-pointer relative">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border tracking-wider text-gray-500 bg-gray-100 border-gray-200">{r.code}</span>
                                    </div>
                                    <h3 className="text-gray-900 font-semibold text-lg group-hover:text-[#29258D] transition-colors">{r.name}</h3>
                                </div>
                                <button className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 flex items-center justify-center text-lg transition-all border border-transparent hover:border-indigo-100">
                                    <PiPencil />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <PiBuildings className="text-gray-400 text-lg" />
                                    <span>{r.branches?.length || 0} branches</span>
                                </div>
                            </div>
                            {r.branches?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
                                    {r.branches.slice(0, 4).map(b => (
                                        <span key={b.id} className="text-[10px] px-2 py-0.5 rounded border bg-gray-50 text-gray-500 border-gray-200 tracking-wide font-mono">{b.code}</span>
                                    ))}
                                    {r.branches.length > 4 && <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">+{r.branches.length - 4}</span>}
                                </div>
                            )}
                        </motion.div>
                    ))}
                    {regions.length === 0 && (
                        <div className="col-span-3 flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <PiGlobe className="text-3xl text-gray-400" />
                            </div>
                            <p className="text-gray-900 font-medium whitespace-pre-wrap">No regions configured yet</p>
                            <p className="text-gray-500 text-sm mt-1">Create your first region to organize branches.</p>
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-gray-900 font-bold text-xl">New Region</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"><PiX className="text-lg" /></button>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-gray-700 font-medium text-sm mb-1.5 block">Region Name <span className="text-rose-500">*</span></label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all"
                                        placeholder="e.g. East Africa" />
                                </div>
                                <div>
                                    <label className="text-gray-700 font-medium text-sm mb-1.5 block">Region Code <span className="text-rose-500">*</span></label>
                                    <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all"
                                        placeholder="e.g. EA" />
                                </div>
                                <div>
                                    <label className="text-gray-700 font-medium text-sm mb-1.5 block">Regional Manager</label>
                                    <select value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all appearance-none cursor-pointer">
                                        <option value="">No Manager Assigned</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                    </select>
                                    <p className="text-gray-500 text-xs mt-2 bg-indigo-50 text-indigo-700 p-2 rounded-md border border-indigo-100 flex gap-2">
                                        <PiUsers className="shrink-0 mt-0.5" /> Assigning a manager will set their role to Regional Manager for this region.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button onClick={saveRegion} disabled={saving || !form.name || !form.code}
                                        className="w-full flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 shadow h-11 px-4 py-2 bg-[#29258D] text-white hover:bg-[#29258D]/90">
                                        {saving ? <PiSpinner className="animate-spin text-lg" /> : "Create Region"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
