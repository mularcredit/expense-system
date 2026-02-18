import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        if (user.role !== 'SYSTEM_ADMIN') {
            return NextResponse.json({ error: "Forbidden: System Admin access required" }, { status: 403 });
        }

        const batches = await prisma.salaryBatch.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { records: true }
                }
            }
        });

        // @ts-ignore
        return NextResponse.json(batches);
    } catch (error: any) {
        console.error("Error fetching salary batches:", error);

        // Detailed error for debugging
        if (!prisma) console.error("Prisma client is undefined");
        // @ts-ignore
        else if (!prisma.salaryBatch) console.error("Prisma model 'salaryBatch' is missing on client instance");

        return NextResponse.json({
            error: "Failed to fetch salary batches",
            details: error.message
        }, { status: 500 });
    }
}
