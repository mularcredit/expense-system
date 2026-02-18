import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    // throw new Error('STRIPE_SECRET_KEY is missing');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2023-10-16' as any, // Use latest stable
    typescript: true,
});

/**
 * Stripe Payment Service
 * Handles card payments for wallet funding and Connect payouts for reimbursements.
 */
export class StripeService {
    /**
     * Create a payment intent for wallet top-up
     */
    async createTopUpSession(userId: string, amount: number, currency: string = 'usd') {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: 'Corporate Wallet Top-up',
                            description: `Top up for User ID: ${userId}`,
                        },
                        unit_amount: Math.round(amount * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXTAUTH_URL}/dashboard?p=success`,
            cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?p=cancelled`,
            metadata: {
                userId,
                type: 'WALLET_TOPUP',
            },
        });

        return session;
    }

    /**
     * Handle reimbursement payout via Stripe Connect (Simulated)
     * In production, this requires the employee to have a Stripe Express account.
     */
    async processReimbursement(userId: string, amount: number, currency: string = 'usd') {
        // This is a simplified version of a Stripe Transfer/Payout
        console.log(`[Stripe] Processing reimbursement of ${amount} ${currency} to user ${userId}`);

        // In a real app with Connect:
        // const transfer = await stripe.transfers.create({
        //   amount: Math.round(amount * 100),
        //   currency,
        //   destination: stripeAccountId,
        // });

        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            status: 'succeeded',
            id: `tr_${Math.random().toString(36).substring(2, 12)}`,
            amount,
            currency,
        };
    }
}

export const stripeService = new StripeService();
