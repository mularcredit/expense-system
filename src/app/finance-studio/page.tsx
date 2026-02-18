'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditNoteTemplate } from '@/components/finance-studio/CreditNoteTemplate';
import { PaymentReceiptTemplate } from '@/components/finance-studio/PaymentReceiptTemplate';
import { CustomerStatementTemplate, Transaction } from '@/components/finance-studio/CustomerStatementTemplate';
import { StudioDatePicker } from '@/components/finance-studio/StudioDatePicker';
import { StudioDateRangePicker } from '@/components/finance-studio/StudioDateRangePicker';
import { read, utils, writeFile } from 'xlsx';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF, CreditNotePDF, StatementPDF } from '@/components/finance-studio/VectorTemplates';
import { checkCreditNoteNumberUniqueness, getCustomersForStudio, getStatementData } from '@/app/actions/finance-studio';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, setMonth, setYear } from "date-fns";
import { PiTrash, PiPlus, PiFloppyDisk, PiFileText, PiReceipt, PiListBullets, PiArrowLeft, PiUpload, PiCaretDown, PiInfo, PiGear, PiCalendar, PiCaretLeft, PiCaretRight, PiWarningCircle, PiSortAscending } from 'react-icons/pi';

// Known airlines for quick fallback
const KNOWN_AIRLINES = [
    "Ethiopian Airlines", "Emirates", "Qatar Airways", "FlyDubai", "Kenya Airways",
    "Turkish Airlines", "EgyptAir", "Flyadeal", "Saudi Arabian Airlines",
    "RwandAir", "Uganda Airlines", "Tarco Aviation", "Badr Airlines",
    "Sudan Airways", "Air Arabia"
];

// --- UI COMPONENTS (Defined outside to prevent re-creation/focus loss) ---
const InputLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-0.5">{children}</label>
);

const TextInput = ({ value, onChange, placeholder, ...props }: any) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium shadow-sm hover:border-slate-600 studio-input"
        style={{ color: '#ffffff', backgroundColor: '#1e293b', caretColor: '#ffffff' }} // Inline override to force visibility
        placeholder={placeholder}
        {...props}
    />
);

const NumberInput = ({ value, onChange, placeholder }: any) => (
    <input
        type="number"
        value={value}
        onChange={onChange}
        className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium font-mono shadow-sm hover:border-slate-600 studio-input"
        style={{ color: '#ffffff', backgroundColor: '#1e293b', caretColor: '#ffffff' }} // Inline override to force visibility
        placeholder={placeholder}
    />
);

import { Suspense } from 'react';

// ... (keep all imports and other code same)

function FinanceStudioContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'CREDIT_NOTE' | 'RECEIPT' | 'STATEMENT'>('CREDIT_NOTE');

    // Customer Selection State
    const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isCnNumberChecking, setIsCnNumberChecking] = useState(false);
    const [cnNumberError, setCnNumberError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial Fetch of Customers and URL Params
    useEffect(() => {
        const fetchCustomers = async () => {
            const customers = await getCustomersForStudio();
            setAvailableCustomers(customers);

            // Attempt to populate customer details from ID
            const urlCustomerId = searchParams.get('customerId');
            if (urlCustomerId && customers.length > 0) {
                const match = customers.find((c: any) => c.id === urlCustomerId);
                if (match) {
                    const type = searchParams.get('type');
                    if (type === 'CREDIT_NOTE') {
                        setCreditNoteData(prev => ({
                            ...prev,
                            customer: {
                                ...prev.customer,
                                name: match.name,
                                address: match.address || '',
                                tin: match.taxId || ''
                            }
                        }));
                    }
                }
            }
        };
        fetchCustomers();

        // Handle URL Params for Prefilling
        const type = searchParams.get('type');
        const customerId = searchParams.get('customerId');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        if (type === 'STATEMENT' && customerId && fromDate && toDate) {
            setActiveTab('STATEMENT');
            // Fetch statement data
            getStatementData(customerId, fromDate, toDate).then(data => {
                if (data) {
                    setStatementData(prev => ({
                        ...prev,
                        period: `${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`,
                        customer: {
                            ...prev.customer,
                            ...data.customer
                        },
                        summary: data.summary,
                        transactions: data.transactions as Transaction[]
                    }));
                }
            });
        } else if (type === 'CREDIT_NOTE') {
            setActiveTab('CREDIT_NOTE');
            setCreditNoteData(prev => ({
                ...prev,
                cnNumber: searchParams.get('cnNumber') || prev.cnNumber,
                invoiceRef: searchParams.get('invoiceRef') || prev.invoiceRef,
                amount: parseFloat(searchParams.get('amount') || '0') || prev.amount,
                reason: searchParams.get('reason') || prev.reason,
                date: searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date(),
                customer: {
                    ...prev.customer,
                    name: searchParams.get('customerName') || prev.customer.name,
                }
            }));
        } else if (type === 'RECEIPT') {
            setActiveTab('RECEIPT');
            const amount = parseFloat(searchParams.get('originalAmount') || '0');
            setReceiptData(prev => ({
                ...prev,
                receiptNo: searchParams.get('transactionRef') ? `REC-${searchParams.get('transactionRef')}` : prev.receiptNo,
                receivedFrom: searchParams.get('receivedFrom') || prev.receivedFrom,
                paymentMethod: searchParams.get('paymentMethod') || prev.paymentMethod,
                transactionRef: searchParams.get('transactionRef') || prev.transactionRef,
                originalAmount: amount || prev.originalAmount,
                creditNoteApplied: amount || prev.creditNoteApplied,
                adjustedAmountDue: 0,
                notes: searchParams.get('transactionRef') ? `Applied Credit Note: ${searchParams.get('transactionRef')}` : prev.notes
            }));
        }

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchParams]);

    // --- STATE FOR CREDIT NOTE ---
    const [creditNoteData, setCreditNoteData] = useState({

        cnNumber: `CN-${format(new Date(), 'yyyyMMdd')}-001`,
        invoiceRef: '',
        amount: 0,
        reason: '',
        date: new Date(),
        customer: {
            name: '',
            address: '',
            tin: ''
        }
    });

    // --- STATE FOR PAYMENT RECEIPT ---
    const [receiptData, setReceiptData] = useState({
        receiptNo: `REC-${format(new Date(), 'yyyyMMdd')}-001`,
        receiptDate: new Date(),
        currency: 'USD',
        receivedFrom: '',
        paymentMethod: 'Bank Transfer',
        transactionRef: '',
        paymentDate: new Date(),
        invoiceNumber: '',
        serviceType: '',
        billingPeriod: '',
        originalAmount: 0,
        creditNoteApplied: 0,
        adjustedAmountDue: 0,
        amountPaid: 0,
        notes: ''
    });

    // --- STATE FOR CUSTOMER STATEMENT ---
    const [statementData, setStatementData] = useState({
        statementNo: `SOA-${format(new Date(), 'yyyyMMdd')}-001`,
        date: new Date(),
        periodStart: null as Date | null,
        periodEnd: null as Date | null,
        customer: {
            name: '',
            group: '',
            country: '',
            accountType: ''
        },
        summary: {
            openingBalance: 0,
            totalCharges: 0,
            totalPayments: 0,
            outstandingBalance: 0
        },
        transactions: [] as Transaction[],
        notes: [
            'This statement provides a detailed summary of your account activity for the specified period.',
            'Please review all transactions and contact our finance department for any discrepancies.',
            'Outstanding balances are due upon receipt of this statement.'
        ]
    });

    // --- UNIQUENESS CHECK ---
    useEffect(() => {
        if (activeTab !== 'CREDIT_NOTE' || !creditNoteData.cnNumber) return;

        const checkUniqueness = async () => {
            // Don't warn if it's the number passed from the URL (likely the one we just created)
            const urlCnNumber = searchParams.get('cnNumber');
            if (creditNoteData.cnNumber === urlCnNumber) {
                setCnNumberError(null);
                return;
            }

            setIsCnNumberChecking(true);
            const result = await checkCreditNoteNumberUniqueness(creditNoteData.cnNumber);
            setIsCnNumberChecking(false);

            if (result.exists) {
                setCnNumberError("This Credit Note number is already in use.");
            } else {
                setCnNumberError(null);
            }
        };

        const timer = setTimeout(checkUniqueness, 500);
        return () => clearTimeout(timer);
    }, [creditNoteData.cnNumber, activeTab, searchParams]);

    // --- SHARED HELPERS & COMPONENTS ---

    const recalculateStatementSummary = (transactions: Transaction[], openingBalance: number) => {
        const totalCharges = transactions.reduce((sum, tx) => sum + (tx.debit || 0), 0);
        const totalPayments = transactions.reduce((sum, tx) => sum + (tx.credit || 0), 0);
        const outstandingBalance = openingBalance + totalCharges - totalPayments;
        return { openingBalance, totalCharges, totalPayments, outstandingBalance };
    };

    const handleStatementTransactionChange = (idx: number, field: keyof Transaction, value: any) => {
        const newTransactions = [...statementData.transactions];
        newTransactions[idx] = { ...newTransactions[idx], [field]: value };
        let runningBalance = statementData.summary.openingBalance;
        newTransactions.forEach(tx => {
            const debit = parseFloat(tx.debit as any) || 0;
            const credit = parseFloat(tx.credit as any) || 0;
            runningBalance = runningBalance + debit - credit;
            tx.balance = runningBalance;
        });
        const newSummary = recalculateStatementSummary(newTransactions, statementData.summary.openingBalance);
        setStatementData({ ...statementData, transactions: newTransactions, summary: newSummary });
    };

    const addStatementTransaction = () => {
        const newTx: Transaction = {
            id: Date.now(),
            operator: 'New Description',
            invoiceRef: 'INV-NEW',
            period: 'Period',
            debit: 0,
            credit: 0,
            balance: 0
        };
        const newTransactions = [...statementData.transactions, newTx];
        const newSummary = recalculateStatementSummary(newTransactions, statementData.summary.openingBalance);
        setStatementData({ ...statementData, transactions: newTransactions, summary: newSummary });
        // Trigger recalc of balances effectively
        handleStatementTransactionChange(newTransactions.length - 1, 'balance', 0); // Hacky trigger, but safe
    }

    const removeStatementTransaction = (idx: number) => {
        const newTransactions = statementData.transactions.filter((_, i) => i !== idx);
        // Recalc
        let runningBalance = statementData.summary.openingBalance;
        newTransactions.forEach(tx => {
            const debit = parseFloat(tx.debit as any) || 0;
            const credit = parseFloat(tx.credit as any) || 0;
            runningBalance = runningBalance + debit - credit;
            tx.balance = runningBalance;
        });
        const newSummary = recalculateStatementSummary(newTransactions, statementData.summary.openingBalance);
        setStatementData({ ...statementData, transactions: newTransactions, summary: newSummary });
    }
    const sortTransactions = () => {
        const sorted = [...statementData.transactions].sort((a, b) => {
            const getDate = (d: string) => {
                const parts = d.split('/'); // Assume DD/MM/YYYY
                if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
                return new Date(d).getTime() || 0;
            };
            return getDate(a.period) - getDate(b.period);
        });

        // Update balances
        let runningBalance = statementData.summary.openingBalance;
        sorted.forEach(tx => {
            const debit = parseFloat(tx.debit as any) || 0;
            const credit = parseFloat(tx.credit as any) || 0;
            runningBalance = runningBalance + debit - credit;
            tx.balance = runningBalance;
        });

        const newSummary = recalculateStatementSummary(sorted, statementData.summary.openingBalance);
        setStatementData({ ...statementData, transactions: sorted, summary: newSummary });
    };

    // --- TEMPLATE HANDLERS ---
    const handleDownloadTemplate = () => {
        const ws = utils.json_to_sheet([
            { Description: 'Example Description', 'Reference': 'INV-001', Period: 'Jan 2026', Debit: 1000, Credit: 0 }
        ]);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Transactions");
        writeFile(wb, "Statement_Template.xlsx");
    };

    const handleUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = utils.sheet_to_json(ws);
            const newTransactions = data.map((row: any, idx) => ({
                id: Date.now() + idx,
                operator: row['Description'] || row['Operator'] || '',
                invoiceRef: row['Reference'] || row['Invoice Ref'] || '',
                period: row['Period'] || '',
                debit: row['Debit'] || 0,
                credit: row['Credit'] || 0,
                balance: 0
            }));
            const transactionsList = newTransactions as Transaction[];

            // Auto-Sort by Date
            transactionsList.sort((a, b) => {
                const getDate = (d: string) => {
                    const parts = d?.split('/') || [];
                    if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
                    return new Date(d).getTime() || 0;
                };
                return getDate(a.period) - getDate(b.period);
            });

            // Recalculate Balances
            let runningBalance = statementData.summary.openingBalance;
            transactionsList.forEach(tx => {
                const debit = parseFloat(tx.debit as any) || 0;
                const credit = parseFloat(tx.credit as any) || 0;
                runningBalance = runningBalance + debit - credit;
                tx.balance = runningBalance;
            });

            const newSummary = recalculateStatementSummary(transactionsList, statementData.summary.openingBalance);
            setStatementData({ ...statementData, transactions: transactionsList, summary: newSummary });
        };
        reader.readAsBinaryString(file);
    };



    // --- CUSTOMER AUTO-COMPLETE LOGIC ---
    const handleCustomerSelect = (customer: any) => {
        if (activeTab === 'STATEMENT') {
            setStatementData(prev => ({
                ...prev,
                customer: {
                    ...prev.customer,
                    name: customer.name,
                    country: customer.country || prev.customer.country,
                    // If DB has address/tin, we could theoretically map them if schema matched exactly
                }
            }));
        } else if (activeTab === 'CREDIT_NOTE') {
            setCreditNoteData(prev => ({
                ...prev,
                customer: {
                    ...prev.customer,
                    name: customer.name,
                    address: customer.address || prev.customer.address,
                    tin: customer.taxId || prev.customer.tin
                }
            }));
        } else if (activeTab === 'RECEIPT') {
            setReceiptData(prev => ({
                ...prev,
                receivedFrom: customer.name
            }));
        }
        setShowCustomerDropdown(false);
    };

    const renderCustomerInput = (value: string, onChange: (val: string) => void) => {
        // Filter DB customers + Known Airlines
        const filteredDB = availableCustomers.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
        const filteredKnown = KNOWN_AIRLINES.filter(a => a.toLowerCase().includes(value.toLowerCase()))
            .filter(a => !filteredDB.find(db => db.name === a)); // Avoid duplicates

        const hasSuggestions = filteredDB.length > 0 || filteredKnown.length > 0;

        return (
            <div className="relative" ref={dropdownRef}>
                <div className="relative">
                    <TextInput
                        value={value}
                        onChange={(e: any) => {
                            onChange(e.target.value);
                            setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder="Search customer..."
                    />
                    {/* Add caret to indicate dropdown capability */}
                    <div className="absolute right-3 top-2.5 text-slate-500 pointer-events-none">
                        <PiCaretDown />
                    </div>
                </div>

                {showCustomerDropdown && hasSuggestions && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar start-0">
                        {/* DB Results Section */}
                        {filteredDB.length > 0 && (
                            <div className="py-1">
                                <div className="px-3 py-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-slate-800/50 sticky top-0 backdrop-blur-sm">
                                    Saved Customers
                                </div>
                                {filteredDB.map((c, i) => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleCustomerSelect(c)}
                                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 transition-colors flex flex-col"
                                    >
                                        <span className="font-medium">{c.name}</span>
                                        <span className="text-[10px] text-slate-500">{c.city}, {c.country}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Divider if both exist */}
                        {filteredDB.length > 0 && filteredKnown.length > 0 && (
                            <div className="border-t border-slate-700 my-1"></div>
                        )}

                        {/* Known Airlines Section */}
                        {filteredKnown.length > 0 && (
                            <div className="py-1">
                                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50 sticky top-0 backdrop-blur-sm">
                                    Suggestions
                                </div>
                                {filteredKnown.map((name, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleCustomerSelect({ name })}
                                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* VERSION INDICATOR - hidden in production/print helpful for debugging */}
            <div className="fixed top-2 right-2 z-[100] text-[10px] text-slate-600 font-mono opacity-50 pointer-events-none print:hidden">v2.0 - Studio</div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
                
                /* FORCE INPUT VISIBILITY */
                .studio-input {
                    color: #ffffff !important;
                    background-color: #1e293b !important; /* slate-800 */
                    -webkit-text-fill-color: #ffffff !important;
                    border-color: #334155 !important; /* slate-700 */
                }
                .studio-input::placeholder {
                    color: #94a3b8 !important; /* slate-400 */
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
                        /* Ensure footer isn't cut off */
                        min-height: 297mm !important; /* Force full A4 height */
                        height: auto !important; 
                        overflow: visible !important;
                    }
                    .print-container-wrapper * {
                        visibility: visible !important;
                    }
                    .print-container-wrapper .flex { display: flex !important; }
                    .print-container-wrapper .grid { display: grid !important; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

                /* Autofill Fix for Dark Mode */
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
                    -webkit-text-fill-color: white !important;
                    transition: background-color 5000s ease-in-out 0s;
                }
            `}</style>

            {/* LEFT PANEL: STUDIO CONTROLS (30%) */}
            <div className="w-[420px] bg-slate-900 border-r border-slate-800 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-20 h-full print:hidden">

                {/* STUDIO HEADER */}
                <div className="p-4 bg-slate-900 shrink-0 border-b border-slate-800">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 mb-4 text-[10px] font-bold text-slate-500 hover:text-white transition-colors group"
                    >
                        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all">
                            <PiArrowLeft className="text-sm" />
                        </div>
                        Back to Dashboard
                    </button>

                    <div className="flex p-1 bg-slate-950/50 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setActiveTab('CREDIT_NOTE')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded-lg transition-all duration-200 
                            ${activeTab === 'CREDIT_NOTE' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                        >
                            <PiFileText className="text-base" /> Credit Note
                        </button>
                        <button
                            onClick={() => setActiveTab('RECEIPT')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded-lg transition-all duration-200 
                            ${activeTab === 'RECEIPT' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                        >
                            <PiReceipt className="text-base" /> Receipt
                        </button>
                        <button
                            onClick={() => setActiveTab('STATEMENT')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded-lg transition-all duration-200 
                            ${activeTab === 'STATEMENT' ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                        >
                            <PiListBullets className="text-lg" /> Statement
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE FORM AREA */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* --- CREDIT NOTE EDITOR --- */}
                    {activeTab === 'CREDIT_NOTE' && (
                        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 fade-in">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-xs font-bold text-slate-300">Document Details</h3>
                                </div>
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel>Date</InputLabel>
                                            <StudioDatePicker value={creditNoteData.date} onChange={(date) => setCreditNoteData({ ...creditNoteData, date })} />
                                        </div>
                                        <div>
                                            <InputLabel>CN Number</InputLabel>
                                            <TextInput
                                                value={creditNoteData.cnNumber}
                                                onChange={(e: any) => setCreditNoteData({ ...creditNoteData, cnNumber: e.target.value })}
                                                className={`w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all font-medium shadow-sm hover:border-slate-600 studio-input ${cnNumberError ? 'ring-2 ring-red-500/50 border-red-500' : ''
                                                    }`}
                                            />
                                            {cnNumberError && (
                                                <p className="mt-1 text-[10px] text-red-400 font-bold flex items-center gap-1">
                                                    <PiWarningCircle className="text-xs" /> {cnNumberError}
                                                </p>
                                            )}
                                            {isCnNumberChecking && (
                                                <p className="mt-1 text-[10px] text-slate-500 font-medium">Checking uniqueness...</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel>Invoice Ref</InputLabel>
                                            <TextInput value={creditNoteData.invoiceRef} onChange={(e: any) => setCreditNoteData({ ...creditNoteData, invoiceRef: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <InputLabel>Amount (USD)</InputLabel>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-bold">$</span>
                                            <input
                                                type="number"
                                                value={creditNoteData.amount || ""}
                                                onChange={(e) => setCreditNoteData({ ...creditNoteData, amount: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium font-mono shadow-sm"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <InputLabel>Reason/Description</InputLabel>
                                        <textarea
                                            rows={2}
                                            value={creditNoteData.reason}
                                            onChange={(e) => setCreditNoteData({ ...creditNoteData, reason: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium resize-none shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-xs font-bold text-slate-300">Customer Info</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <InputLabel>Customer Name</InputLabel>
                                        {renderCustomerInput(creditNoteData.customer.name, (val) => setCreditNoteData({ ...creditNoteData, customer: { ...creditNoteData.customer, name: val } }))}
                                    </div>
                                    <div>
                                        <InputLabel>Address</InputLabel>
                                        <textarea
                                            rows={3}
                                            value={creditNoteData.customer.address}
                                            onChange={(e) => setCreditNoteData({ ...creditNoteData, customer: { ...creditNoteData.customer, address: e.target.value } })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium resize-none shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel>TIN / Tax ID</InputLabel>
                                        <TextInput value={creditNoteData.customer.tin} onChange={(e: any) => setCreditNoteData({ ...creditNoteData, customer: { ...creditNoteData.customer, tin: e.target.value } })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- RECEIPT EDITOR --- */}
                    {activeTab === 'RECEIPT' && (
                        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 fade-in">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-xs font-bold text-slate-300">Receipt Details</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel>Receipt Date</InputLabel>
                                            <StudioDatePicker value={receiptData.receiptDate} onChange={(date) => setReceiptData({ ...receiptData, receiptDate: date })} />
                                        </div>
                                        <div>
                                            <InputLabel>Payment Date</InputLabel>
                                            <StudioDatePicker value={receiptData.paymentDate} onChange={(date) => setReceiptData({ ...receiptData, paymentDate: date })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel>Receipt No</InputLabel>
                                            <TextInput value={receiptData.receiptNo} onChange={(e: any) => setReceiptData({ ...receiptData, receiptNo: e.target.value })} />
                                        </div>
                                        <div>
                                            <InputLabel>Currency</InputLabel>
                                            <TextInput value={receiptData.currency} onChange={(e: any) => setReceiptData({ ...receiptData, currency: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <InputLabel>Received From</InputLabel>
                                        {renderCustomerInput(receiptData.receivedFrom, (val) => setReceiptData({ ...receiptData, receivedFrom: val }))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel>Payment Method</InputLabel>
                                            <TextInput value={receiptData.paymentMethod} onChange={(e: any) => setReceiptData({ ...receiptData, paymentMethod: e.target.value })} />
                                        </div>
                                        <div>
                                            <InputLabel>Transaction Ref</InputLabel>
                                            <TextInput value={receiptData.transactionRef} onChange={(e: any) => setReceiptData({ ...receiptData, transactionRef: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-xs font-bold text-slate-300">Invoice Linking</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <InputLabel>Invoice Number</InputLabel>
                                        <TextInput value={receiptData.invoiceNumber} onChange={(e: any) => setReceiptData({ ...receiptData, invoiceNumber: e.target.value })} />
                                    </div>
                                    <div>
                                        <InputLabel>Service Type</InputLabel>
                                        <TextInput value={receiptData.serviceType} onChange={(e: any) => setReceiptData({ ...receiptData, serviceType: e.target.value })} />
                                    </div>
                                    <div>
                                        <InputLabel>Billing Period</InputLabel>
                                        <TextInput value={receiptData.billingPeriod} onChange={(e: any) => setReceiptData({ ...receiptData, billingPeriod: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-xs font-bold text-slate-300">Financials</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <InputLabel>Original Amount</InputLabel>
                                        <NumberInput value={receiptData.originalAmount || ""} onChange={(e: any) => setReceiptData({ ...receiptData, originalAmount: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                                    </div>
                                    <div>
                                        <InputLabel>Credit Note Applied</InputLabel>
                                        <NumberInput value={receiptData.creditNoteApplied || ""} onChange={(e: any) => setReceiptData({ ...receiptData, creditNoteApplied: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                                    </div>
                                    <div>
                                        <InputLabel>Adjusted Amount Due</InputLabel>
                                        <NumberInput value={receiptData.adjustedAmountDue || ""} onChange={(e: any) => setReceiptData({ ...receiptData, adjustedAmountDue: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                                    </div>
                                    <div>
                                        <InputLabel>Total Amount Paid</InputLabel>
                                        <NumberInput value={receiptData.amountPaid || ""} onChange={(e: any) => setReceiptData({ ...receiptData, amountPaid: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- STATEMENT EDITOR --- */}
                    {activeTab === 'STATEMENT' && (
                        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 fade-in">
                            <div>
                                <div className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/10 mb-6 relative overflow-hidden group">
                                    <div className="flex items-center gap-2 relative z-10">
                                        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                            Statement Settings
                                        </h3>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed relative z-10 flex items-start gap-2">
                                        <PiInfo className="text-indigo-400 text-sm shrink-0 mt-0.5" />
                                        <span>To generate a complete history, please ensure you have selected a valid <strong className="text-indigo-300">Date Range</strong> below.</span>
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel>Statement Date</InputLabel>
                                            <StudioDatePicker value={statementData.date} onChange={(date) => setStatementData({ ...statementData, date })} />
                                        </div>
                                        <div>
                                            <InputLabel>Statement No</InputLabel>
                                            <TextInput value={statementData.statementNo} onChange={(e: any) => setStatementData({ ...statementData, statementNo: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <InputLabel>Period (Date Range)</InputLabel>
                                        <StudioDateRangePicker
                                            startDate={statementData.periodStart}
                                            endDate={statementData.periodEnd}
                                            onChange={(start, end) => setStatementData({ ...statementData, periodStart: start, periodEnd: end })}
                                            placeholder="Select period range"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-xs font-bold text-slate-300">Customer Details</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <InputLabel>Customer Name</InputLabel>
                                        {renderCustomerInput(statementData.customer.name, (val) => setStatementData({ ...statementData, customer: { ...statementData.customer, name: val } }))}
                                    </div>
                                    <div>
                                        <InputLabel>Group</InputLabel>
                                        <TextInput value={statementData.customer.group} onChange={(e: any) => setStatementData({ ...statementData, customer: { ...statementData.customer, group: e.target.value } })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel>Country</InputLabel>
                                            <TextInput value={statementData.customer.country} onChange={(e: any) => setStatementData({ ...statementData, customer: { ...statementData.customer, country: e.target.value } })} />
                                        </div>
                                        <div>
                                            <InputLabel>Account Type</InputLabel>
                                            <TextInput value={statementData.customer.accountType} onChange={(e: any) => setStatementData({ ...statementData, customer: { ...statementData.customer, accountType: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ... Transactions and Summary sections remain the same ... */}
                            <div>
                                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-slate-300">Transactions</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={sortTransactions}
                                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 hover:bg-indigo-600 rounded-lg transition-all"
                                            title="Sort Chronologically"
                                        >
                                            <PiSortAscending className="text-sm" />
                                        </button>
                                        <button
                                            onClick={addStatementTransaction}
                                            className="w-6 h-6 flex items-center justify-center text-white bg-cyan-500 rounded-full transition-all hover:scale-110 active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse hover:shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                                            title="Add Line"
                                        >
                                            <PiPlus className="text-sm font-bold" />
                                        </button>
                                        <button onClick={handleDownloadTemplate} className="text-[10px] flex items-center gap-1.5 text-slate-400 font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider" title="Download Template">
                                            <img src="/logo (2).png" alt="Template" className="w-3.5 h-3.5 object-contain" /> Template
                                        </button>
                                        <label className="text-[10px] flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider cursor-pointer">
                                            <PiUpload /> Upload
                                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleUploadTemplate} />
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {statementData.transactions.map((tx, idx) => (
                                        <div key={tx.id || idx} className="bg-slate-800 p-4 rounded-xl border border-cyan-500/30 shadow-sm relative group hover:border-cyan-400/60 transition-all">
                                            <button
                                                onClick={() => removeStatementTransaction(idx)}
                                                className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/5 rounded-lg"
                                            >
                                                <PiTrash />
                                            </button>

                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <InputLabel>Description</InputLabel>
                                                    <input type="text" value={tx.operator} onChange={(e) => handleStatementTransactionChange(idx, 'operator', e.target.value)} className="w-full text-xs bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-2 text-slate-200 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
                                                </div>
                                                <div>
                                                    <InputLabel>Reference</InputLabel>
                                                    <input type="text" value={tx.invoiceRef} onChange={(e) => handleStatementTransactionChange(idx, 'invoiceRef', e.target.value)} className="w-full text-xs bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-2 text-slate-200 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <InputLabel>Period</InputLabel>
                                                <input type="text" value={tx.period} onChange={(e) => handleStatementTransactionChange(idx, 'period', e.target.value)} className="w-full text-xs bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-2 text-slate-200 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <InputLabel>Debit</InputLabel>
                                                    <input type="number" value={tx.debit || ''} onChange={(e) => handleStatementTransactionChange(idx, 'debit', e.target.value ? parseFloat(e.target.value) : 0)} className="w-full text-xs bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-2 font-mono text-slate-300 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 outline-none" placeholder="0.00" />
                                                </div>
                                                <div>
                                                    <InputLabel>Credit</InputLabel>
                                                    <input type="number" value={tx.credit || ''} onChange={(e) => handleStatementTransactionChange(idx, 'credit', e.target.value ? parseFloat(e.target.value) : 0)} className="w-full text-xs bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-2 font-mono text-slate-300 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500 outline-none" placeholder="0.00" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-xs font-bold text-slate-300">Summary Override</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <InputLabel>Opening Balance</InputLabel>
                                        <NumberInput value={statementData.summary.openingBalance || ""} onChange={(e: any) => {
                                            const newOpening = parseFloat(e.target.value) || 0;
                                            const newSummary = recalculateStatementSummary(statementData.transactions, newOpening);
                                            setStatementData({ ...statementData, summary: newSummary });
                                        }} placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-slate-300">Notes to Customer</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {statementData.notes.map((note, idx) => (
                                            <div key={idx} className="relative group">
                                                <textarea
                                                    value={note}
                                                    onChange={(e) => {
                                                        const newNotes = [...statementData.notes];
                                                        newNotes[idx] = e.target.value;
                                                        setStatementData({ ...statementData, notes: newNotes });
                                                    }}
                                                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 font-medium resize-none shadow-sm"
                                                    rows={2}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newNotes = [...statementData.notes];
                                                        newNotes.splice(idx, 1);
                                                        setStatementData({ ...statementData, notes: newNotes });
                                                    }}
                                                    className="absolute top-1 right-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                >
                                                    <PiTrash />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setStatementData({ ...statementData, notes: [...statementData.notes, 'New note line...'] })} className="text-[10px] flex items-center gap-1.5 text-indigo-400 font-bold bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider">
                                        <PiPlus /> Add Note
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTTOM ACTIONS */}
                <div className="p-5 border-t border-slate-800 bg-slate-900 shrink-0 grid grid-cols-2 gap-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.2)] print:hidden">
                    <button
                        onClick={() => {
                            // Save as Excel Draft
                            const wb = utils.book_new();
                            let data: any[] = [];
                            let filename = "draft.xlsx";

                            if (activeTab === 'STATEMENT') {
                                data = statementData.transactions;
                                filename = `Draftv1_${statementData.statementNo}.xlsx`;
                            } else if (activeTab === 'CREDIT_NOTE') {
                                data = [{ ...creditNoteData }];
                                filename = `Draftv1_${creditNoteData.cnNumber}.xlsx`;
                            } else {
                                data = [{ ...receiptData }];
                                filename = `Draftv1_${receiptData.receiptNo}.xlsx`;
                            }

                            const ws = utils.json_to_sheet(data);
                            utils.book_append_sheet(wb, ws, "Draft Data");
                            writeFile(wb, filename);
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

                                // Prepare data with safe fallbacks and absolute URLs for images
                                const origin = typeof window !== 'undefined' ? window.location.origin : '';

                                // Select and render the correct Vector PDF
                                let MyDocument;
                                if (activeTab === 'STATEMENT') {
                                    MyDocument = <StatementPDF data={statementData} baseUrl={origin} />;
                                } else if (activeTab === 'CREDIT_NOTE') {
                                    MyDocument = <CreditNotePDF data={creditNoteData} baseUrl={origin} />;
                                } else {
                                    MyDocument = <ReceiptPDF data={receiptData} baseUrl={origin} />;
                                }

                                // Generate the PDF Blob
                                const blob = await pdf(MyDocument).toBlob();
                                if (!blob) throw new Error('PDF Generation returned empty blob');

                                const url = URL.createObjectURL(blob);

                                // Open the professional PDF viewer
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

            {/* RIGHT PANEL: LIVE PREVIEW (Original Studio Aesthetic) */}
            <div className="flex-1 overflow-auto studio-workspace relative print:bg-white flex flex-col items-center print:block print:overflow-visible">
                <div className="w-full h-full p-12 flex justify-center items-start print:p-0 print:m-0 overflow-y-auto print:overflow-visible">
                    <div className="preview-canvas bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-10 print:shadow-none print:m-0 print-container-wrapper rounded-sm transition-transform duration-300 print:w-full print:h-full print:transform-none"
                        style={{
                            width: '210mm',
                            minHeight: '297mm',
                            transform: activeTab === 'STATEMENT' ? 'scale(0.85)' : 'scale(0.85)',
                            transformOrigin: 'top center'
                        }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="print:h-full flex flex-col"
                            >
                                {activeTab === 'CREDIT_NOTE' && <CreditNoteTemplate {...creditNoteData} />}
                                {activeTab === 'RECEIPT' && <PaymentReceiptTemplate {...receiptData} />}
                                {activeTab === 'STATEMENT' && (() => {
                                    const { periodStart, periodEnd, ...rest } = statementData;
                                    const period = periodStart && periodEnd ? `${format(periodStart, 'dd MMM yyyy')} - ${format(periodEnd, 'dd MMM yyyy')}` : '';
                                    return <CustomerStatementTemplate {...rest} period={period} />;
                                })()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

        </div >
    );
}

export default function FinanceStudioPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">Loading Studio...</div>}>
            <FinanceStudioContent />
        </Suspense>
    );
}
