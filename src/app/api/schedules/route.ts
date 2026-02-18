import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const schedules = await prisma.schedule.findMany({
            include: {
                vendor: true,
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                executions: {
                    orderBy: { scheduledFor: 'desc' },
                    take: 5,
                },
            },
            orderBy: { nextRun: 'asc' },
        });

        return NextResponse.json({ schedules });
    } catch (error) {
        console.error("Get schedules error:", error);
        return NextResponse.json(
            { error: "Failed to fetch schedules" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const {
            name,
            description,
            type,
            frequency,
            startDate,
            endDate,
            amount,
            currency,
            vendorId,
            categoryId,
            accountId,
            requiresApproval,
            approverId,
        } = await req.json();

        // Validate required fields
        if (!name || !type || !frequency || !startDate || !amount) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Calculate next run date based on frequency
        const nextRun = calculateNextRun(new Date(startDate), frequency);

        const schedule = await prisma.schedule.create({
            data: {
                name,
                description,
                type,
                frequency,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                nextRun,
                amount: parseFloat(amount),
                currency: currency || "USD",
                vendorId,
                categoryId,
                accountId,
                requiresApproval: requiresApproval || false,
                approverId,
                createdById: user.id,
                isActive: true,
            },
            include: {
                vendor: true,
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ schedule }, { status: 201 });
    } catch (error) {
        console.error("Create schedule error:", error);
        return NextResponse.json(
            { error: "Failed to create schedule" },
            { status: 500 }
        );
    }
}

function calculateNextRun(startDate: Date, frequency: string): Date {
    const next = new Date(startDate);
    const now = new Date();

    // If start date is in the future, return it
    if (next > now) {
        return next;
    }

    // Calculate next occurrence based on frequency
    switch (frequency) {
        case 'DAILY':
            while (next <= now) {
                next.setDate(next.getDate() + 1);
            }
            break;
        case 'WEEKLY':
            while (next <= now) {
                next.setDate(next.getDate() + 7);
            }
            break;
        case 'MONTHLY':
            while (next <= now) {
                next.setMonth(next.getMonth() + 1);
            }
            break;
        case 'QUARTERLY':
            while (next <= now) {
                next.setMonth(next.getMonth() + 3);
            }
            break;
        case 'YEARLY':
            while (next <= now) {
                next.setFullYear(next.getFullYear() + 1);
            }
            break;
        default:
            break;
    }

    return next;
}
