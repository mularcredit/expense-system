
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for validation
const invoiceSchema = z.object({
    vendorId: z.string().min(1, "Vendor is required"),
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    invoiceDate: z.string(),
    dueDate: z.string(),
    amount: z.number().min(0),
    currency: z.string().default("USD"),
    description: z.string().optional(),
    fileUrl: z.string().optional().nullable(),
    requisitionId: z.string().optional().nullable(),
    items: z.array(z.object({
        description: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        total: z.number(),
        category: z.string().optional(),
    })).optional()
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = invoiceSchema.parse(body);

        // Check if invoice number already exists for this vendor (optional check, but good for data integrity)
        const existing = await prisma.invoice.findUnique({
            where: { invoiceNumber: validatedData.invoiceNumber }
        });

        if (existing) {
            return NextResponse.json({ error: "Invoice number already exists" }, { status: 400 });
        }

        // Create Invoice with Line Items
        const invoice = await prisma.invoice.create({
            data: {
                vendorId: validatedData.vendorId,
                invoiceNumber: validatedData.invoiceNumber,
                invoiceDate: new Date(validatedData.invoiceDate),
                dueDate: new Date(validatedData.dueDate),
                amount: validatedData.amount,
                currency: validatedData.currency,
                description: validatedData.description,
                requisitionId: validatedData.requisitionId,
                fileUrl: validatedData.fileUrl,
                createdById: session.user.id,
                status: "PENDING_APPROVAL", // Start as pending
                paymentStatus: "UNPAID",
                items: {
                    create: validatedData.items || []
                }
            }
        });

        // If linked to a requisition, we might want to update the requisition status or linking
        // For now, straightforward creation.

        return NextResponse.json(invoice);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("Failed to create invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const where: any = {};
        if (status) where.status = status;

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                vendor: { select: { name: true } },
                createdBy: { select: { name: true } },
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
