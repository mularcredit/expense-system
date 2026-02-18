
"use client";

import { useState } from "react";
import Link from "next/link";
import {
    PiBank,
    PiHandCoins,
    PiCheckCircle,
    PiUploadSimple,
    PiReceipt
} from "react-icons/pi";
import { QuickInvoiceModal } from "./QuickInvoiceModal";
import { UnifiedExpenseModal } from "../expenses/UnifiedExpenseModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export function DashboardQuickActions() {
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    return (
        <>
            <Card>
                <CardHeader className="md:h-[64px]">
                    <CardTitle className="text-[11px] font-bold text-gray-400  px-1">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 py-8">
                    {/* Upload Invoice - NEW ACTION */}
                    <button
                        onClick={() => setIsInvoiceModalOpen(true)}
                        className="w-full text-left flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-[#29258D]/30 rounded-xl transition-all group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-[#29258D]/5 flex items-center justify-center text-[#29258D]">
                            <PiUploadSimple className="text-xl group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#29258D] transition-colors">Upload Invoice</p>
                            <p className="text-[10px] text-gray-400 font-medium">Quick vendor file upload</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="w-full text-left flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-[#29258D]/30 rounded-xl transition-all group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-[#29258D]/5 flex items-center justify-center text-[#29258D]">
                            <PiBank className="text-xl group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#29258D] transition-colors">Submit Expense</p>
                            <p className="text-[10px] text-gray-400 font-medium">Quick receipt upload</p>
                        </div>
                    </button>

                    <Link href="/dashboard/requisitions/new" className="flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-[#2dd4bf]/30 rounded-xl transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-[#2dd4bf]/10 flex items-center justify-center text-[#2dd4bf]">
                            <PiHandCoins className="text-xl group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#2dd4bf] transition-colors">Request Advance</p>
                            <p className="text-[10px] text-gray-400 font-medium">Pre-approval request</p>
                        </div>
                    </Link>

                    <Link href="/dashboard/approvals" className="flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-[#29258D]/30 rounded-xl transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-[#29258D]/5 flex items-center justify-center text-[#29258D]">
                            <PiCheckCircle className="text-xl group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#29258D] transition-colors">Pending Approvals</p>
                            <p className="text-[10px] text-gray-400 font-medium">Manage team requests</p>
                        </div>
                    </Link>
                </CardContent>
            </Card>

            <QuickInvoiceModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
            />

            <UnifiedExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                mode="quick"
            />
        </>
    );
}
