import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { branch, amount, category, description } = body;

        // Validate required fields
        if (!branch || !amount || !category) {
            return NextResponse.json(
                { error: 'Missing required fields: branch, amount, category' },
                { status: 400 }
            );
        }

        // Get user's wallet
        let wallet = await prisma.wallet.findUnique({
            where: { userId: session.user.id }
        });

        if (!wallet) {
            // Auto-create wallet if it doesn't exist
            wallet = await prisma.wallet.create({
                data: {
                    userId: session.user.id,
                    balance: 0,
                    currency: 'USD'
                }
            });
        }

        // Check if user has sufficient balance
        if (wallet.balance < parseFloat(amount)) {
            return NextResponse.json(
                { error: 'Insufficient balance' },
                { status: 400 }
            );
        }

        const transaction = await prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                userId: session.user.id,
                type: 'DEDUCTION', // Valid type from schema
                amount: -parseFloat(amount), // Negative for deduction
                description: description || `Allocated ${amount} to ${branch} for ${category}`,
                reference: `ALLOC-${Date.now()}`
            }
        });

        // Update wallet balance
        await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                balance: {
                    decrement: parseFloat(amount)
                }
            }
        });

        return NextResponse.json({
            success: true,
            transaction,
            message: `Successfully allocated $${amount} to ${branch}`
        });

    } catch (error) {
        console.error('Wallet allocation error:', error);
        return NextResponse.json(
            { error: 'Failed to allocate funds' },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch wallet transactions
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const wallet = await prisma.wallet.findUnique({
            where: { userId: session.user.id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        });

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        return NextResponse.json({
            balance: wallet.balance,
            currency: wallet.currency,
            transactions: wallet.transactions
        });

    } catch (error) {
        console.error('Wallet fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch wallet data' },
            { status: 500 }
        );
    }
}
