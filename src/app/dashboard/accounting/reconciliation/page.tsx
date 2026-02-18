import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { BankReconciliationClient } from '@/components/accounting/BankReconciliationClient';

export default async function BankReconciliationPage() {
    const session = await auth();
    if (!session?.user) return redirect("/login");

    // Fetch Cash/Bank account
    const cashAccount = await prisma.account.findFirst({
        where: { code: '1000' }
    });

    if (!cashAccount) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600 font-bold">Cash Account (1000) not found in Chart of Accounts.</p>
                <p className="text-sm text-gray-500 mt-2">Please create it first.</p>
            </div>
        );
    }

    // Fetch recent journal entries affecting Cash account
    const journalLines = await prisma.journalLine.findMany({
        where: {
            accountId: cashAccount.id,
            entry: {
                status: 'POSTED'
            }
        },
        include: {
            entry: true
        },
        orderBy: {
            entry: {
                date: 'desc'
            }
        },
        take: 100
    });

    // Calculate GL balance
    const glBalance = journalLines.reduce((balance, line) => {
        return balance + (line.debit - line.credit);
    }, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            <div className="flex items-end justify-between border-b pb-6 border-gray-200">
                <div>
                    <p className="text-gray-500 text-sm font-medium tracking-wide">
                        Match your bank statement with the General Ledger
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">GL Cash Balance</p>
                    <p className="text-2xl font-bold text-gray-900">
                        ${glBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <BankReconciliationClient
                cashAccountId={cashAccount.id}
                glBalance={glBalance}
                journalLines={journalLines.map(line => ({
                    id: line.id,
                    date: line.entry.date.toISOString(),
                    description: line.entry.description,
                    reference: line.entry.reference || '',
                    debit: line.debit,
                    credit: line.credit,
                    amount: line.debit > 0 ? line.debit : -line.credit
                }))}
            />
        </div>
    );
}
