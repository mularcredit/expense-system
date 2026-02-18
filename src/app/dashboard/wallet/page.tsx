import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { BiWallet, BiTransfer, BiHistory, BiCreditCard, BiPlus } from "react-icons/bi";
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
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-gds-text-muted text-sm font-medium tracking-wide pl-3 border-l-2 border-[var(--gds-emerald)]">
                        Manage funds & transactions
                    </p>
                </div>
                <button className="gds-glass px-4 py-2 flex items-center gap-2 text-[var(--gds-emerald)] border-[var(--gds-emerald)]/30 hover:bg-[var(--gds-emerald)] hover:text-white transition-all">
                    <BiPlus className="text-lg" />
                    <span className="text-xs font-bold tracking-wider">Top up request</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Wallet Card */}
                <div className="lg:col-span-1 space-y-6">
                    <WalletCard
                        balance={wallet.balance}
                        currency={wallet.currency}
                        categories={categories.map((c: { name: string }) => c.name)}
                        branches={departments.map((d: { department: string | null }) => d.department!).filter(Boolean)}
                    />

                    <div className="gds-glass p-6">
                        <h3 className="text-sm font-bold text-gds-text-main mb-4 tracking-wider flex items-center gap-2">
                            <BiTransfer />
                            Quick actions
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="p-4 rounded-xl bg-[var(--gds-surface)] border border-[var(--gds-border)] hover:border-[var(--gds-emerald)] transition-all flex flex-col items-center justify-center gap-2 group">
                                <div className="w-10 h-10 rounded-full bg-[var(--gds-bg)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <BiTransfer className="text-xl text-[var(--gds-emerald)]" />
                                </div>
                                <span className="text-[10px] font-bold text-gds-text-muted group-hover:text-gds-text-main">Transfer</span>
                            </button>
                            <button className="p-4 rounded-xl bg-[var(--gds-surface)] border border-[var(--gds-border)] hover:border-[var(--gds-cyan)] transition-all flex flex-col items-center justify-center gap-2 group">
                                <div className="w-10 h-10 rounded-full bg-[var(--gds-bg)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <BiHistory className="text-xl text-[var(--gds-cyan)]" />
                                </div>
                                <span className="text-[10px] font-bold text-gds-text-muted group-hover:text-gds-text-main">Statement</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transactions */}
                <div className="lg:col-span-2">
                    <div className="gds-glass p-0 overflow-hidden min-h-[500px] flex flex-col">
                        <div className="p-6 border-b border-[var(--gds-border)]">
                            <h3 className="text-lg font-bold text-gds-text-main flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-[var(--gds-emerald)] rounded-full"></span>
                                Recent activity
                            </h3>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="bg-[var(--gds-surface)] text-[10px] font-bold text-gds-text-muted tracking-wider sticky top-0 backdrop-blur-md z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Date</th>
                                        <th className="px-6 py-4 text-left">Description</th>
                                        <th className="px-6 py-4 text-left">Reference</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--gds-border)]">
                                    {wallet.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center text-gds-text-muted italic">
                                                No transactions recorded within the last 30 days.
                                            </td>
                                        </tr>
                                    ) : (
                                        wallet.transactions.map((tx: any) => (
                                            <tr key={tx.id} className="hover:bg-[var(--gds-surface-bright)]/30 transition-colors group">
                                                <td className="px-6 py-4 text-xs font-mono text-gds-text-muted group-hover:text-gds-text-main transition-colors">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gds-text-main block">{tx.description}</span>
                                                    <span className="text-[10px] tracking-wider text-gds-text-muted capitalize">{tx.type.toLowerCase().replace('_', ' ')}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gds-text-muted font-mono">{tx.reference || '-'}</td>
                                                <td className={cn(
                                                    "px-6 py-4 text-right font-mono font-bold",
                                                    tx.amount > 0 ? "text-[var(--gds-emerald)]" : "text-rose-500"
                                                )}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
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
