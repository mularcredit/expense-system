
import prisma from "@/lib/prisma";

export class FinancialReports {

    /**
     * Generates a Balance Sheet
     * Assets = Liabilities + Equity
     */
    static async getBalanceSheet(asOfDate: Date = new Date()) {
        // Fetch all accounts with their types
        const accounts = await prisma.account.findMany({
            include: {
                journalLines: {
                    where: {
                        entry: {
                            date: { lte: asOfDate },
                            status: 'POSTED'
                        }
                    }
                }
            }
        });

        const report = {
            assets: { total: 0, accounts: [] as any[] },
            liabilities: { total: 0, accounts: [] as any[] },
            equity: { total: 0, accounts: [] as any[] }
        };

        for (const account of accounts) {
            // Calculate Net Balance: Debits - Credits (Asset/Expense) or Credits - Debits (Liability/Equity/Revenue)
            const totalDebit = account.journalLines.reduce((sum, line) => sum + line.debit, 0);
            const totalCredit = account.journalLines.reduce((sum, line) => sum + line.credit, 0);

            let balance = 0;
            // Normal Balance Logic
            if (['ASSET', 'EXPENSE'].includes(account.type)) {
                balance = totalDebit - totalCredit;
            } else {
                balance = totalCredit - totalDebit;
            }

            if (balance === 0) continue;

            const entry = { code: account.code, name: account.name, balance };

            if (account.type === 'ASSET') {
                report.assets.accounts.push(entry);
                report.assets.total += balance;
            } else if (account.type === 'LIABILITY') {
                report.liabilities.accounts.push(entry);
                report.liabilities.total += balance;
            } else if (account.type === 'EQUITY') {
                report.equity.accounts.push(entry);
                report.equity.total += balance;
            }
            // Revenue/Expenses roll into Retained Earnings (Equity) for Balance Sheet
            // Simplified here: You usually calculate Net Income and add to Equity
        }

        // Calculate Net Income (Revenue - Expenses) to add to Equity (Retained Earnings)
        const revenue = accounts.filter(a => a.type === 'REVENUE').reduce((sum, a) => {
            const debits = a.journalLines.reduce((s, l) => s + l.debit, 0);
            const credits = a.journalLines.reduce((s, l) => s + l.credit, 0);
            return sum + (credits - debits);
        }, 0);

        const expenses = accounts.filter(a => a.type === 'EXPENSE').reduce((sum, a) => {
            const debits = a.journalLines.reduce((s, l) => s + l.debit, 0);
            const credits = a.journalLines.reduce((s, l) => s + l.credit, 0);
            return sum + (debits - credits);
        }, 0);

        const netIncome = revenue - expenses;

        // Add Net Income to Equity
        report.equity.accounts.push({ code: '9999', name: 'Net Income (Current Year)', balance: netIncome });
        report.equity.total += netIncome;

        return report;
    }
}
