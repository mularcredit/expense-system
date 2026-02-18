import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const batch = await prisma.salaryBatch.findUnique({
            where: { id },
            include: {
                records: {
                    orderBy: { employeeName: 'asc' }
                },
                expense: {
                    select: { status: true, id: true }
                },
                createdBy: {
                    select: { name: true, email: true }
                }
            }
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        return NextResponse.json(batch);
    } catch (error) {
        console.error("Error fetching salary batch:", error);
        return NextResponse.json({ error: "Failed to fetch salary batch" }, { status: 500 });
    }
}
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { records, title, status } = body;

        console.log(`Updating batch ${id}:`, { title, status, recordCount: records?.length });

        // Use a transaction for bulk updates with increased timeout
        const updatedBatch = await prisma.$transaction(async (tx) => {
            // Update batch metadata if provided
            if (title || status) {
                await (tx as any).salaryBatch.update({
                    where: { id },
                    data: {
                        ...(title && { title }),
                        ...(status && { status })
                    }
                });
            }

            // Update individual records if provided - USE PARALLEL UPDATES IN CHUNKS
            if (records && Array.isArray(records)) {
                // Process in chunks of 50 to avoid overwhelming the database
                const CHUNK_SIZE = 50;
                for (let i = 0; i < records.length; i += CHUNK_SIZE) {
                    const chunk = records.slice(i, i + CHUNK_SIZE);
                    await Promise.all(
                        chunk.map(record => {
                            if (record.id) {
                                return (tx as any).salaryRecord.update({
                                    where: { id: record.id },
                                    data: {
                                        employeeName: record.employeeName,
                                        bankName: record.bankName || null,
                                        accountNumber: record.accountNumber || null,
                                        amount: Number(record.amount),
                                        notes: record.notes || null
                                    }
                                });
                            }
                            return Promise.resolve();
                        })
                    );
                }

                // Recalculate total amount for the batch
                const allRecords = await (tx as any).salaryRecord.findMany({
                    where: { batchId: id }
                });
                const newTotal = allRecords.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);

                const batch = await (tx as any).salaryBatch.update({
                    where: { id },
                    data: { totalAmount: newTotal },
                    include: { expense: true }
                });

                // Sync with expense amount if linked
                if (batch.expenseId) {
                    await (tx as any).expense.update({
                        where: { id: batch.expenseId },
                        data: { amount: newTotal }
                    });
                }
            }

            return (tx as any).salaryBatch.findUnique({
                where: { id },
                include: {
                    records: { orderBy: { employeeName: 'asc' } },
                    expense: true,
                    createdBy: { select: { name: true, email: true } }
                }
            });
        }, {
            timeout: 30000 // Increase timeout to 30 seconds
        });

        return NextResponse.json(updatedBatch);
    } catch (error: any) {
        console.error("Error updating salary batch:", error);
        return NextResponse.json({
            error: "Failed to update salary batch",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
