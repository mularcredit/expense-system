import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * GET /api/reports/ledger?all=true
 * Returns all journal entries (with lines + account info) for export.
 * Only accessible to authenticated users.
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || "";

    try {
        const entries = await (prisma as any).journalEntry.findMany({
            where: search
                ? {
                    OR: [
                        { description: { contains: search, mode: "insensitive" } },
                        { reference: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {},
            orderBy: { date: "desc" },
            include: {
                lines: {
                    include: { account: true },
                },
            },
        });

        return NextResponse.json(entries);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
