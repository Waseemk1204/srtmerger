import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Plans Configuration
const PLANS = {
    'tier1-weekly': { amount: 9900, plan: 'tier1', duration: 'weekly' },   // ₹99
    'tier1-monthly': { amount: 29900, plan: 'tier1', duration: 'monthly' }, // ₹299
    'tier1-yearly': { amount: 299900, plan: 'tier1', duration: 'yearly' },  // ₹2999

    'tier2-weekly': { amount: 19900, plan: 'tier2', duration: 'weekly' },   // ₹199
    'tier2-monthly': { amount: 59900, plan: 'tier2', duration: 'monthly' }, // ₹599
    'tier2-yearly': { amount: 599900, plan: 'tier2', duration: 'yearly' },  // ₹5999

    'tier3-weekly': { amount: 39900, plan: 'tier3', duration: 'weekly' },   // ₹399
    'tier3-monthly': { amount: 99900, plan: 'tier3', duration: 'monthly' }, // ₹999
    'tier3-yearly': { amount: 999900, plan: 'tier3', duration: 'yearly' },  // ₹9999
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
            currency: 'INR',
            receipt: `receipt_${Date.now()}_${req.user.userId}`,
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
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

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

export default router;
