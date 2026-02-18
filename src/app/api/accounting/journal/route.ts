
import { auth } from "@/auth";
import { AccountingEngine } from "@/lib/accounting/accounting-engine";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    try {
        // For the demo, we need to map the "placeholder" lines from the frontend 
        // to real Account IDs if they are missing.
        // In a real usage, the frontend dropdown would send valid Account IDs.
        // Let's look up a default Cash and Expense account for the demo test.

        let lines = body.lines;

        // DEMO HACK: If no accountId provided, auto-assign valid ones for testing
        if (!lines[0].accountId) {
            const cashAccount = await prisma.account.findFirst({ where: { code: '1000' } });
            const expAccount = await prisma.account.findFirst({ where: { code: '6000' } });

            if (cashAccount && expAccount) {
                lines[0].accountId = expAccount.id; // Debit Expense
                lines[0].debit = 100; // Mock Value
                lines[0].credit = 0;

                lines[1].accountId = cashAccount.id; // Credit Cash
                lines[1].debit = 0;
                lines[1].credit = 100;
            }
        }

        const entry = await AccountingEngine.postJournalEntry({
            date: new Date(body.date),
            description: body.description,
            reference: body.reference,
            userId: session.user.id,
            lines: lines
        });

        return NextResponse.json(entry);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, customRole: { select: { isSystem: true } } }
    });

    const isAdmin = user?.role === 'SYSTEM_ADMIN' || user?.customRole?.isSystem;
    if (!isAdmin) {
        return NextResponse.json({ error: "Only System Admins can delete journal entries" }, { status: 403 });
    }

    try {
        // Find if it's a manual entry (doesn't have an automated source) or if user just wants to wipe test data
        // For testing/development, we allow deletion.
        await (prisma as any).journalLine.deleteMany({
            where: { entryId: id }
        });

        await (prisma as any).journalEntry.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
