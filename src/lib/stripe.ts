import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production') {
    // throw new Error('STRIPE_SECRET_KEY is not defined');
    console.warn('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
    apiVersion: '2025-12-15.clover', // Use a recent version
});
