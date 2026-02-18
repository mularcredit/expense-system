'use client'

import { useState, useMemo } from 'react'
import { read, utils } from 'xlsx'
import {
    PiUploadSimple, PiCheckCircle, PiWarning, PiX, PiPlus,
    PiBank, PiMagnifyingGlass, PiArrowsLeftRight,
    PiCalendar, PiFileText, PiLightning, PiInfo
} from 'react-icons/pi'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface JournalLine {
    id: string
    date: string
    description: string
    reference: string
    debit: number
    credit: number
    amount: number
}

interface BankTransaction {
    id: string
    date: string
    description: string
    amount: number
    matched: boolean
    matchedLineId?: string
}

interface Props {
    cashAccountId: string
    glBalance: number
    journalLines: JournalLine[]
}

export function BankReconciliationClient({ cashAccountId, glBalance, journalLines }: Props) {
    const [step, setStep] = useState<'upload' | 'match' | 'review'>('upload')
    const [bankBalance, setBankBalance] = useState<number>(0)
    const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([])
    const [matches, setMatches] = useState<Map<string, string>>(new Map())
    const [searchBank, setSearchBank] = useState('')
    const [searchBooks, setSearchBooks] = useState('')
    const [selectedBankTx, setSelectedBankTx] = useState<string | null>(null)
    const [selectedBookLine, setSelectedBookLine] = useState<string | null>(null)

    // Upload bank statement
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result
            const wb = read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = utils.sheet_to_json(ws)

            const transactions: BankTransaction[] = data.map((row: any, index) => ({
                id: `bank-${index}`,
                date: row.Date || row.date || new Date().toISOString(),
                description: row.Description || row.description || row.Narration || 'Unknown',
                amount: parseFloat(row.Amount || row.amount || row.Debit || row.Credit || 0),
                matched: false
            }))

            setBankTransactions(transactions)
            setStep('match')
        }
        reader.readAsBinaryString(file)
    }

    // Auto-match transactions
    const autoMatch = () => {
        const newMatches = new Map<string, string>()

        bankTransactions.forEach(bankTx => {
            const match = journalLines.find(bookLine => {
                const amountMatch = Math.abs(bookLine.amount - bankTx.amount) < 0.01
                const dateMatch = new Date(bookLine.date).toDateString() === new Date(bankTx.date).toDateString()
                const notAlreadyMatched = !Array.from(newMatches.values()).includes(bookLine.id)
                return amountMatch && dateMatch && notAlreadyMatched
            })

            if (match) {
                newMatches.set(bankTx.id, match.id)
            }
        })

        setMatches(newMatches)
    }

    // Manual match
    const createMatch = () => {
        if (!selectedBankTx || !selectedBookLine) return
        const newMatches = new Map(matches)
        newMatches.set(selectedBankTx, selectedBookLine)
        setMatches(newMatches)
        setSelectedBankTx(null)
        setSelectedBookLine(null)
    }

    const unmatch = (bankTxId: string) => {
        const newMatches = new Map(matches)
        newMatches.delete(bankTxId)
        setMatches(newMatches)
    }

    // Filtered lists
    const filteredBankTx = useMemo(() => {
        return bankTransactions.filter(tx =>
            tx.description.toLowerCase().includes(searchBank.toLowerCase())
        )
    }, [bankTransactions, searchBank])

    const filteredBookLines = useMemo(() => {
        return journalLines.filter(line =>
            line.description.toLowerCase().includes(searchBooks.toLowerCase())
        )
    }, [journalLines, searchBooks])

    // Calculate reconciliation
    const matchedCount = matches.size
    const unmatchedBankCount = bankTransactions.filter(tx => !matches.has(tx.id)).length
    const unmatchedBookCount = journalLines.filter(line => !Array.from(matches.values()).includes(line.id)).length

    const unmatchedBankTotal = bankTransactions
        .filter(tx => !matches.has(tx.id))
        .reduce((sum, tx) => sum + tx.amount, 0)

    const unmatchedBookTotal = journalLines
        .filter(line => !Array.from(matches.values()).includes(line.id))
        .reduce((sum, line) => sum + line.amount, 0)

    const difference = Math.abs(unmatchedBankTotal - unmatchedBookTotal)
    const isReconciled = difference < 0.01 && unmatchedBankCount === 0 && unmatchedBookCount === 0

    return (
        <div className="space-y-6">
            {/* Explainer Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <PiInfo className="text-2xl text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">What is Bank Reconciliation?</h2>
                        <p className="text-sm text-gray-700 mb-3">
                            This tool helps you verify that your <strong>bank statement</strong> matches your <strong>accounting books</strong>.
                            You'll match each bank transaction with the corresponding entry in your books to ensure everything is accurate.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <PiBank className="text-blue-600" />
                                    <span className="text-xs font-bold text-gray-500 uppercase">Bank Statement</span>
                                </div>
                                <p className="text-xs text-gray-600">What the bank says you have</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <PiFileText className="text-indigo-600" />
                                    <span className="text-xs font-bold text-gray-500 uppercase">Your Books</span>
                                </div>
                                <p className="text-xs text-gray-600">What your accounting records show</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "flex items-center gap-3 flex-1",
                        step === 'upload' && "opacity-100",
                        step !== 'upload' && "opacity-50"
                    )}>
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                            step === 'upload' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                        )}>1</div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Upload Bank Statement</p>
                            <p className="text-xs text-gray-500">Import your bank's CSV or Excel file</p>
                        </div>
                    </div>

                    <div className="w-12 h-0.5 bg-gray-200 mx-4" />

                    <div className={cn(
                        "flex items-center gap-3 flex-1",
                        step === 'match' && "opacity-100",
                        step !== 'match' && "opacity-50"
                    )}>
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                            step === 'match' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                        )}>2</div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Match Transactions</p>
                            <p className="text-xs text-gray-500">Connect bank items to your books</p>
                        </div>
                    </div>

                    <div className="w-12 h-0.5 bg-gray-200 mx-4" />

                    <div className={cn(
                        "flex items-center gap-3 flex-1",
                        step === 'review' && "opacity-100",
                        step !== 'review' && "opacity-50"
                    )}>
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                            step === 'review' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                        )}>3</div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Review & Complete</p>
                            <p className="text-xs text-gray-500">Verify everything matches</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div className="bg-white border border-gray-200 rounded-xl p-8">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-20 h-20 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                            <PiUploadSimple className="text-4xl text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Upload Your Bank Statement</h3>
                        <p className="text-sm text-gray-600 mb-8">
                            Download your bank statement as a CSV or Excel file from your bank's website, then upload it here.
                        </p>

                        <label className="cursor-pointer">
                            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#29258D] hover:bg-[#29258D]/90 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                                <PiUploadSimple className="text-lg" />
                                Choose Bank Statement File
                            </div>
                        </label>

                        <p className="text-xs text-gray-500 mt-4">Supported formats: CSV, XLSX, XLS</p>
                    </div>
                </div>
            )}

            {/* Step 2: Match */}
            {step === 'match' && bankTransactions.length > 0 && (
                <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Bank Transactions</p>
                            <p className="text-2xl font-bold text-gray-900">{bankTransactions.length}</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Your Book Entries</p>
                            <p className="text-2xl font-bold text-gray-900">{journalLines.length}</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Matched</p>
                            <p className="text-2xl font-bold text-emerald-700">{matchedCount}</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-orange-700 uppercase mb-1">Remaining</p>
                            <p className="text-2xl font-bold text-orange-700">{unmatchedBankCount + unmatchedBookCount}</p>
                        </div>
                    </div>

                    {/* Auto-match Button */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <PiLightning className="text-2xl text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-1">Try Auto-Match First</h3>
                                    <p className="text-sm text-gray-600">We'll automatically match transactions with the same amount and date</p>
                                </div>
                            </div>
                            <Button onClick={autoMatch} className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
                                <PiLightning />
                                Auto-Match Now
                            </Button>
                        </div>
                    </div>

                    {/* Matching Interface */}
                    <div className="grid grid-cols-12 gap-6">
                        {/* Bank Transactions */}
                        <div className="col-span-5 bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-blue-50 border-b border-blue-100 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <PiBank className="text-xl text-blue-600" />
                                    <h3 className="text-base font-bold text-gray-900">Bank Statement</h3>
                                    <span className="ml-auto text-xs font-bold text-gray-500">{filteredBankTx.length} transactions</span>
                                </div>
                                <div className="relative">
                                    <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchBank}
                                        onChange={(e) => setSearchBank(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="h-[500px] overflow-y-auto custom-scrollbar p-4 space-y-2">
                                {filteredBankTx.map(tx => {
                                    const isMatched = matches.has(tx.id)
                                    const isSelected = selectedBankTx === tx.id

                                    return (
                                        <motion.div
                                            key={tx.id}
                                            layout
                                            className={cn(
                                                "p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                isMatched && "bg-emerald-50 border-emerald-300 opacity-60",
                                                isSelected && !isMatched && "ring-2 ring-blue-500 border-blue-400 bg-blue-50",
                                                !isMatched && !isSelected && "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                                            )}
                                            onClick={() => !isMatched && setSelectedBankTx(isSelected ? null : tx.id)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900">{tx.description}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(tx.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <p className="text-base font-mono font-bold text-gray-900">
                                                    ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            {isMatched && (
                                                <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                                                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                                        <PiCheckCircle /> Matched
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            unmatch(tx.id)
                                                        }}
                                                        className="text-xs font-semibold text-rose-600 hover:underline"
                                                    >
                                                        Unmatch
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Center Matching Area */}
                        <div className="col-span-2 flex flex-col justify-center">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                                <PiArrowsLeftRight className="text-4xl text-gray-400 mx-auto mb-4" />
                                <p className="text-xs font-bold text-gray-500 uppercase mb-4">Select & Match</p>

                                {selectedBankTx && selectedBookLine ? (
                                    <Button
                                        onClick={createMatch}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <PiCheckCircle className="mr-2" />
                                        Match These
                                    </Button>
                                ) : (
                                    <div className="space-y-2 text-xs text-gray-500">
                                        <div className={cn(
                                            "p-2 rounded border",
                                            selectedBankTx ? "border-blue-300 bg-blue-50 text-blue-700 font-bold" : "border-gray-200"
                                        )}>
                                            {selectedBankTx ? '✓ Bank' : 'Pick from bank'}
                                        </div>
                                        <div className={cn(
                                            "p-2 rounded border",
                                            selectedBookLine ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-bold" : "border-gray-200"
                                        )}>
                                            {selectedBookLine ? '✓ Books' : 'Pick from books'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Book Entries */}
                        <div className="col-span-5 bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-indigo-50 border-b border-indigo-100 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <PiFileText className="text-xl text-indigo-600" />
                                    <h3 className="text-base font-bold text-gray-900">Your Books</h3>
                                    <span className="ml-auto text-xs font-bold text-gray-500">{filteredBookLines.length} entries</span>
                                </div>
                                <div className="relative">
                                    <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchBooks}
                                        onChange={(e) => setSearchBooks(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="h-[500px] overflow-y-auto custom-scrollbar p-4 space-y-2">
                                {filteredBookLines.map(line => {
                                    const isMatched = Array.from(matches.values()).includes(line.id)
                                    const isSelected = selectedBookLine === line.id

                                    return (
                                        <motion.div
                                            key={line.id}
                                            layout
                                            className={cn(
                                                "p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                isMatched && "bg-emerald-50 border-emerald-300 opacity-60",
                                                isSelected && !isMatched && "ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50",
                                                !isMatched && !isSelected && "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                                            )}
                                            onClick={() => !isMatched && setSelectedBookLine(isSelected ? null : line.id)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900">{line.description}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(line.date).toLocaleDateString()} • {line.reference}
                                                    </p>
                                                </div>
                                                <p className="text-base font-mono font-bold text-gray-900">
                                                    ${line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            {isMatched && (
                                                <div className="pt-2 border-t border-emerald-200">
                                                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                                        <PiCheckCircle /> Matched
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Complete Button */}
                    {matchedCount > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 mb-1">
                                        {isReconciled ? '🎉 Perfect! Everything is matched!' : `${matchedCount} transactions matched`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {isReconciled
                                            ? 'Your bank statement and books are in perfect sync'
                                            : `${unmatchedBankCount + unmatchedBookCount} items still need attention`
                                        }
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setStep('review')}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Review Reconciliation
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Step 3: Review */}
            {step === 'review' && (
                <div className="bg-white border border-gray-200 rounded-xl p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className={cn(
                            "text-center p-8 rounded-2xl mb-8",
                            isReconciled ? "bg-emerald-50 border-2 border-emerald-200" : "bg-orange-50 border-2 border-orange-200"
                        )}>
                            {isReconciled ? (
                                <>
                                    <PiCheckCircle className="text-6xl text-emerald-600 mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reconciliation Complete!</h2>
                                    <p className="text-gray-600">Your bank statement and books match perfectly.</p>
                                </>
                            ) : (
                                <>
                                    <PiWarning className="text-6xl text-orange-600 mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reconciliation In Progress</h2>
                                    <p className="text-gray-600">You still have {unmatchedBankCount + unmatchedBookCount} unmatched items.</p>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-50 rounded-xl p-6">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Total Matched</p>
                                <p className="text-3xl font-bold text-emerald-600">{matchedCount}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-6">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Unmatched Items</p>
                                <p className="text-3xl font-bold text-orange-600">{unmatchedBankCount + unmatchedBookCount}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={() => setStep('match')}
                                variant="outline"
                                className="flex-1"
                            >
                                Back to Matching
                            </Button>
                            <Button
                                onClick={() => {
                                    alert('Reconciliation saved! (In production, this would save to database)')
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={!isReconciled}
                            >
                                {isReconciled ? 'Save & Complete' : 'Complete Anyway'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
