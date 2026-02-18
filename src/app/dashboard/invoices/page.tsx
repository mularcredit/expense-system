import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
    PiPlus,
    PiFileText,
    PiBuildings,
    PiCalendarBlank,
    PiCheckCircle,
    PiClock,
    PiWarningCircle,
    PiPaperclip
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { InvoiceHeaderActions } from "./InvoiceHeaderActions";
import { requirePermission } from "@/lib/access-control";

export default async function InvoicesPage() {
    const session = await auth();

    // Updated filtering logic to use permissions
    requirePermission(session, ['INVOICES.VIEW', 'INVOICES.MANAGE', 'SALES.MANAGE']);

    const invoices = await prisma.invoice.findMany({
        include: {
            vendor: true,
            createdBy: {
                select: { name: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'APPROVED': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'PENDING_APPROVAL': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'REJECTED': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID': return PiCheckCircle;
            case 'APPROVED': return PiCheckCircle;
            case 'PENDING_APPROVAL': return PiClock;
            case 'REJECTED': return PiWarningCircle;
            default: return PiFileText;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-emerald)]">
                        Manage vendor invoices and accounts payable
                    </p>
                </div>
                <InvoiceHeaderActions />
            </div>

            {invoices.length === 0 ? (
                <div className="gds-glass p-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--gds-surface-bright)] mx-auto flex items-center justify-center">
                        <PiFileText className="text-3xl text-gds-text-muted" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gds-text-main">No invoices yet</h3>
                        <p className="text-gds-text-muted">Record your first vendor invoice to start tracking payables.</p>
                    </div>
                </div>
            ) : (
                <div className="gds-glass p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--gds-surface)] text-[10px] font-bold text-gds-text-muted uppercase tracking-widest border-b border-[var(--gds-border)]">
                            <tr>
                                <th className="px-6 py-4">Invoice #</th>
                                <th className="px-6 py-4">Vendor</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--gds-border)]">
                            {invoices.map((invoice) => {
                                const StatusIcon = getStatusIcon(invoice.status);
                                return (
                                    <tr key={invoice.id} className="text-sm hover:bg-[var(--gds-surface-bright)]/50 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-medium text-gds-text-main">
                                            <div className="flex items-center gap-2">
                                                {invoice.invoiceNumber}
                                                {invoice.fileUrl && (
                                                    <a
                                                        href={invoice.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gds-text-muted hover:text-[var(--gds-blue-bright)] transition-colors"
                                                        title="View Attachment"
                                                    >
                                                        <PiPaperclip />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <PiBuildings className="text-gds-text-muted" />
                                                <span className="font-bold text-gds-text-main">{invoice.vendor.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gds-text-muted text-xs">
                                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "flex items-center gap-1.5 text-xs font-medium",
                                                new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID'
                                                    ? "text-rose-500"
                                                    : "text-gds-text-muted"
                                            )}>
                                                <PiCalendarBlank />
                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold font-heading text-gds-text-main">
                                            ${invoice.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 w-fit",
                                                getStatusColor(invoice.status)
                                            )}>
                                                <StatusIcon />
                                                {invoice.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                            {['APPROVED', 'PAID'].includes(invoice.status) && (
                                                <Link
                                                    href={`/receipt-studio?invoiceId=${invoice.id}`}
                                                    className="text-[10px] font-bold text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-200 transition-all uppercase tracking-widest flex items-center gap-1.5"
                                                >
                                                    <PiFileText className="text-sm" />
                                                    Voucher
                                                </Link>
                                            )}
                                            <Link
                                                href={`/dashboard/invoices/${invoice.id}`}
                                                className="text-xs font-bold text-[var(--gds-blue-bright)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
