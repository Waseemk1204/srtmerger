import { getDB } from '../config/db.js';

/**
 * Checks if a user's subscription has expired and downgrades them if necessary.
 * Compatible with Razorpay Subscriptions - only acts if no active Razorpay subscription.
 * @param {Object} user - The user object from the database.
 * @returns {Promise<Object>} - The updated user object (or the original if no changes).
 */
export async function checkSubscriptionExpiry(user) {
    if (!user || !user.subscription || user.subscription.plan === 'free') {
        return user;
    }

    const expiryDate = user.subscription.expiryDate ? new Date(user.subscription.expiryDate) : null;
    const now = new Date();

    // If user has a Razorpay subscription, let webhooks handle expiry
    // Our manual check only applies to legacy subscriptions without Razorpay IDs
    if (user.subscription.razorpaySubscriptionId) {
        // For Razorpay subscriptions:
        // - Webhooks handle 'active' state
        // - 'cancelled' subscriptions keep access until expiryDate
        // - Only downgrade if expiry has passed AND status is 'cancelled' or 'expired'

        if (expiryDate && expiryDate < now) {
            const status = user.subscription.status;

            // Only downgrade if already cancelled/expired by webhook
            if (status === 'cancelled' || status === 'expired') {
                console.log(`Razorpay subscription expired for user ${user._id}. Downgrading to free.`);

                const db = getDB();
                const users = db.collection('users');

                const updates = {
                    'subscription.plan': 'free',
                    'subscription.status': 'expired',
                    'subscription.expiryDate': null,
                    'subscription.nextBillingDate': null
                };

                await users.updateOne(
                    { _id: user._id },
                    { $set: updates }
                );

                return {
                    ...user,
                    subscription: {
                        ...user.subscription,
                        plan: 'free',
                        status: 'expired',
                        expiryDate: null,
                        nextBillingDate: null
                    }
                };
            }
        }

        // Don't touch active or paused subscriptions - webhooks manage those
        return user;
    }

    // Legacy subscription (no Razorpay ID) - manual expiry check
    if (expiryDate && expiryDate < now) {
        console.log(`Legacy subscription expired for user ${user._id}. Downgrading to free.`);

        const db = getDB();
        const users = db.collection('users');

        const updates = {
            'subscription.plan': 'free',
            'subscription.status': 'expired',
            'subscription.expiryDate': null
        };

        await users.updateOne(
            { _id: user._id },
            { $set: updates }
        );

        return {
            ...user,
            subscription: {
                ...user.subscription,
                plan: 'free',
                status: 'expired',
                expiryDate: null
            }
        };
    }

    return user;
}
