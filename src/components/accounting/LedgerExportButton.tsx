"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
    PiDownloadSimple, PiFileCsv, PiFilePdf,
    PiSpinner, PiX, PiFunnel, PiCheckSquare, PiSquare
} from "react-icons/pi";
import { useToast } from "@/components/ui/ToastProvider";

const ALL_STATUSES = ["POSTED", "DRAFT", "VOID"];

export function LedgerExportButton() {
    const { showToast } = useToast();
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState<"pdf" | "csv" | null>(null);

    // ── Filters ──────────────────────────────────────────────────────────────
    const [selStatuses, setSelStatuses] = useState<string[]>([...ALL_STATUSES]);
    const [searchQ, setSearchQ] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // ── Helpers ──────────────────────────────────────────────────────────────
    const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
        setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

    const resetFilters = () => {
        setSelStatuses([...ALL_STATUSES]);
        setSearchQ("");
        setDateFrom("");
        setDateTo("");
    };

    const activeFilterCount = [
        selStatuses.length < ALL_STATUSES.length,
        !!searchQ,
        !!dateFrom,
        !!dateTo,
    ].filter(Boolean).length;

    // ── Fetch + filter entries ────────────────────────────────────────────────
    const fetchEntries = async (): Promise<any[]> => {
        const params = new URLSearchParams();
        if (searchQ) params.set("q", searchQ);
        const res = await fetch(`/api/reports/ledger?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch ledger data");
        let entries: any[] = await res.json();

        // Apply client-side filters
        if (selStatuses.length < ALL_STATUSES.length) {
            entries = entries.filter(e => selStatuses.includes(e.status));
        }
        if (dateFrom) {
            const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
            entries = entries.filter(e => new Date(e.date) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
            entries = entries.filter(e => new Date(e.date) <= to);
        }
        return entries;
    };

    const filterLabel = () => {
        const parts: string[] = [];
        if (selStatuses.length < ALL_STATUSES.length) parts.push(selStatuses.join("+"));
        if (searchQ) parts.push(`"${searchQ}"`);
        if (dateFrom || dateTo) parts.push(`${dateFrom || "start"}–${dateTo || "end"}`);
        return parts.length ? parts.join(", ") : "All entries";
    };

    // ── PDF export ────────────────────────────────────────────────────────────
    const handlePDF = async () => {
        setLoading("pdf");
        setModalOpen(false);
        try {
            const entries = await fetchEntries();
            if (!entries.length) { showToast("No entries match the current filters", "error"); return; }

            const doc = new jsPDF({ orientation: "landscape" });

            doc.setFontSize(18); doc.setTextColor(41, 37, 141);
            doc.text("General Ledger Report", 14, 18);
            doc.setFontSize(8); doc.setTextColor(120);
            doc.text(`Filters: ${filterLabel()}`, 14, 25);
            doc.text(`Generated: ${new Date().toLocaleString()}   •   Entries: ${entries.length}`, 14, 30);

            // Totals summary
            let totalDebit = 0, totalCredit = 0;
            entries.forEach(e => {
                e.lines.forEach((l: any) => { totalDebit += l.debit; totalCredit += l.credit; });
            });
            doc.setFontSize(9);
            doc.setTextColor(59, 130, 246); doc.text(`Total Debits: $${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 37);
            doc.setTextColor(16, 185, 129); doc.text(`Total Credits: $${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 90, 37);

            const rows: any[][] = [];
            entries.forEach((entry: any) => {
                entry.lines.forEach((line: any, i: number) => {
                    rows.push([
                        i === 0 ? new Date(entry.date).toLocaleDateString() : "",
                        i === 0 ? (entry.reference || entry.id.slice(0, 8).toUpperCase()) : "",
                        i === 0 ? entry.description : "",
                        line.account?.code || "",
                        line.account?.name || "",
                        line.debit > 0 ? line.debit.toFixed(2) : "-",
                        line.credit > 0 ? line.credit.toFixed(2) : "-",
                        i === 0 ? entry.status : "",
                    ]);
                });
                const ed = entry.lines.reduce((s: number, l: any) => s + l.debit, 0);
                const ec = entry.lines.reduce((s: number, l: any) => s + l.credit, 0);
                rows.push(["", "", "", "", "Entry Total", ed.toFixed(2), ec.toFixed(2), ""]);
            });

            autoTable(doc, {
                startY: 43,
                head: [["Date", "Reference", "Description", "Code", "Account", "Debit", "Credit", "Status"]],
                body: rows,
                theme: "striped",
                headStyles: { fillColor: [41, 37, 141], fontSize: 8, fontStyle: "bold" },
                bodyStyles: { fontSize: 7.5 },
                alternateRowStyles: { fillColor: [248, 248, 252] },
                columnStyles: {
                    5: { halign: "right", fontStyle: "bold" },
                    6: { halign: "right", fontStyle: "bold" },
                },
                didParseCell: (data) => {
                    if (data.row.raw && (data.row.raw as any[])[4] === "Entry Total") {
                        data.cell.styles.fillColor = [237, 237, 248];
                        data.cell.styles.fontStyle = "bold";
                    }
                },
            });

            doc.save(`General_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
            showToast(`Ledger PDF exported — ${entries.length} entries`, "success");
        } catch (err: any) {
            showToast(err.message || "Failed to export PDF", "error");
        } finally { setLoading(null); }
    };

    // ── CSV export ────────────────────────────────────────────────────────────
    const handleCSV = async () => {
        setLoading("csv");
        setModalOpen(false);
        try {
            const entries = await fetchEntries();
            if (!entries.length) { showToast("No entries match the current filters", "error"); return; }

            const headers = ["Date", "Reference", "Description", "Status", "Account Code", "Account Name", "Debit", "Credit"];
            const rows: string[][] = [];
            entries.forEach((entry: any) => {
                entry.lines.forEach((line: any) => {
                    rows.push([
                        new Date(entry.date).toLocaleDateString(),
                        entry.reference || entry.id.slice(0, 8).toUpperCase(),
                        `"${(entry.description || "").replace(/"/g, '""')}"`,
                        entry.status,
                        line.account?.code || "",
                        `"${(line.account?.name || "").replace(/"/g, '""')}"`,
                        line.debit > 0 ? line.debit.toFixed(2) : "0.00",
                        line.credit > 0 ? line.credit.toFixed(2) : "0.00",
                    ]);
                });
            });

            const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `General_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click(); URL.revokeObjectURL(url);

            showToast(`Ledger CSV exported — ${entries.length} entries`, "success");
        } catch (err: any) {
            showToast(err.message || "Failed to export CSV", "error");
        } finally { setLoading(null); }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <button
                id="ledger-export-btn"
                onClick={() => setModalOpen(true)}
                disabled={!!loading}
                className="relative flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm disabled:opacity-60"
            >
                {loading ? <PiSpinner className="text-base animate-spin" /> : <PiDownloadSimple className="text-base" />}
                {loading ? "Exporting..." : "Export Report"}
                {activeFilterCount > 0 && !loading && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#29258D] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* ── Filter Modal ── */}
            {modalOpen && typeof window !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-scale-in">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <PiFunnel className="text-[#29258D]" /> Export General Ledger
                                </h2>
                                <p className="text-[11px] text-gray-400 mt-0.5">Filter entries, then choose your format</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                                <PiX className="text-lg" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-5">

                            {/* Search */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                                    Search (Reference / Description)
                                </label>
                                <input
                                    type="text"
                                    value={searchQ}
                                    onChange={e => setSearchQ(e.target.value)}
                                    placeholder="e.g. INV-001, salaries, vendor name..."
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#29258D]/30"
                                />
                            </div>

                            {/* Status toggles */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Entry Status</label>
                                <div className="flex gap-2">
                                    {ALL_STATUSES.map(s => {
                                        const on = selStatuses.includes(s);
                                        return (
                                            <button key={s} onClick={() => toggle(selStatuses, setSelStatuses, s)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${on
                                                    ? "bg-[#29258D] text-white border-[#29258D]"
                                                    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                                                {on ? <PiCheckSquare className="text-sm" /> : <PiSquare className="text-sm" />}
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Date range */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date Range (Entry Date)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-medium block mb-1">From</span>
                                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#29258D]/30" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-medium block mb-1">To</span>
                                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#29258D]/30" />
                                    </div>
                                </div>
                            </div>

                            {/* Active filter summary */}
                            {activeFilterCount > 0 && (
                                <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2.5">
                                    <p className="text-[11px] font-bold text-indigo-700">
                                        {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                                    </p>
                                    <button onClick={resetFilters} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-700 underline underline-offset-2 transition-colors">
                                        Reset all
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                            <p className="text-[11px] text-gray-400 font-medium">
                                Exports will include <span className="font-bold text-gray-700">all matching entries</span> across all pages
                            </p>
                            <div className="flex items-center gap-2">
                                <button onClick={handleCSV}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                                    <PiFileCsv className="text-base text-emerald-500" /> CSV
                                </button>
                                <button onClick={handlePDF}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#29258D] hover:bg-[#29258D]/90 transition-all shadow-sm shadow-[#29258D]/20">
                                    <PiFilePdf className="text-base" /> Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
