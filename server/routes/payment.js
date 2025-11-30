import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID?.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET?.trim()
});

// Plans Configuration (amounts in cents for USD)
const PLANS = {
    'tier1-weekly': { amount: 199, plan: 'tier1', duration: 'weekly' },     // $1.99
    'tier1-monthly': { amount: 499, plan: 'tier1', duration: 'monthly' },   // $4.99
    'tier1-yearly': { amount: 3900, plan: 'tier1', duration: 'yearly' },    // $39

    'tier2-weekly': { amount: 399, plan: 'tier2', duration: 'weekly' },     // $3.99
    'tier2-monthly': { amount: 999, plan: 'tier2', duration: 'monthly' },   // $9.99
    'tier2-yearly': { amount: 7900, plan: 'tier2', duration: 'yearly' },    // $79

    'tier3-weekly': { amount: 699, plan: 'tier3', duration: 'weekly' },     // $6.99
    'tier3-monthly': { amount: 1499, plan: 'tier3', duration: 'monthly' },  // $14.99
    'tier3-yearly': { amount: 12900, plan: 'tier3', duration: 'yearly' },   // $129
};

router.use(authMiddleware);

// Create Order
router.post('/create-order', async (req, res) => {
    try {
        const { planId } = req.body;
        const selectedPlan = PLANS[planId];

        if (!selectedPlan) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const options = {
            amount: selectedPlan.amount,
            currency: 'USD',
            receipt: `rcpt_${Date.now().toString().slice(-8)}_${req.user.userId.toString().slice(-6)}`,
            notes: {
                userId: req.user.userId,
                planId: planId,
                planType: selectedPlan.plan
            }
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// Verify Payment
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planId
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET?.trim())
            .update(body.toString())
            .digest('hex');

        // DEBUG LOGGING
        console.log('--- Payment Verification Debug ---');
        console.log('Plan ID:', planId);
        console.log('Razorpay Order ID:', razorpay_order_id);
        console.log('Razorpay Payment ID:', razorpay_payment_id);
        console.log('Received Signature:', razorpay_signature);
        console.log('Calculated Signature:', expectedSignature);
        console.log('Loaded Key ID:', process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.slice(0, 8) + '...' : 'MISSING');
        console.log('Loaded Key Secret:', process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.slice(0, 8) + '...' : 'MISSING');
        console.log('Match?', expectedSignature === razorpay_signature);
        console.log('----------------------------------');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // Payment successful, update user subscription
        const db = getDB();
        const users = db.collection('users');
        const selectedPlan = PLANS[planId];

        // Calculate expiry date
        const expiryDate = new Date();
        if (selectedPlan.duration === 'weekly') expiryDate.setDate(expiryDate.getDate() + 7);
        if (selectedPlan.duration === 'monthly') expiryDate.setMonth(expiryDate.getMonth() + 1);
        if (selectedPlan.duration === 'yearly') expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        await users.updateOne(
            { _id: new ObjectId(req.user.userId) },
            {
                $set: {
                    subscription: {
                        plan: selectedPlan.plan,
                        status: 'active',
                        expiryDate: expiryDate,
                        razorpaySubscriptionId: razorpay_order_id // Storing order ID as ref
                    }
                }
            }
        );

        res.json({ success: true, message: 'Subscription updated successfully' });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// Cancel Subscription
router.post('/cancel-subscription', async (req, res) => {
    try {
        const db = getDB();
        const users = db.collection('users');

        await users.updateOne(
            { _id: new ObjectId(req.user.userId) },
            {
                $set: {
                    'subscription.plan': 'free',
                    'subscription.status': 'canceled',
                    'subscription.expiryDate': null
                }
            }
        );

        res.json({ success: true, message: 'Subscription canceled successfully' });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

export default router;
