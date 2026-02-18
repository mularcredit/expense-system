
import prisma from "@/lib/prisma";

export class AccountingEngine {

    /**
     * Posts a Journal Entry (General Ledger)
     * Enforces Double Entry Rule: Total Debits must equal Total Credits
     */
    static async postJournalEntry(
        data: {
            date: Date;
            description: string;
            reference?: string;
            lines: { accountId: string; debit: number; credit: number; description?: string }[];
            source?: {
                expenseId?: string;
                invoiceId?: string;
                paymentId?: string;
                saleId?: string;
                creditNoteId?: string;
                requisitionId?: string;
                monthlyBudgetId?: string;
            };
            userId?: string;
        }
    ) {
        // 1. Validate Double Entry
        const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Double Entry Mismatch: Debits (${totalDebit}) != Credits (${totalCredit})`);
        }

        // 2. Create the Entry
        return await (prisma as any).journalEntry.create({
            data: {
                date: data.date,
                description: data.description,
                reference: data.reference,
                expenseId: data.source?.expenseId,
                invoiceId: data.source?.invoiceId,
                saleId: data.source?.saleId,
                paymentId: data.source?.paymentId,
                creditNoteId: data.source?.creditNoteId,
                requisitionId: data.source?.requisitionId,
                monthlyBudgetId: data.source?.monthlyBudgetId,
                createdBy: data.userId,
                status: 'POSTED',
                lines: {
                    create: data.lines.map(line => ({
                        accountId: line.accountId,
                        debit: line.debit,
                        credit: line.credit,
                        description: line.description || data.description
                    }))
                }
            }
        });
    }

    /**
     * AUTOMATION: Post an Expense to the Ledger
     * When an expense is PAID, it should Debit the Expense Account and Credit the Bank/Cash Account.
     */
    static async postExpensePayment(expenseId: string, paidFromAccountId: string) {
        const expense = await prisma.expense.findUnique({
            where: { id: expenseId }
        });

        if (!expense) throw new Error("Expense not found");

        // Find the Expense GL Account based on category (simplified logic for now)
        // In a real app, this would look up the specific GL code mapped to the category
        // Here we default to a generic "Operating Expense" account if not found
        let expenseAccount = await prisma.account.findFirst({
            where: { name: expense.category, type: 'EXPENSE' }
        });

        if (!expenseAccount) {
            // Fallback to generic code 6000 or create one
            expenseAccount = await prisma.account.findFirst({ where: { code: '6000' } });
        }

        if (!expenseAccount) throw new Error("No GL Account found for this expense category");

        await this.postJournalEntry({
            date: new Date(),
            description: `Payment for Expense: ${expense.title}`,
            reference: `EXP-${expenseId.substring(0, 8)}`,
            source: { expenseId: expense.id },
            lines: [
                {
                    // DEBIT: Expense
                    accountId: expenseAccount.id,
                    debit: expense.amount,
                    credit: 0
                },
                {
                    // CREDIT: Bank / Cash
                    accountId: paidFromAccountId,
                    debit: 0,
                    credit: expense.amount
                }
            ]
        });
    }

    /**
     * AUTOMATION: Post a Requisition Payment to the Ledger
     * DEBIT: Expense Account (Category)
     * CREDIT: Bank / Cash (1000)
     */
    static async postRequisitionPayment(requisitionId: string, paidFromAccountId: string) {
        const requisition = await prisma.requisition.findUnique({
            where: { id: requisitionId }
        });

        if (!requisition) throw new Error("Requisition not found");

        let expenseAccount = await prisma.account.findFirst({
            where: { name: requisition.category, type: 'EXPENSE' }
        });

        if (!expenseAccount) {
            expenseAccount = await prisma.account.findFirst({ where: { code: '6000' } });
        }

        if (!expenseAccount) throw new Error("No GL Account found for this requisition");

        await this.postJournalEntry({
            date: new Date(),
            description: `Payment for Requisition: ${requisition.title}`,
            reference: `REQ-${requisitionId.substring(0, 8)}`,
            source: { requisitionId: requisition.id },
            lines: [
                { accountId: expenseAccount.id, debit: requisition.amount, credit: 0 },
                { accountId: paidFromAccountId, debit: 0, credit: requisition.amount }
            ]
        });
    }

    /**
     * AUTOMATION: Post a Monthly Budget Disbursement to the Ledger
     * DEBIT: Operating Expenses (6000)
     * CREDIT: Bank / Cash (1000)
     */
    static async postBudgetDisbursement(budgetId: string, paidFromAccountId: string) {
        const budget = await (prisma as any).monthlyBudget.findUnique({
            where: { id: budgetId }
        });

        if (!budget) throw new Error("Budget not found");

        const expenseAccount = await prisma.account.findFirst({ where: { code: '6000' } });
        if (!expenseAccount) throw new Error("Operating Expenses (6000) Account not found");

        await this.postJournalEntry({
            date: new Date(),
            description: `Disbursement: ${budget.month}/${budget.year} Budget - ${budget.branch}`,
            reference: `BUD-${budgetId.substring(0, 8)}`,
            source: { monthlyBudgetId: budget.id },
            lines: [
                { accountId: expenseAccount.id, debit: budget.totalAmount, credit: 0 },
                { accountId: paidFromAccountId, debit: 0, credit: budget.totalAmount }
            ]
        });
    }

    /**
     * AUTOMATION: Post a Sale (Invoice) to the Ledger
     * When a sale is FINALIZED/SENT, it should Debit Accounts Receivable and Credit Sales Revenue.
     */
    static async postSaleInvoice(saleId: string) {
        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: { customer: true }
        });

        if (!sale) throw new Error("Sale not found");

        // 1. Clean up existing entries for this sale to ensure sync
        const existingEntries = await (prisma as any).journalEntry.findMany({
            where: { saleId: sale.id }
        });

        for (const entry of existingEntries) {
            await (prisma as any).journalLine.deleteMany({ where: { entryId: entry.id } });
            await (prisma as any).journalEntry.delete({ where: { id: entry.id } });
        }

        // 2. Find Accounts Receivable Account (Asset)
        const arAccount = await prisma.account.findFirst({
            where: { code: '1200' } // Standard AR Code
        });

        // 3. Find Sales Revenue Account (Revenue)
        const revenueAccount = await prisma.account.findFirst({
            where: { code: '4000' } // Standard Sales Revenue Code
        });

        if (!arAccount || !revenueAccount) throw new Error("Missing AR (1200) or Revenue (4000) Accounts in GL");

        await this.postJournalEntry({
            date: sale.issueDate,
            description: `Invoice #${sale.invoiceNumber} for ${sale.customer.name}`,
            reference: sale.invoiceNumber,
            source: { saleId: sale.id },
            lines: [
                {
                    // DEBIT: Accounts Receivable
                    accountId: arAccount.id,
                    debit: sale.totalAmount,
                    credit: 0
                },
                {
                    // CREDIT: Sales Revenue
                    accountId: revenueAccount.id,
                    debit: 0,
                    credit: sale.totalAmount
                }
            ]
        });
    }

    /**
     * AUTOMATION: Post a Credit Note to the Ledger
     * Credits Accounts Receivable and Debits Sales Return.
     */
    static async postCreditNote(creditNoteId: string) {
        const creditNote = await prisma.creditNote.findUnique({
            where: { id: creditNoteId },
            include: { customer: true }
        });

        if (!creditNote) throw new Error("Credit Note not found");

        // 1. Find Accounts Receivable Account (Asset)
        const arAccount = await prisma.account.findFirst({
            where: { code: '1200' } // Standard AR Code
        });

        // 2. Find Sales Return Account (Revenue Contra)
        let returnsAccount = await prisma.account.findFirst({
            where: { code: '4100' }
        });

        if (!returnsAccount) {
            // Fallback lookup
            returnsAccount = await prisma.account.findFirst({
                where: {
                    name: { contains: 'Return', mode: 'insensitive' }
                }
            });
        }

        if (!arAccount) throw new Error("Missing AR (1200) Account");
        if (!returnsAccount) throw new Error("Missing Sales Return Account");

        await this.postJournalEntry({
            date: creditNote.createdAt,
            description: `Credit Note #${creditNote.cnNumber} for ${creditNote.customer.name} - ${creditNote.reason}`,
            reference: creditNote.cnNumber,
            source: { creditNoteId: creditNote.id },
            lines: [
                {
                    // DEBIT: Sales Return (Reduces Revenue)
                    accountId: returnsAccount.id,
                    debit: creditNote.amount,
                    credit: 0
                },
                {
                    // CREDIT: Accounts Receivable (Reduces Customer Debt)
                    accountId: arAccount.id,
                    debit: 0,
                    credit: creditNote.amount
                }
            ]
        });
    }

    /**
     * AUTOMATION: Post Asset Purchase to Ledger
     * DEBIT: Fixed Asset Account (1500)
     * CREDIT: Bank Account (1000) - Assuming direct purchase
     */
    static async postAssetPurchase(assetId: string) {
        const asset = await (prisma as any).asset.findUnique({
            where: { id: assetId }
        });

        if (!asset) throw new Error("Asset not found");

        // 1. Find Fixed Asset GL Account
        // Try to find specific account for category, else default to 1500 (Machinery & Equipment)
        let assetAccount = await prisma.account.findFirst({
            where: { name: asset.category, type: 'ASSET' }
        });

        if (!assetAccount) {
            assetAccount = await prisma.account.findFirst({ where: { code: '1500' } });
        }

        // 2. Find Bank Account (Credit)
        const bankAccount = await prisma.account.findFirst({
            where: { code: '1000' }
        });

        if (!assetAccount || !bankAccount) {
            console.warn("Missing GL Accounts for Asset Purchase. Skipping Ledger Post.");
            return;
        }

        await this.postJournalEntry({
            date: asset.purchaseDate,
            description: `Asset Purchase: ${asset.name}`,
            reference: asset.assetTag || asset.serialNumber || `ASSET-${asset.id.substring(0, 8)}`,
            source: {}, // Asset ID isn't in source type yet, we might need to extend it or just use description
            lines: [
                {
                    // DEBIT: Fixed Asset (Increase Asset)
                    accountId: assetAccount.id,
                    debit: asset.purchasePrice,
                    credit: 0
                },
                {
                    // CREDIT: Bank (Decrease Cash)
                    accountId: bankAccount.id,
                    debit: 0,
                    credit: asset.purchasePrice
                }
            ]
        });
    }

    /**
     * AUTOMATION: Post Depreciation Entry
     * DEBIT: Depreciation Expense (6050)
     * CREDIT: Accumulated Depreciation (1600)
     */
    static async postAssetDepreciation(assetId: string, amount: number, period: string) {
        const asset = await (prisma as any).asset.findUnique({
            where: { id: assetId }
        });

        if (!asset) throw new Error("Asset not found");

        // 1. Find Depreciation Expense Account
        let expenseAccount = await prisma.account.findFirst({
            where: { code: '6050' }
        });

        // 2. Find Accumulated Depreciation Account (Contra Asset)
        let accumAccount = await prisma.account.findFirst({
            where: { code: '1600' }
        });

        // Fallbacks if creating on fly
        if (!expenseAccount) {
            // Create standard depreciation expense
            expenseAccount = await prisma.account.create({
                data: { code: '6050', name: 'Depreciation Expense', type: 'EXPENSE' }
            });
        }
        if (!accumAccount) {
            // Create standard accumulated depreciation
            accumAccount = await prisma.account.create({
                data: { code: '1600', name: 'Accumulated Depreciation', type: 'ASSET', subtype: 'CONTRA' }
            });
        }

        await this.postJournalEntry({
            date: new Date(),
            description: `Depreciation (${period}): ${asset.name}`,
            reference: `DEP-${period}-${asset.id.substring(0, 6)}`,
            lines: [
                {
                    // DEBIT: Depreciation Expense
                    accountId: expenseAccount.id,
                    debit: amount,
                    credit: 0
                },
                {
                    // CREDIT: Accumulated Depreciation
                    accountId: accumAccount.id,
                    debit: 0,
                    credit: amount
                }
            ]
        });
    }

    /**
     * AUTOMATION: Post Vendor Invoice to Ledger (NEW!)
     * When a vendor invoice is APPROVED, record the liability
     * DEBIT: Expense Account (6000) or Asset Account
     * CREDIT: Accounts Payable (2000)
     */
    static async postVendorInvoice(invoiceId: string) {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                vendor: true,
                items: true
            }
        });

        if (!invoice) throw new Error("Invoice not found");

        // Find Accounts Payable Account
        const apAccount = await prisma.account.findFirst({
            where: { code: '2000' }
        });

        if (!apAccount) throw new Error("Missing Accounts Payable (2000) Account");

        // For simplicity, we'll use Operating Expenses (6000) as default
        // In a real system, you'd map invoice items to specific GL accounts
        const expenseAccount = await prisma.account.findFirst({
            where: { code: '6000' }
        });

        if (!expenseAccount) throw new Error("Missing Operating Expenses (6000) Account");

        await this.postJournalEntry({
            date: invoice.invoiceDate,
            description: `Vendor Invoice #${invoice.invoiceNumber} - ${invoice.vendor.name}`,
            reference: invoice.invoiceNumber,
            source: { invoiceId: invoice.id },
            lines: [
                {
                    // DEBIT: Expense (Increase Expense)
                    accountId: expenseAccount.id,
                    debit: invoice.amount,
                    credit: 0,
                    description: invoice.description || undefined
                },
                {
                    // CREDIT: Accounts Payable (Increase Liability)
                    accountId: apAccount.id,
                    debit: 0,
                    credit: invoice.amount
                }
            ]
        });
    }

    /**
     * AUTOMATION: Post Vendor Payment to Ledger (NEW!)
     * When a vendor invoice is PAID, reduce the liability
     * DEBIT: Accounts Payable (2000)
     * CREDIT: Cash & Bank (1000)
     */
    static async postVendorPayment(invoiceId: string, paymentAmount: number) {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { vendor: true }
        });

        if (!invoice) throw new Error("Invoice not found");

        // Find Accounts Payable Account
        const apAccount = await prisma.account.findFirst({
            where: { code: '2000' }
        });

        // Find Cash Account
        const cashAccount = await prisma.account.findFirst({
            where: { code: '1000' }
        });

        if (!apAccount || !cashAccount) {
            throw new Error("Missing AP (2000) or Cash (1000) Account");
        }

        await this.postJournalEntry({
            date: new Date(),
            description: `Payment for Invoice #${invoice.invoiceNumber} - ${invoice.vendor.name}`,
            reference: `PAY-${invoice.invoiceNumber}`,
            source: { invoiceId: invoice.id },
            lines: [
                {
                    // DEBIT: Accounts Payable (Reduce Liability)
                    accountId: apAccount.id,
                    debit: paymentAmount,
                    credit: 0
                },
                {
                    // CREDIT: Cash (Reduce Asset)
                    accountId: cashAccount.id,
                    debit: 0,
                    credit: paymentAmount
                }
            ]
        });
    }

    /**
     * AUTOMATION: Post Customer Payment to Ledger (NEW!)
     * When a customer pays an invoice, record the cash receipt
     * DEBIT: Cash & Bank (1000)
     * CREDIT: Accounts Receivable (1200)
     */
    static async postCustomerPayment(paymentId: string) {
        const payment = await prisma.customerPayment.findUnique({
            where: { id: paymentId },
            include: {
                customer: true,
                sale: true
            }
        });

        if (!payment) throw new Error("Customer payment not found");

        // Find Cash Account
        const cashAccount = await prisma.account.findFirst({
            where: { code: '1000' }
        });

        // Find Accounts Receivable Account
        const arAccount = await prisma.account.findFirst({
            where: { code: '1200' }
        });

        if (!cashAccount || !arAccount) {
            throw new Error("Missing Cash (1000) or AR (1200) Account");
        }

        const reference = payment.sale
            ? `PMT-${payment.sale.invoiceNumber}`
            : `PMT-${payment.id.substring(0, 8)}`;

        await this.postJournalEntry({
            date: payment.paymentDate,
            description: `Payment from ${payment.customer.name}${payment.sale ? ` for Invoice #${payment.sale.invoiceNumber}` : ''}`,
            reference,
            lines: [
                {
                    // DEBIT: Cash (Increase Asset)
                    accountId: cashAccount.id,
                    debit: payment.amount,
                    credit: 0
                },
                {
                    // CREDIT: Accounts Receivable (Reduce Asset)
                    accountId: arAccount.id,
                    debit: 0,
                    credit: payment.amount
                }
            ]
        });
    }
}
