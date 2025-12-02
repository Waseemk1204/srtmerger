import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import authMiddleware from '../middleware/auth.js';
import { toObjectId } from '../utils/objectIdValidator.js';
import { initializePlanIds, getRazorpayPlanId, PLAN_CONFIG } from '../utils/razorpayPlans.js';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID?.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET?.trim()
});

// Initialize plan IDs on module load
let initializationPromise = initializePlanIds()
    .then(() => {
        console.log('✓ Razorpay plan IDs loaded successfully');
        return true;
    })
    .catch(err => {
        console.error('✗ Failed to load Razorpay plan IDs:', err.message);
        console.error('⚠️  Please run: node scripts/sync-razorpay-plans.js');
        return false;
    });

router.use(authMiddleware);

// Create Subscription (replaces create-order)
router.post('/create-subscription', async (req, res) => {
    try {
        // Ensure plans are initialized
        const initialized = await initializationPromise;
        if (!initialized) {
            // Try one more time if failed previously
            try {
                await initializePlanIds();
            } catch (e) {
                return res.status(500).json({
                    error: 'Payment system not ready. Please contact support.',
                    details: 'Failed to initialize plan IDs'
                });
            }
        }

        const { planId } = req.body;

        // Get user details
        const db = getDB();
        const users = db.collection('users');
        const user = await users.findOne({ _id: toObjectId(req.user.userId, 'User ID') });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate plan exists
        const selectedPlan = PLAN_CONFIG[planId];
        if (!selectedPlan) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        // Get Razorpay plan ID
        let razorpayPlanId;
        try {
            razorpayPlanId = getRazorpayPlanId(planId);
        } catch (error) {
            console.error('Plan ID lookup failed:', error.message);
            console.error('Available plans:', Object.keys(require('../utils/razorpayPlans.js').RAZORPAY_PLAN_IDS));
            return res.status(500).json({ error: 'Subscription plan not found. Please contact support.' });
        }

        // Create subscription options
        const subscriptionOptions = {
            plan_id: razorpayPlanId,
            total_count: 1200, // Set to a large number (e.g. 100 years) for "infinite" renewal
            quantity: 1,
            customer_notify: 1, // Notify customer via email/SMS
            notes: {
                userId: req.user.userId,
                planId: planId,
                planType: selectedPlan.plan,
                currency: 'INR',
                userEmail: user.email || '',
                userName: user.name || ''
            }
        };

        // Create subscription
        try {
            const subscription = await razorpay.subscriptions.create(subscriptionOptions);
            console.log('✓ Subscription created:', subscription.id);

            res.json({
                id: subscription.id,
                plan_id: razorpayPlanId,
                status: subscription.status,
                short_url: subscription.short_url
            });
        } catch (rzpError) {
            console.error('Razorpay subscription creation failed:', rzpError);
            throw rzpError; // Re-throw to be caught by outer catch
        }
    } catch (error) {
        console.error('Create subscription error:', error);

        // Extract meaningful error message
        const errorMessage = error.error?.description || error.message || 'Unknown error';
        const errorDetails = error.error || error;

        res.status(500).json({
            error: 'Failed to create subscription',
            message: errorMessage,
            details: errorDetails
        });
    }
});

// Verify Subscription Payment (replaces verify-payment)
router.post('/verify-subscription', async (req, res) => {
    try {
        const {
            razorpay_subscription_id,
            razorpay_payment_id,
            razorpay_signature,
            planId
        } = req.body;

        // Verify signature
        const body = razorpay_payment_id + '|' + razorpay_subscription_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET?.trim())
            .update(body.toString())
            .digest('hex');

        console.log('--- Subscription Verification Debug ---');
        console.log('Plan ID:', planId);
        console.log('Subscription ID:', razorpay_subscription_id);
        console.log('Payment ID:', razorpay_payment_id);
        console.log('Signature Match:', expectedSignature === razorpay_signature);
        console.log('---------------------------------------');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // Fetch subscription details from Razorpay
        const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);

        // Get user and validate plan
        const db = getDB();
        const users = db.collection('users');
        const user = await users.findOne({ _id: toObjectId(req.user.userId, 'User ID') });

        const selectedPlan = PLAN_CONFIG[planId];

        if (!selectedPlan) {
            return res.status(400).json({ error: 'Invalid plan configuration' });
        }

        // Calculate dates based on billing cycle
        const currentPeriodStart = new Date(subscription.current_start * 1000);
        const currentPeriodEnd = new Date(subscription.current_end * 1000);
        const nextBillingDate = new Date(subscription.charge_at * 1000);

        // Update user subscription
        await users.updateOne(
            { _id: toObjectId(req.user.userId, 'User ID') },
            {
                $set: {
                    subscription: {
                        plan: selectedPlan.plan,
                        status: 'active',
                        expiryDate: currentPeriodEnd,
                        razorpaySubscriptionId: razorpay_subscription_id,
                        razorpayPlanId: subscription.plan_id,
                        razorpayCustomerId: subscription.customer_id || null,
                        nextBillingDate: nextBillingDate,
                        currentPeriodStart: currentPeriodStart,
                        currentPeriodEnd: currentPeriodEnd,
                        currency: 'INR',
                        cancelledAt: null
                    }
                }
            }
        );

        console.log('✓ Subscription activated for user:', req.user.userId);

        res.json({
            success: true,
            message: 'Subscription activated successfully',
            subscription: {
                plan: selectedPlan.plan,
                status: 'active',
                nextBillingDate: nextBillingDate,
                currentPeriodEnd: currentPeriodEnd
            }
        });
    } catch (error) {
        console.error('Verify subscription error:', error);
        res.status(500).json({ error: 'Subscription verification failed' });
    }
});

// Cancel Subscription
router.post('/cancel-subscription', async (req, res) => {
    try {
        const db = getDB();
        const users = db.collection('users');
        const user = await users.findOne({ _id: toObjectId(req.user.userId, 'User ID') });

        if (!user?.subscription?.razorpaySubscriptionId) {
            return res.status(400).json({ error: 'No active subscription found' });
        }

        const subscriptionId = user.subscription.razorpaySubscriptionId;

        // Cancel subscription on Razorpay (with access until period end)
        await razorpay.subscriptions.cancel(subscriptionId, {
            cancel_at_cycle_end: 1 // 1 = cancel at end of billing cycle, 0 = cancel immediately
        });

        // Update local subscription status
        await users.updateOne(
            { _id: toObjectId(req.user.userId, 'User ID') },
            {
                $set: {
                    'subscription.status': 'cancelled',
                    'subscription.cancelledAt': new Date()
                }
            }
        );

        console.log('✓ Subscription cancelled for user:', req.user.userId);

        res.json({
            success: true,
            message: 'Subscription cancelled successfully. Access will continue until the end of your billing period.'
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// Get Subscription Status
router.get('/subscription-status', async (req, res) => {
    try {
        const db = getDB();
        const users = db.collection('users');
        const user = await users.findOne({ _id: toObjectId(req.user.userId, 'User ID') });

        if (!user?.subscription?.razorpaySubscriptionId) {
            return res.json({
                hasSubscription: false,
                plan: 'free'
            });
        }

        // Fetch latest status from Razorpay
        const subscription = await razorpay.subscriptions.fetch(
            user.subscription.razorpaySubscriptionId
        );

        res.json({
            hasSubscription: true,
            plan: user.subscription.plan,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_end * 1000),
            nextBillingDate: new Date(subscription.charge_at * 1000),
            cancelAtCycleEnd: subscription.cancel_at_cycle_end === 1
        });
    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
});

export default router;
