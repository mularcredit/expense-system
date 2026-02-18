import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let accountId = user.stripeAccountId;

        if (!accountId) {
            // Create a new Stripe Express account
            const account = await stripe.accounts.create({
                type: 'express',
                email: user.email,
                capabilities: {
                    transfers: { requested: true },
                },
                metadata: {
                    userId: user.id,
                },
            });

            accountId = account.id;

            // Save the account ID to the user
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    stripeAccountId: accountId,
                    stripeConnectStatus: 'PENDING',
                },
            });
        }

        // Create an account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/payments?stripe=refresh`,
            return_url: `${process.env.NEXTAUTH_URL}/dashboard/payments?stripe=success`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });
    } catch (error: any) {
        console.error('Stripe Connect error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
