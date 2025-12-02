import express from 'express';
import crypto from 'crypto';
import { getDB } from '../config/db.js';
import { toObjectId } from '../utils/objectIdValidator.js';

const router = express.Router();

/**
 * Razorpay Webhook Handler
 * Handles subscription lifecycle events from Razorpay
 * 
 * Events handled:
 * - subscription.charged: Payment successful
 * - subscription.cancelled: Subscription cancelled
 * - subscription.completed: Subscription ended naturally
 * - subscription.paused: Payment failed
 * - payment.failed: Payment attempt failed
 */
router.post('/razorpay', async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

        if (!webhookSecret) {
            console.error('⚠️  RAZORPAY_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook not configured' });
        }

        // Verify webhook signature
        const signature = req.headers['x-razorpay-signature'];
        const body = JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('⚠️  Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body.event;
        const payload = req.body.payload;
        const subscription = payload.subscription?.entity;
        const payment = payload.payment?.entity;

        console.log('📨 Webhook received:', event);

        // Get database connection
        const db = getDB();
        const users = db.collection('users');

        switch (event) {
            case 'subscription.charged':
                // Successful payment - extend subscription
                await handleSubscriptionCharged(users, subscription, payment);
                break;

            case 'subscription.cancelled':
                // User cancelled subscription
                await handleSubscriptionCancelled(users, subscription);
                break;

            case 'subscription.completed':
                // Subscription ended naturally (all cycles complete)
                await handleSubscriptionCompleted(users, subscription);
                break;

            case 'subscription.paused':
                // Payment failed, subscription paused
                await handleSubscriptionPaused(users, subscription);
                break;

            case 'payment.failed':
                // Individual payment attempt failed
                await handlePaymentFailed(users, payment);
                break;

            default:
                console.log(`ℹ️  Unhandled webhook event: ${event}`);
        }

        // Always respond with 200 to acknowledge receipt
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        // Still respond with 200 to prevent retries for processing errors
        res.status(200).json({ status: 'error', message: error.message });
    }
});

/**
 * Handle successful subscription payment
 */
async function handleSubscriptionCharged(users, subscription, payment) {
    try {
        const subscriptionId = subscription.id;
        const currentPeriodStart = new Date(subscription.current_start * 1000);
        const currentPeriodEnd = new Date(subscription.current_end * 1000);
        const nextBillingDate = new Date(subscription.charge_at * 1000);

        // Find user by subscription ID
        const user = await users.findOne({
            'subscription.razorpaySubscriptionId': subscriptionId
        });

        if (!user) {
            console.error(`User not found for subscription: ${subscriptionId}`);
            return;
        }

        // Update subscription dates
        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    'subscription.status': 'active',
                    'subscription.expiryDate': currentPeriodEnd,
                    'subscription.currentPeriodStart': currentPeriodStart,
                    'subscription.currentPeriodEnd': currentPeriodEnd,
                    'subscription.nextBillingDate': nextBillingDate
                }
            }
        );

        console.log(`✓ Subscription charged: ${subscriptionId} - User: ${user._id}`);
    } catch (error) {
        console.error('Error handling subscription.charged:', error);
        throw error;
    }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(users, subscription) {
    try {
        const subscriptionId = subscription.id;
        const currentPeriodEnd = new Date(subscription.current_end * 1000);

        const user = await users.findOne({
            'subscription.razorpaySubscriptionId': subscriptionId
        });

        if (!user) {
            console.error(`User not found for subscription: ${subscriptionId}`);
            return;
        }

        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    'subscription.status': 'cancelled',
                    'subscription.expiryDate': currentPeriodEnd,
                    'subscription.cancelledAt': new Date()
                }
            }
        );

        console.log(`✓ Subscription cancelled: ${subscriptionId} - Access until: ${currentPeriodEnd}`);
    } catch (error) {
        console.error('Error handling subscription.cancelled:', error);
        throw error;
    }
}

/**
 * Handle subscription completion (ended naturally)
 */
async function handleSubscriptionCompleted(users, subscription) {
    try {
        const subscriptionId = subscription.id;

        const user = await users.findOne({
            'subscription.razorpaySubscriptionId': subscriptionId
        });

        if (!user) {
            console.error(`User not found for subscription: ${subscriptionId}`);
            return;
        }

        // Downgrade to free plan
        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    'subscription.plan': 'free',
                    'subscription.status': 'expired',
                    'subscription.expiryDate': null,
                    'subscription.nextBillingDate': null
                }
            }
        );

        console.log(`✓ Subscription completed: ${subscriptionId} - Downgraded to free`);
    } catch (error) {
        console.error('Error handling subscription.completed:', error);
        throw error;
    }
}

/**
 * Handle subscription pause (payment failure)
 */
async function handleSubscriptionPaused(users, subscription) {
    try {
        const subscriptionId = subscription.id;

        const user = await users.findOne({
            'subscription.razorpaySubscriptionId': subscriptionId
        });

        if (!user) {
            console.error(`User not found for subscription: ${subscriptionId}`);
            return;
        }

        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    'subscription.status': 'paused'
                    // Keep plan active temporarily - could add grace period logic here
                }
            }
        );

        console.log(`⚠️  Subscription paused: ${subscriptionId} - Payment failed`);
    } catch (error) {
        console.error('Error handling subscription.paused:', error);
        throw error;
    }
}

/**
 * Handle individual payment failure
 */
async function handlePaymentFailed(users, payment) {
    try {
        const subscriptionId = payment.subscription_id;

        if (!subscriptionId) {
            console.log('ℹ️  Payment failure for non-subscription payment');
            return;
        }

        const user = await users.findOne({
            'subscription.razorpaySubscriptionId': subscriptionId
        });

        if (!user) {
            console.error(`User not found for subscription: ${subscriptionId}`);
            return;
        }

        // Log payment failure - Razorpay will retry automatically
        console.log(`⚠️  Payment failed for subscription: ${subscriptionId} - Will retry`);

        // Optional: Send notification to user about payment failure
        // Could integrate with email service here

    } catch (error) {
        console.error('Error handling payment.failed:', error);
        throw error;
    }
}

export default router;
