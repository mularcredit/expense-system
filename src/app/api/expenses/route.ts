import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { approvalWorkflow } from '@/lib/approval-workflow';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Base validation schema (for admins - no amount limit)
const createExpenseSchemaAdmin = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().optional(),
    amount: z.number().positive('Amount must be positive'), // No max for admins
    category: z.string().min(1, 'Category is required'),
    expenseDate: z.string().transform(str => new Date(str)),
    merchant: z.string().optional(),
    receiptUrl: z.string().url().optional().or(z.literal('')),
    paymentMethod: z.enum(['PERSONAL_CARD', 'CORPORATE_CARD', 'CASH', 'DIRECT_BILL', 'WALLET']).default('PERSONAL_CARD'),
    requisitionId: z.string().optional(),
    isReimbursable: z.boolean().default(true),
    isBillable: z.boolean().default(false),
});

// Validation schema for regular users (Limit controlled by Policy Engine)
const createExpenseSchemaUser = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    category: z.string().min(1, 'Category is required'),
    expenseDate: z.string().transform(str => new Date(str)),
    merchant: z.string().optional(),
    receiptUrl: z.string().url().optional().or(z.literal('')),
    paymentMethod: z.enum(['PERSONAL_CARD', 'CORPORATE_CARD', 'CASH', 'DIRECT_BILL', 'WALLET']).default('PERSONAL_CARD'),
    requisitionId: z.string().optional(),
    isReimbursable: z.boolean().default(true),
    isBillable: z.boolean().default(false),
});

/**
 * Create a new expense with automatic workflow routing
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';

        const body = await request.json();

        // Validate input - use appropriate schema based on role
        const validatedData = isAdmin
            ? createExpenseSchemaAdmin.parse(body)
            : createExpenseSchemaUser.parse(body);

        // 1. Create the expense
        const expense = await prisma.expense.create({
            data: {
                userId: session.user.id,
                title: validatedData.title,
                description: validatedData.description,
                amount: validatedData.amount,
                category: validatedData.category,
                expenseDate: validatedData.expenseDate,
                merchant: validatedData.merchant,
                receiptUrl: validatedData.receiptUrl || null,
                paymentMethod: validatedData.paymentMethod,
                requisitionId: validatedData.requisitionId,
                isReimbursable: validatedData.isReimbursable,
                isBillable: validatedData.isBillable,
                status: 'SUBMITTED', // Initial status
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: true
                    }
                }
            }
        });

        // 2. Determine approval route using the workflow engine
        const route = await approvalWorkflow.determineRoute(
            session.user.id,
            validatedData.amount,
            validatedData.category,
            !!validatedData.receiptUrl
        );

        // 3. Create approval records automatically
        const approvals = await approvalWorkflow.createApprovals(expense.id, route);

        console.log(`✅ Expense created: ${expense.id}`);
        console.log(`✅ Approval route: ${route.autoApprove ? 'Auto-approved' : `${route.levels.length} level(s)`}`);
        console.log(`✅ Approvals created: ${approvals.length}`);

        // TODO: Send notification emails to approvers
        // if (!route.autoApprove && approvals.length > 0) {
        //   await sendApprovalNotifications(expense, approvals);
        // }

        return NextResponse.json({
            success: true,
            message: route.autoApprove
                ? 'Expense auto-approved!'
                : 'Expense submitted for approval',
            expense: {
                id: expense.id,
                title: expense.title,
                amount: expense.amount,
                status: expense.status,
                createdAt: expense.createdAt
            },
            workflow: {
                autoApproved: route.autoApprove,
                reason: route.reason,
                estimatedDays: route.estimatedDays,
                approvalLevels: route.levels.length,
                approvers: route.levels.map(level => ({
                    level: level.level,
                    approvers: level.approvers.map(a => a.name),
                    required: level.required
                }))
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Expense creation error:', error);

        // Handle validation errors
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: error.issues.map((e: any) => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create expense', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Get expenses for the current user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const expenses = await prisma.expense.findMany({
            where: {
                userId: session.user.id,
                ...(status ? { status } : {})
            },
            include: {
                approvals: {
                    include: {
                        approver: {
                            select: { name: true, email: true, role: true }
                        }
                    },
                    orderBy: { level: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });

        const total = await prisma.expense.count({
            where: {
                userId: session.user.id,
                ...(status ? { status } : {})
            }
        });

        return NextResponse.json({
            expenses,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });

    } catch (error: any) {
        console.error('Get expenses error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch expenses', details: error.message },
            { status: 500 }
        );
    }
}
