'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { SouthSudanReceiptTemplate } from '@/components/finance-studio/SouthSudanReceiptTemplate';
import { StudioDatePicker } from '@/components/finance-studio/StudioDatePicker';
import { PiFloppyDisk, PiArrowLeft, PiPlus, PiTrash } from 'react-icons/pi';
import { useSearchParams, useRouter } from 'next/navigation';
import { getPaymentDetailsForReceipt, getRequisitionDetailsForReceipt, getInvoiceDetailsForReceipt, getExpenseDetailsForReceipt } from '@/app/actions/receipt-studio';
import { utils, writeFile } from 'xlsx';
import { pdf } from '@react-pdf/renderer';
import { VoucherPDF } from '@/components/finance-studio/VoucherPDF';

// Input components matching Finance Studio style
const InputLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-0.5 uppercase tracking-wider">{children}</label>
);

const TextInput = ({ value, onChange, placeholder, className, ...props }: any) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium shadow-sm hover:border-slate-600 studio-input ${className || ''}`}
        style={{ color: '#ffffff', backgroundColor: '#1e293b', caretColor: '#ffffff' }}
        placeholder={placeholder}
        {...props}
    />
);

function ReceiptStudioContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentId = searchParams.get('paymentId');
    const requisitionId = searchParams.get('requisitionId');
    const invoiceId = searchParams.get('invoiceId');
    const expenseId = searchParams.get('expenseId');
    const [isLoading, setIsLoading] = useState(false);

    const [receiptData, setReceiptData] = useState({
        receiptNo: 'VCH-2026-8892',
        date: new Date(),
        amount: 4250.00,
        beneficiary: {
            name: 'TechFlow Systems Inc.',
            address: '45 Innovation Blvd\nSan Francisco, CA'
        },
        paymentMode: 'Wire Transfer',
        paymentRef: 'TRX-998273',
        items: [
            {
                description: 'Platform Subscription',
                subtext: 'Enterprise Tier - Q1 2026',
                date: new Date(),
                amount: 3000.00
            },
            {
                description: 'Onboarding & Setup',
                subtext: 'One-time professional fee',
                date: new Date(),
                amount: 1250.00
            }
        ],
        approvals: {
            requestedBy: 'Sarah Jenkins',
            authorizedBy: 'James K.',
            paidBy: '',
            receivedBy: ''
        }
    });

    useEffect(() => {
        if (paymentId) {
            setIsLoading(true);
            getPaymentDetailsForReceipt(paymentId).then((data) => {
                if (data) {
                    setReceiptData({
                        ...data,
                        items: data.items.map((item: any) => ({ ...item, date: new Date(item.date) })),
                        date: new Date(data.date)
                    });
                }
                setIsLoading(false);
            });
        } else if (requisitionId) {
            setIsLoading(true);
            getRequisitionDetailsForReceipt(requisitionId).then((data) => {
                if (data) {
                    setReceiptData({
                        ...data,
                        items: data.items.map((item: any) => ({ ...item, date: new Date(item.date) })),
                        date: new Date(data.date)
                    });
                }
                setIsLoading(false);
            });
        } else if (invoiceId) {
            setIsLoading(true);
            getInvoiceDetailsForReceipt(invoiceId).then((data) => {
                if (data) {
                    setReceiptData({
                        ...data,
                        items: data.items.map((item: any) => ({ ...item, date: new Date(item.date) })),
                        date: new Date(data.date)
                    });
                }
                setIsLoading(false);
            });
        } else if (expenseId) {
            setIsLoading(true);
            getExpenseDetailsForReceipt(expenseId).then((data) => {
                if (data) {
                    setReceiptData({
                        ...data,
                        items: data.items.map((item: any) => ({ ...item, date: new Date(item.date) })),
                        date: new Date(data.date)
                    });
                }
                setIsLoading(false);
            });
        }
    }, [paymentId, requisitionId, invoiceId, expenseId]);

    const handleAddItem = () => {
        setReceiptData(prev => ({
            ...prev,
            items: [...prev.items, {
                description: 'New Item',
                subtext: '',
                date: new Date(),
                amount: 0
            }]
        }));
    };

    const handleRemoveItem = (index: number) => {
        setReceiptData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems: any = [...receiptData.items];
        newItems[index][field] = value;
        setReceiptData({ ...receiptData, items: newItems });
    };

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
                
                .studio-input {
                    color: #ffffff !important;
                    background-color: #1e293b !important;
                    -webkit-text-fill-color: #ffffff !important;
                    border-color: #334155 !important;
                }
                .studio-input::placeholder {
                    color: #94a3b8 !important;
                    -webkit-text-fill-color: #94a3b8 !important;
                }
                
                @media screen {
                    .studio-workspace {
                        background-color: #020617;
                        background-image: radial-gradient(#334155 1px, transparent 1px);
                        background-size: 20px 20px;
                    }
                }
                
                @media print {
                    @page {
                        size: A4;
                        margin: 0 !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        visibility: hidden !important;
                        background: white !important;
                    }
                    .print-container-wrapper {
                        visibility: visible !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        transform: none !important;
                        box-shadow: none !important;
                        min-height: 297mm !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .print-container-wrapper * {
                        visibility: visible !important;
                    }
                }
                
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
                    -webkit-text-fill-color: white !important;
                    transition: background-color 5000s ease-in-out 0s;
                }
            `}</style>

            {/* LEFT SIDEBAR CONTROLS */}
            <div className="w-[420px] bg-slate-900 border-r border-slate-800 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-20 h-full print:hidden">

                {/* Header */}
                <div className="p-4 bg-slate-900 shrink-0 border-b border-slate-800">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 mb-4 text-[10px] font-bold text-slate-500 hover:text-white transition-colors group"
                    >
                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:bg-emerald-600 group-hover:border-emerald-500 transition-all">
                            <PiArrowLeft className="text-sm" />
                        </div>
                        Back to Dashboard
                    </button>

                    <div>
                        <h1 className="text-sm font-bold text-white">Voucher Studio</h1>
                        <p className="text-[10px] text-slate-400 font-medium">Create & Issue Official Disbursement Vouchers</p>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto px-6 pt-6 pb-64 space-y-8 custom-scrollbar">

                    {/* General Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">Voucher Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel>Voucher No</InputLabel>
                                <TextInput
                                    value={receiptData.receiptNo}
                                    onChange={(e: any) => setReceiptData({ ...receiptData, receiptNo: e.target.value })}
                                />
                            </div>
                            <div>
                                <InputLabel>Date</InputLabel>
                                <StudioDatePicker
                                    value={receiptData.date}
                                    onChange={(date: Date) => setReceiptData({ ...receiptData, date })}
                                    align="right"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Beneficiary */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">Beneficiary</h3>
                        <div>
                            <InputLabel>Name</InputLabel>
                            <TextInput
                                value={receiptData.beneficiary.name}
                                onChange={(e: any) => setReceiptData({ ...receiptData, beneficiary: { ...receiptData.beneficiary, name: e.target.value } })}
                            />
                        </div>
                        <div>
                            <InputLabel>Address</InputLabel>
                            <textarea
                                value={receiptData.beneficiary.address}
                                onChange={(e: any) => setReceiptData({ ...receiptData, beneficiary: { ...receiptData.beneficiary, address: e.target.value } })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium shadow-sm hover:border-slate-600 min-h-[80px] resize-none"
                            />
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">Payment Info</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel>Mode</InputLabel>
                                <TextInput
                                    value={receiptData.paymentMode}
                                    onChange={(e: any) => setReceiptData({ ...receiptData, paymentMode: e.target.value })}
                                />
                            </div>
                            <div>
                                <InputLabel>Reference</InputLabel>
                                <TextInput
                                    value={receiptData.paymentRef}
                                    onChange={(e: any) => setReceiptData({ ...receiptData, paymentRef: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h3 className="text-xs font-bold text-slate-300">Line Items</h3>
                            <button onClick={handleAddItem} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1 transition-all font-bold uppercase tracking-wider">
                                <PiPlus /> Add
                            </button>
                        </div>

                        <div className="space-y-3">
                            {receiptData.items.map((item, idx) => (
                                <div key={idx} className="bg-slate-800/50 border border-slate-800 rounded-lg p-3 space-y-3 relative group">
                                    <button
                                        onClick={() => handleRemoveItem(idx)}
                                        className="absolute top-2 right-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <PiTrash />
                                    </button>

                                    <div className="pr-6">
                                        <InputLabel>Description</InputLabel>
                                        <TextInput
                                            value={item.description}
                                            onChange={(e: any) => handleItemChange(idx, 'description', e.target.value)}
                                            placeholder="Item Name"
                                            className="mb-2"
                                        />
                                        <TextInput
                                            value={item.subtext}
                                            onChange={(e: any) => handleItemChange(idx, 'subtext', e.target.value)}
                                            placeholder="Subtext (optional)"
                                            className="text-xs py-2 bg-slate-900 border-slate-800"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <InputLabel>Amount</InputLabel>
                                            <input
                                                type="number"
                                                value={item.amount}
                                                onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                style={{ color: '#ffffff', backgroundColor: '#0f172a' }}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel>Date</InputLabel>
                                            <StudioDatePicker
                                                value={item.date}
                                                onChange={(date: Date) => handleItemChange(idx, 'date', date)}
                                                align="right"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Approvals */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">Signatories</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel>Requested By</InputLabel>
                                <TextInput
                                    value={receiptData.approvals.requestedBy}
                                    onChange={(e: any) => setReceiptData({ ...receiptData, approvals: { ...receiptData.approvals, requestedBy: e.target.value } })}
                                />
                            </div>
                            <div>
                                <InputLabel>Authorized By</InputLabel>
                                <TextInput
                                    value={receiptData.approvals.authorizedBy}
                                    onChange={(e: any) => setReceiptData({ ...receiptData, approvals: { ...receiptData.approvals, authorizedBy: e.target.value } })}
                                />
                            </div>
                            <div>
                                <InputLabel>Paid By</InputLabel>
                                <TextInput
                                    value={receiptData.approvals.paidBy}
                                    onChange={(e: any) => setReceiptData({ ...receiptData, approvals: { ...receiptData.approvals, paidBy: e.target.value } })}
                                />
                            </div>
                            <div>
                                <InputLabel>Received By</InputLabel>
                                <TextInput
                                    value={receiptData.approvals.receivedBy}
                                    onChange={(e: any) => setReceiptData({ ...receiptData, approvals: { ...receiptData.approvals, receivedBy: e.target.value } })}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* BOTTOM ACTIONS - Matching Finance Studio exactly */}
                <div className="p-5 border-t border-slate-800 bg-slate-900 shrink-0 grid grid-cols-2 gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.2)] print:hidden">
                    <button
                        onClick={() => {
                            const wb = utils.book_new();
                            const data = receiptData.items.map(item => ({
                                Description: item.description,
                                Subtext: item.subtext,
                                Amount: item.amount,
                                Date: item.date.toLocaleDateString()
                            }));
                            const ws = utils.json_to_sheet(data);
                            utils.book_append_sheet(wb, ws, "Voucher Items");
                            writeFile(wb, `Draft_${receiptData.receiptNo}.xlsx`);
                        }}
                        className="flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-2.5 rounded-lg border border-slate-700 hover:bg-slate-700 hover:-translate-y-0.5 transition-all text-xs"
                    >
                        <PiFloppyDisk className="text-base" /> Save Draft (Short Form)
                    </button>
                    <button
                        onClick={async (e) => {
                            const btn = e.currentTarget;
                            const originalText = btn.innerHTML;

                            try {
                                btn.innerHTML = 'Generating High-Fidelity PDF...';
                                btn.disabled = true;

                                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                                const MyDocument = <VoucherPDF data={receiptData} baseUrl={origin} />;

                                const blob = await pdf(MyDocument).toBlob();
                                if (!blob) throw new Error('PDF Generation returned empty blob');

                                const url = URL.createObjectURL(blob);
                                window.open(url, '_blank');

                                btn.innerHTML = originalText;
                                btn.disabled = false;
                            } catch (err: any) {
                                console.error('PDF Error:', err);
                                alert(`Failed to generate high-fidelity PDF: ${err.message || 'Unknown Error'}. Falling back to native print.`);
                                window.print();
                                btn.innerHTML = originalText;
                                btn.disabled = false;
                            }
                        }}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2.5 rounded-lg shadow-lg border border-indigo-500 hover:bg-indigo-700 hover:border-indigo-400 hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all text-xs"
                    >
                        <img src="/adobe.png" alt="PDF" className="w-4 h-4 object-contain" /> Download PDF
                    </button>
                </div>
            </div>

            {/* PREVIEW AREA */}
            <div className="flex-1 overflow-auto studio-workspace relative print:bg-white flex flex-col items-center print:block print:overflow-visible">
                <div className="w-full h-full p-12 flex justify-center items-start print:p-0 print:m-0 overflow-y-auto print:overflow-visible">
                    <div className="preview-canvas bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-10 print:shadow-none print:m-0 print-container-wrapper rounded-sm transition-transform duration-300 print:w-full print:h-full print:transform-none"
                        style={{
                            width: '210mm',
                            minHeight: '297mm',
                            transform: 'scale(0.85)',
                            transformOrigin: 'top center'
                        }}>
                        <SouthSudanReceiptTemplate {...receiptData} />
                    </div>
                </div>
            </div>

        </div>
    );
}

export default function ReceiptStudioPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">Loading Studio...</div>}>
            <ReceiptStudioContent />
        </Suspense>
    );
}
