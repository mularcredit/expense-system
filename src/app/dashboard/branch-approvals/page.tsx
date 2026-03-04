"use client";

import { useState, useEffect } from "react";
import { PiCheckCircle, PiXCircle, PiArrowsCounterClockwise, PiCurrencyDollar, PiBuildings, PiSpinner, PiWarning, PiCheck, PiX, PiClock } from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface Requisition {
    id: string; title: string; description: string; amount: number; currency: string;
    status: string; createdAt: string;
    user: { id: string; name: string; email: string };
    branchRef: { id: string; name: string; code: string; region: { name: string } };
    approvals: any[];
    items: any[];
}

export default function BranchApprovalsPage() {
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Requisition | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionForm, setActionForm] = useState({ comments: "", recommendedAmount: "" });
    const [activeAction, setActiveAction] = useState<"APPROVE" | "REJECT" | "RECOMMEND_ADJUSTMENT" | null>(null);

    useEffect(() => { fetchRequisitions(); }, []);

    const fetchRequisitions = async () => {
        setLoading(true);
        const res = await fetch("/api/branch-approvals");
        if (res.ok) { const d = await res.json(); setRequisitions(d.requisitions || []); }
        setLoading(false);
    };

    const submitAction = async () => {
        if (!selected || !activeAction) return;
        if (activeAction === "RECOMMEND_ADJUSTMENT" && !actionForm.recommendedAmount) return;
        setActionLoading(true);
        const res = await fetch("/api/branch-approvals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requisitionId: selected.id,
                action: activeAction,
                comments: actionForm.comments,
                recommendedAmount: actionForm.recommendedAmount ? parseFloat(actionForm.recommendedAmount) : undefined
            })
        });
        setActionLoading(false);
        if (res.ok) {
            setSelected(null); setActiveAction(null); setActionForm({ comments: "", recommendedAmount: "" });
            fetchRequisitions();
        }
    };

    const statusColor = (s: string) => {
        if (s === "PENDING" || s === "PENDING_RM") return "text-amber-600 bg-amber-50 border-amber-200";
        if (s === "APPROVED") return "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (s === "REJECTED") return "text-rose-600 bg-rose-50 border-rose-200";
        return "text-gray-600 bg-gray-50 border-gray-200";
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-12 font-sans">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <PiCheckCircle className="text-[#29258D]" /> Branch Approvals
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">{requisitions.length} pending requisition{requisitions.length !== 1 ? "s" : ""} from your branches</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><PiSpinner className="text-[#29258D] text-4xl animate-spin" /></div>
            ) : requisitions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <PiCheckCircle className="text-3xl text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium">No pending branch requisitions</p>
                    <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requisitions.map(req => (
                        <motion.div key={req.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#29258D]/30 transition-all hover:shadow-md hover:shadow-indigo-500/5 group">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wide ${statusColor(req.status)}`}>{req.status.replace(/_/g, " ")}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded border bg-gray-100 text-gray-500 border-gray-200 font-mono tracking-wider">{req.branchRef?.code}</span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium"><PiClock className="text-[11px]" />{format(new Date(req.createdAt), "dd MMM yyyy")}</span>
                                    </div>
                                    <h3 className="text-gray-900 font-bold text-base truncate group-hover:text-[#29258D] transition-colors">{req.title}</h3>
                                    <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-relaxed">{req.description}</p>
                                    <div className="flex items-center gap-5 mt-3 text-sm">
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <PiBuildings className="text-[#06B6D4] text-lg" />
                                            <span className="font-medium text-gray-700">{req.branchRef?.name}</span>
                                            <span className="text-gray-400">— {req.branchRef?.region?.name}</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <span className="text-xs">by</span>
                                            <span className="font-medium text-gray-700">{req.user?.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 bg-gray-50 p-3 rounded-lg border border-gray-100 min-w-[120px]">
                                    <div className="text-xs text-gray-500 mb-0.5 font-medium uppercase tracking-wider">Amount</div>
                                    <div className="text-xl font-bold text-[#29258D]">{req.currency} {req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div className="text-[11px] text-gray-400 mt-1">{req.items?.length || 0} item{req.items?.length !== 1 ? "s" : ""}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                                <button onClick={() => { setSelected(req); setActiveAction("APPROVE"); }}
                                    className="flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-medium transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200">
                                    <PiCheck className="text-lg" /> Approve
                                </button>
                                <button onClick={() => { setSelected(req); setActiveAction("RECOMMEND_ADJUSTMENT"); }}
                                    className="flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-medium transition-all bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200">
                                    <PiArrowsCounterClockwise className="text-lg" /> Recommend Adjustment
                                </button>
                                <button onClick={() => { setSelected(req); setActiveAction("REJECT"); }}
                                    className="flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-medium transition-all bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border border-rose-200">
                                    <PiX className="text-lg" /> Reject
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            <AnimatePresence>
                {selected && activeAction && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-gray-900 font-bold text-xl flex items-center gap-2">
                                    {activeAction === "APPROVE" && <><PiCheck className="text-emerald-500" /> Approve Requisition</>}
                                    {activeAction === "REJECT" && <><PiX className="text-rose-500" /> Reject Requisition</>}
                                    {activeAction === "RECOMMEND_ADJUSTMENT" && <><PiWarning className="text-amber-500" /> Recommend Adjustment</>}
                                </h2>
                                <button onClick={() => { setSelected(null); setActiveAction(null); }} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"><PiX className="text-lg" /></button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-5 border border-gray-200 flex justify-between items-center">
                                <div className="min-w-0 pr-4">
                                    <p className="text-gray-900 font-semibold text-sm truncate">{selected.title}</p>
                                    <p className="text-gray-500 text-xs mt-0.5 truncate">{selected.branchRef?.name}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[#29258D] font-bold">{selected.currency} {selected.amount.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {activeAction === "RECOMMEND_ADJUSTMENT" && (
                                    <div>
                                        <label className="text-gray-700 font-medium text-sm mb-1.5 block">Recommended Amount ({selected.currency}) <span className="text-rose-500">*</span></label>
                                        <input type="number" value={actionForm.recommendedAmount} onChange={e => setActionForm(p => ({ ...p, recommendedAmount: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] transition-all"
                                            placeholder={`Max: ${selected.amount}`} max={selected.amount} />
                                    </div>
                                )}
                                <div>
                                    <label className="text-gray-700 font-medium text-sm mb-1.5 block">
                                        {activeAction === "REJECT" ? "Reason for rejection" : "Comments"} {activeAction === "REJECT" ? <span className="text-rose-500">*</span> : <span className="text-gray-400 font-normal">(optional)</span>}
                                    </label>
                                    <textarea value={actionForm.comments} onChange={e => setActionForm(p => ({ ...p, comments: e.target.value }))} rows={3}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#29258D]/20 focus:border-[#29258D] resize-none transition-all"
                                        placeholder="Add your notes..." />
                                </div>

                                <div className="pt-2">
                                    <button onClick={submitAction} disabled={actionLoading || (activeAction === "RECOMMEND_ADJUSTMENT" && !actionForm.recommendedAmount) || (activeAction === "REJECT" && !actionForm.comments)}
                                        className={`w-full flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 shadow h-11 px-4 py-2 text-white
                                        ${activeAction === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700"
                                                : activeAction === "REJECT" ? "bg-rose-600 hover:bg-rose-700"
                                                    : "bg-amber-500 hover:bg-amber-600"}`}>
                                        {actionLoading ? <PiSpinner className="animate-spin text-lg mr-2" /> : activeAction === "APPROVE" ? <PiCheck className="text-lg mr-2" /> : activeAction === "REJECT" ? <PiX className="text-lg mr-2" /> : <PiArrowsCounterClockwise className="text-lg mr-2" />}
                                        {actionLoading ? "Processing..." : activeAction === "APPROVE" ? "Confirm Approval" : activeAction === "REJECT" ? "Confirm Rejection" : "Send Adjustment Request"}
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
