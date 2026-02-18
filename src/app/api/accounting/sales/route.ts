
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { AccountingEngine } from "@/lib/accounting/accounting-engine";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // 1. Basic Validation
    if (!body.customerId || !body.items || body.items.length === 0) {
        return NextResponse.json({ error: "Customer and Line Items are required" }, { status: 400 });
    }

    try {
        // 2. Generate Invoice Number if missing
        let invoiceNumber = body.invoiceNumber;
        if (!invoiceNumber) {
            const count = await prisma.sale.count();
            const year = new Date().getFullYear();
            invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;
        }

        // 3. Calculate Totals
        const totalAmount = body.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);

        // 4. Create Sale Record
        const sale = await prisma.sale.create({
            data: {
                customerId: body.customerId,
                invoiceNumber: invoiceNumber,
                issueDate: new Date(body.issueDate),
                dueDate: new Date(body.dueDate),
                totalAmount: totalAmount,
                status: body.status || 'DRAFT',
                notes: body.notes,
                items: {
                    create: body.items.map((item: any) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice
                    }))
                }
            }
        });

        // 5. If Status is SENT, Post to Ledger
        if (sale.status === 'SENT') {
            await AccountingEngine.postSaleInvoice(sale.id);
        }

        return NextResponse.json(sale);

    } catch (error: any) {
        console.error("Error generating sale:", error);
        // Handle unique constraint on Invoice Number
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Invoice Number already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || "Failed to create sale" }, { status: 500 });
    }
}
