import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApprovalQueue } from "../../../components/dashboard/ApprovalQueue";

export default async function ApprovalsPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    const isAdmin = currentUser?.role === 'SYSTEM_ADMIN';

    // Fetch pending approvals
    const myPendingApprovals = await prisma.approval.findMany({
        where: {
            ...(isAdmin ? {} : { approverId: session.user.id }),
            status: 'PENDING'
        },
        include: {
            expense: {
                include: {
                    user: {
                        select: { name: true, email: true, department: true }
                    }
                }
            },
            requisition: {
                include: {
                    user: {
                        select: { name: true, email: true, department: true }
                    }
                }
            },
            monthlyBudget: {
                include: {
                    user: {
                        select: { name: true, email: true, department: true }
                    }
                }
            },
            invoice: {
                include: {
                    vendor: true,
                    createdBy: {
                        select: { name: true, email: true, department: true }
                    },
                    items: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Separate approvals by type and extract the items with approval IDs
    const pendingExpenses = myPendingApprovals
        .filter(a => a.expense)
        .map(a => ({ ...a.expense!, approvalId: a.id }));

    const pendingRequisitions = myPendingApprovals
        .filter(a => a.requisition)
        .map(a => ({ ...a.requisition!, approvalId: a.id }));

    const pendingBudgets = myPendingApprovals
        .filter(a => a.monthlyBudget)
        .map(a => ({ ...a.monthlyBudget!, approvalId: a.id }));

    const pendingInvoices = myPendingApprovals
        .filter(a => a.invoice)
        .map(a => ({ ...a.invoice!, approvalId: a.id }));

    // Fetch approval history
    const approvalHistory = await prisma.approval.findMany({
        where: {
            ...(isAdmin ? {} : { approverId: session.user.id }),
            status: { in: ['APPROVED', 'REJECTED'] }
        },
        include: {
            expense: {
                include: {
                    user: {
                        select: { name: true }
                    }
                }
            },
            requisition: {
                include: {
                    user: {
                        select: { name: true }
                    }
                }
            },
            monthlyBudget: {
                include: {
                    user: {
                        select: { name: true }
                    }
                }
            },
            invoice: {
                include: {
                    createdBy: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-emerald)]">
                        Review and approve pending requests
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-gds-text-muted uppercase tracking-wider font-bold">Pending Items</p>
                        <p className="text-3xl font-heading font-bold text-[var(--gds-emerald)]">
                            {pendingExpenses.length + pendingRequisitions.length + pendingBudgets.length + pendingInvoices.length}
                        </p>
                    </div>
                </div>
            </div>

            <ApprovalQueue
                expenses={JSON.parse(JSON.stringify(pendingExpenses))}
                requisitions={JSON.parse(JSON.stringify(pendingRequisitions))}
                budgets={JSON.parse(JSON.stringify(pendingBudgets))}
                invoices={JSON.parse(JSON.stringify(pendingInvoices))}
                history={JSON.parse(JSON.stringify(approvalHistory))}
            />
        </div>
    );
}
