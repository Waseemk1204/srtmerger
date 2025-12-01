import { getDB } from '../config/db.js';

/**
 * Checks if a user's subscription has expired and downgrades them if necessary.
 * @param {Object} user - The user object from the database.
 * @returns {Promise<Object>} - The updated user object (or the original if no changes).
 */
export async function checkSubscriptionExpiry(user) {
    if (!user || !user.subscription || user.subscription.plan === 'free') {
        return user;
    }

    const expiryDate = user.subscription.expiryDate ? new Date(user.subscription.expiryDate) : null;
    const now = new Date();

    // If expiry date exists and is in the past
    if (expiryDate && expiryDate < now) {
        console.log(`Subscription expired for user ${user._id}. Downgrading to free.`);

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

        // Return updated user object
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
