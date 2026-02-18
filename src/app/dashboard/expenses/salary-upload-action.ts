"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";

export async function processSalaryFile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    if (!file) {
        return { error: "No file uploaded" };
    }

    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });

        // Assume data is in the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with array of arrays to handle headers manually
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Skip first two rows (header/title) based on inspection
        // Row 0: "SUBMISSION OF E-GOVERNMENT SERVICES SALARIES LIST "
        // Row 1: Headers ["S/N", "NAMES", "NAME OF BANK", "ACCOUNT NUMBER", "AMOUNT USD"]
        const dataRows = rawData.slice(2);

        let totalAmount = 0;
        const validRows: any[] = [];

        // Validate and aggregate data
        dataRows.forEach((row) => {
            if (!Array.isArray(row) || row.length < 5) return;

            // Index 1: Name, Index 4: Amount
            const name = row[1];
            const amount = typeof row[4] === 'number' ? row[4] : parseFloat(String(row[4] || '0').replace(/[^0-9.]/g, ''));

            if (name && !isNaN(amount) && amount > 0) {
                totalAmount += amount;
                validRows.push({
                    name,
                    bank: row[2],
                    accountNumber: row[3],
                    amount
                });
            }
        });

        if (validRows.length === 0) {
            return { error: "No valid salary entries found in file" };
        }

        // Create a single expense entry for the total salaries
        // You might want to store the detailed breakdown elsewhere or as a note
        const currentMonth = new Date().getMonth() + 1; // 1-12
        const currentYear = new Date().getFullYear();
        const title = `SSCAA Salaries - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;

        // Still keep the description for fallback viewing
        const description = `Aggregated salaries for ${validRows.length} employees.\n\n| Name | Bank | Account | Amount |\n|---|---|---|---|\n${validRows.map(r => `| ${r.name} | ${r.bank || '-'} | ${r.accountNumber || '-'} | $${r.amount.toFixed(2)} |`).join('\n')}`;

        // Ensure session is valid before starting transaction
        if (!session?.user?.id) throw new Error("Unauthorized");
        const userId = session.user.id;

        // Use a transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Expense Record
            const expense = await tx.expense.create({
                data: {
                    userId: userId,
                    title: title,
                    amount: totalAmount,
                    category: "Salaries & Wages",
                    expenseDate: new Date(),
                    merchant: "SSCAA Staff",
                    description: description,
                    status: "DRAFT",
                    paymentMethod: "Bank Transfer"
                }
            });

            // 2. Create the Salary Batch
            const salaryBatch = await tx.salaryBatch.create({
                data: {
                    title: title,
                    month: currentMonth,
                    year: currentYear,
                    totalAmount: totalAmount,
                    currency: "USD",
                    status: "DRAFT",
                    createdById: userId,
                    expenseId: expense.id,
                    notes: `Imported from Excel on ${new Date().toLocaleDateString()}`
                }
            });

            // 3. Create all Salary Records (Bulk create for performance)
            if (validRows.length > 0) {
                await tx.salaryRecord.createMany({
                    data: validRows.map(row => ({
                        batchId: salaryBatch.id,
                        employeeName: row.name,
                        bankName: row.bank || null,
                        accountNumber: String(row.accountNumber || ''),
                        amount: row.amount,
                        notes: ""
                    }))
                });
            }

            return expense;
        });



        revalidatePath("/dashboard/expenses");

        return {
            success: true,
            message: `Successfully processed ${validRows.length} salaries totaling $${totalAmount.toFixed(2)}`,
            expenseId: result.id
        };

    } catch (error: any) {
        console.error("Error processing salary file:", error);
        return { error: error.message || "Failed to process salary file" };
    }
}
