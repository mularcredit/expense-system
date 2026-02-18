import Link from "next/link";
import { PiPlus } from "react-icons/pi";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RequisitionListWithFilter } from "./RequisitionListWithFilter";
import { CreateRequisitionButton } from "@/components/requisitions/CreateRequisitionButton";

export default async function RequisitionsPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    const userId = session.user.id;

    // Check for System Admin role
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, customRole: { select: { isSystem: true } } }
    });

    const isAdmin = currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.customRole?.isSystem;

    // Fetch requisitions based on role
    const whereReq = isAdmin ? {} : { userId };

    const rawRequisitions = await (prisma as any).requisition.findMany({
        where: whereReq,
        include: {
            expenses: {
                select: { receiptUrl: true }
            },
            user: { select: { name: true } } // Include user name for admin visibility
        },
        orderBy: { createdAt: 'desc' }
    });

    const requisitions = rawRequisitions.map((r: any) => ({
        ...r,
        receiptUrl: r.expenses?.[0]?.receiptUrl || null
    }));

    // Safely attempt to fetch monthly budgets
    let monthlyBudgets = [];
    try {
        if ((prisma as any).monthlyBudget) {
            const whereBudget = isAdmin ? {} : { userId };
            monthlyBudgets = await (prisma as any).monthlyBudget.findMany({
                where: whereBudget,
                include: { items: true, user: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            });
        }
    } catch (e) {
        console.error("Monthly budgets not available yet:", e);
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-8 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Requisitions</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage purchase requests and budget plans</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/requisitions/categories"
                        className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-md font-medium text-xs hover:bg-gray-50 transition-all flex items-center gap-2 shadow-none"
                    >
                        <PiPlus />
                        <span>Custom Category</span>
                    </Link>

                    <CreateRequisitionButton requisitions={JSON.parse(JSON.stringify(requisitions))} />

                    <Link
                        href="/dashboard/requisitions/monthly"
                        className="px-5 py-2.5 bg-[#29258D] text-white rounded-md font-medium text-xs hover:bg-[#29258D]/90 transition-all flex items-center gap-2 shadow-none"
                    >
                        <PiPlus />
                        <span>Monthly Budget Plan</span>
                    </Link>
                </div>
            </div>

            <RequisitionListWithFilter
                requisitions={JSON.parse(JSON.stringify(requisitions))}
                monthlyBudgets={JSON.parse(JSON.stringify(monthlyBudgets))}
            />
        </div>
    );
}
