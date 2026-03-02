import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { BiWallet, BiTransfer, BiHistory, BiCreditCard, BiPlus } from "react-icons/bi";
import { PiWifiHigh } from "react-icons/pi";
import { WalletCard } from "@/components/dashboard/WalletCard";

export default async function WalletPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/login");

    const [wallet, categories, departments] = await Promise.all([
        prisma.wallet.findUnique({
            where: { userId: session.user.id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        }),
        prisma.category.findMany({
            where: { isActive: true },
            select: { name: true }
        }),
        prisma.user.findMany({
            where: { department: { not: null } },
            select: { department: true },
            distinct: ['department']
        })
    ]);

    if (!wallet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-24 h-24 bg-[var(--gds-surface)] rounded-full flex items-center justify-center animate-pulse">
                    <BiWallet className="text-5xl text-gds-text-muted opacity-20" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gds-text-main mb-2">Wallet not found</h1>
                    <p className="text-gds-text-muted">No corporate wallet has been assigned to your account.</p>
                </div>
                <button className="gds-btn-premium opacity-50 cursor-not-allowed">Request wallet activation</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up mt-4">
            {/* Header section with 2 cards display */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Visual Cards Section */}
                <div className="w-full lg:w-[480px] shrink-0 space-y-6">
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Your Cards</h2>
                            <p className="text-gray-500 text-sm mt-1">Manage your active payment methods</p>
                        </div>
                    </div>

                    {/* Primary Virtual Card */}
                    <div className="relative">
                        <WalletCard
                            balance={wallet.balance}
                            currency={wallet.currency}
                            categories={categories.map((c: { name: string }) => c.name)}
                            branches={departments.map((d: { department: string | null }) => d.department!).filter(Boolean)}
                            holderName={session.user.name || "Virtual Card"}
                            isStripe={false}
                        />
                        <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 z-10">
                            <span className="text-[10px] font-bold text-white tracking-widest uppercase">Virtual</span>
                        </div>
                    </div>

                    {/* Secondary Physical Card (UI Demo) */}
                    <div className="relative opacity-90 hover:opacity-100 transition-opacity">
                        <div className="w-full rounded-2xl overflow-hidden select-none relative"
                            style={{ aspectRatio: '1.586 / 1', background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' }}>
                            {/* Decorative elements */}
                            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl" />
                            <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />

                            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                {/* Top row */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                                            Physical Card
                                        </p>
                                        <h2 className="text-xl font-bold text-white/90 leading-none tracking-tight">
                                            Linked to Wallet
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-60">
                                        <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">
                                            <BiCreditCard className="text-white text-xs" />
                                        </div>
                                    </div>
                                </div>
                                {/* Chip + Contactless */}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-7 rounded-md bg-gradient-to-br from-gray-300 to-gray-500 relative overflow-hidden flex items-center justify-center shadow-inner opacity-80">
                                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-0.5 opacity-40">
                                            {[...Array(9)].map((_, i) => <div key={i} className="bg-gray-800/40 rounded-[1px]" />)}
                                        </div>
                                        <div className="w-3 h-3 border border-gray-800/50 rounded-sm z-10" />
                                    </div>
                                    <PiWifiHigh className="text-white/30 text-xl rotate-90" />
                                </div>
                                {/* Bottom row */}
                                <div className="flex justify-between items-end">
                                    <div className="flex gap-5">
                                        <div>
                                            <p className="font-mono text-[13px] tracking-[0.22em] text-white/60">
                                                •••• &nbsp;•••• &nbsp;•••• &nbsp;4092
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex -space-x-3 opacity-50">
                                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/10" />
                                        <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm border border-white/10" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10">
                            <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase">Physical</span>
                        </div>
                    </div>
                </div>

                {/* Transactions Section */}
                <div className="flex-1 w-full min-w-0">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col h-full min-h-[600px]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
                                    <BiHistory className="text-xl text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
                                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Your latest wallet transactions</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold text-xs hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
                                <BiPlus className="text-sm" />
                                Top Up
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="bg-white text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 border-b border-gray-100 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Date</th>
                                        <th className="px-6 py-4 text-left">Description</th>
                                        <th className="px-6 py-4 text-left">Reference</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {wallet.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center">
                                                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                    <BiHistory className="text-2xl text-gray-300" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-500">No transactions found</p>
                                                <p className="text-xs text-gray-400 mt-1">Activity from the last 30 days will appear here.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        wallet.transactions.map((tx: any) => (
                                            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                                <td className="px-6 py-4 text-xs font-mono text-gray-500 group-hover:text-gray-900 transition-colors">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900 block">{tx.description}</span>
                                                    <span className="text-[10px] tracking-wider font-bold text-gray-400 uppercase mt-0.5 inline-block">{tx.type.replace('_', ' ')}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                                    <div className="bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100 group-hover:border-gray-300 transition-colors">
                                                        {tx.reference || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={cn(
                                                        "inline-flex items-center justify-end font-mono font-bold text-sm px-3 py-1 rounded-lg",
                                                        tx.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
