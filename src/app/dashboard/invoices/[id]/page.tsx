import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    PiArrowLeft,
    PiBuildings,
    PiCalendar,
    PiCheckCircle,
    PiClock,
    PiCoin,
    PiFileText,
    PiPaperclip,
    PiReceipt,
    PiWarningCircle
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { InvoiceActions } from "./InvoiceActions";
import { requirePermission } from "@/lib/access-control";

export default async function InvoiceDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();

    // Updated permission check
    requirePermission(session, ['INVOICES.VIEW', 'INVOICES.MANAGE', 'SALES.MANAGE']);

    const invoice = await prisma.invoice.findUnique({
        where: { id: params.id },
        include: {
            vendor: true,
            createdBy: {
                select: { name: true, email: true, department: true }
            },
            items: true,
            approvals: {
                include: {
                    approver: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!invoice) {
        return redirect("/dashboard/invoices");
    }

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

    const StatusIcon = getStatusIcon(invoice.status);

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/invoices"
                    className="p-2 -ml-2 text-gds-text-muted hover:text-gds-text-main hover:bg-[var(--gds-surface-bright)] rounded-xl transition-colors"
                >
                    <PiArrowLeft className="text-xl" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-gds-text-main">Invoice #{invoice.invoiceNumber}</h1>
                        <span className={cn(
                            "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5",
                            getStatusColor(invoice.status)
                        )}>
                            <StatusIcon />
                            {invoice.status.replace('_', ' ')}
                        </span>
                    </div>
                    <p className="text-sm text-gds-text-muted flex items-center gap-2">
                        <PiBuildings />
                        {invoice.vendor.name}
                    </p>
                </div>
                <InvoiceActions id={invoice.id} invoiceNumber={invoice.invoiceNumber} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Details Card */}
                    <div className="gds-glass p-6 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-xs text-gds-text-muted font-bold uppercase tracking-wider mb-1">Invoice Date</p>
                                <p className="text-gds-text-main font-mono font-medium flex items-center gap-2">
                                    <PiCalendar className="text-gds-text-muted" />
                                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gds-text-muted font-bold uppercase tracking-wider mb-1">Due Date</p>
                                <p className={cn(
                                    "font-mono font-medium flex items-center gap-2",
                                    new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID' ? "text-rose-500" : "text-gds-text-main"
                                )}>
                                    <PiCalendar className="opacity-70" />
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gds-text-muted font-bold uppercase tracking-wider mb-1">Amount</p>
                                <p className="text-2xl font-heading font-bold text-gds-text-main">
                                    ${invoice.amount.toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gds-text-muted font-bold uppercase tracking-wider mb-1">Currency</p>
                                <p className="text-gds-text-main font-mono font-medium flex items-center gap-2">
                                    <PiCoin className="text-gds-text-muted" />
                                    {invoice.currency}
                                </p>
                            </div>
                        </div>

                        {invoice.description && (
                            <div className="pt-6 border-t border-[var(--gds-border)]">
                                <p className="text-xs text-gds-text-muted font-bold uppercase tracking-wider mb-2">Description</p>
                                <p className="text-gds-text-main text-sm dark:bg-black/20 bg-gray-50 p-4 rounded-lg border border-[var(--gds-border)]">
                                    {invoice.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Line Items */}
                    <div className="gds-glass p-0 overflow-hidden">
                        <div className="p-4 border-b border-[var(--gds-border)] bg-[var(--gds-surface)]">
                            <h3 className="font-bold text-gds-text-main flex items-center gap-2">
                                <PiReceipt className="text-lg text-[var(--gds-emerald)]" />
                                Line Items
                            </h3>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--gds-surface-bright)]/50 text-[10px] font-bold text-gds-text-muted uppercase tracking-widest border-b border-[var(--gds-border)]">
                                <tr>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3 text-right">Quantity</th>
                                    <th className="px-6 py-3 text-right">Unit Price</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--gds-border)]">
                                {invoice.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-[var(--gds-surface-bright)]/30 transition-colors">
                                        <td className="px-6 py-4 text-gds-text-main font-medium">{item.description}</td>
                                        <td className="px-6 py-4 text-gds-text-muted">{item.category || '-'}</td>
                                        <td className="px-6 py-4 text-right font-mono text-gds-text-muted">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right font-mono text-gds-text-muted">${item.unitPrice.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-gds-text-main">${item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-[var(--gds-surface-bright)]/50 border-t border-[var(--gds-border)]">
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-right font-bold text-gds-text-muted uppercase tracking-wider text-xs">Total Amount</td>
                                    <td className="px-6 py-4 text-right font-heading font-bold text-lg text-[var(--gds-emerald)]">
                                        ${invoice.amount.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Attachment Card */}
                    {invoice.fileUrl ? (
                        <div className="gds-glass p-0 overflow-hidden">
                            <div className="p-4 border-b border-[var(--gds-border)] bg-[var(--gds-surface)]">
                                <h3 className="font-bold text-gds-text-main flex items-center gap-2">
                                    <PiPaperclip className="text-lg text-[var(--gds-emerald)]" />
                                    Attachment
                                </h3>
                            </div>
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 mx-auto bg-[var(--gds-surface-bright)] rounded-2xl flex items-center justify-center mb-3">
                                    <PiFileText className="text-3xl text-gds-text-muted" />
                                </div>
                                <p className="text-sm font-medium text-gds-text-main mb-4">Invoice Document</p>
                                <a
                                    href={invoice.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gds-btn-secondary w-full flex items-center justify-center gap-2"
                                >
                                    <PiPaperclip />
                                    View File
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="gds-glass p-6 text-center">
                            <div className="w-12 h-12 mx-auto bg-[var(--gds-surface-bright)] rounded-xl flex items-center justify-center mb-2">
                                <PiPaperclip className="text-2xl text-gds-text-muted opacity-50" />
                            </div>
                            <p className="text-sm text-gds-text-muted">No attachments</p>
                        </div>
                    )}

                    {/* Metadata Card */}
                    <div className="gds-glass p-6 space-y-4">
                        <h3 className="font-bold text-gds-text-main border-b border-[var(--gds-border)] pb-2">Information</h3>

                        <div className="space-y-1">
                            <p className="text-xs text-gds-text-muted font-bold uppercase tracking-wider">Created By</p>
                            <p className="text-sm text-gds-text-main">{invoice.createdBy.name}</p>
                            <p className="text-xs text-gds-text-muted">{invoice.createdBy.email}</p>
                            <p className="text-xs text-gds-text-muted capitalize">{invoice.createdBy.department?.toLowerCase()}</p>
                        </div>

                        <div className="space-y-1 pt-2">
                            <p className="text-xs text-gds-text-muted font-bold uppercase tracking-wider">Record ID</p>
                            <p className="text-xs font-mono text-gds-text-muted break-all">{invoice.id}</p>
                        </div>
                    </div>

                    {/* Approval History */}
                    {invoice.approvals.length > 0 && (
                        <div className="gds-glass p-0 overflow-hidden">
                            <div className="p-4 border-b border-[var(--gds-border)] bg-[var(--gds-surface)]">
                                <h3 className="font-bold text-gds-text-main flex items-center gap-2">
                                    <PiCheckCircle className="text-lg text-[var(--gds-emerald)]" />
                                    Approval History
                                </h3>
                            </div>
                            <div className="divide-y divide-[var(--gds-border)]">
                                {invoice.approvals.map((approval) => (
                                    <div key={approval.id} className="p-4 text-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gds-text-main">{approval.approver.name}</span>
                                            <span className="text-[10px] text-gds-text-muted">{new Date(approval.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                                approval.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                            )}>
                                                {approval.status}
                                            </span>
                                        </div>
                                        {approval.comments && (
                                            <p className="text-xs text-gds-text-muted italic mt-1">"{approval.comments}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
