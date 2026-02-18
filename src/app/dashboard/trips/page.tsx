import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BiSolidPlaneAlt, BiCalendarCheck, BiMap } from "react-icons/bi";

export default async function TripsPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    const travelRequisitions = await prisma.requisition.findMany({
        where: {
            userId: session.user.id,
            category: 'Travel'
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-emerald)]">
                        Itineraries & bookings
                    </p>
                </div>
                <Link href="/dashboard/requisitions/new?category=Travel" className="gds-btn-premium flex items-center gap-2">
                    <BiSolidPlaneAlt className="text-lg" />
                    <span>New trip request</span>
                </Link>
            </div>

            <div className="grid gap-6">
                {travelRequisitions.length === 0 ? (
                    <div className="gds-glass p-20 text-center text-gds-text-muted italic">
                        <BiSolidPlaneAlt className="text-4xl text-[var(--gds-surface-bright)] mx-auto mb-4" />
                        No travel requests found. Plan your next business trip now.
                    </div>
                ) : (
                    travelRequisitions.map((req: any) => (
                        <div key={req.id} className="gds-glass p-6 flex items-center justify-between group hover:border-[var(--gds-emerald)]/50 transition-all">
                            <div className="flex gap-4 items-center">
                                <div className="w-16 h-16 rounded-2xl bg-[var(--gds-surface)] flex items-center justify-center text-3xl text-[var(--gds-emerald)] group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/10">
                                    <BiSolidPlaneAlt />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gds-text-main mb-1">{req.title}</h3>
                                    <div className="flex gap-4 text-xs font-bold tracking-wider text-gds-text-muted">
                                        <span className="flex items-center gap-1"><BiCalendarCheck /> {req.expectedDate ? new Date(req.expectedDate).toLocaleDateString() : 'TBD'}</span>
                                        <span className="flex items-center gap-1"><BiMap /> {req.description.slice(0, 20)}...</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gds-text-muted font-bold tracking-widest mb-1">Budget</div>
                                <div className="text-2xl font-mono font-bold text-gds-text-main">${req.amount.toLocaleString()}</div>
                                <div className={`mt-2 inline-block px-3 py-1 rounded text-[10px] font-bold tracking-widest border ${req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    req.status === 'PENDING' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                        'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                    }`}>
                                    {req.status}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
