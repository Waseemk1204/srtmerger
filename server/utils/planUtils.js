import { ObjectId } from 'mongodb';

/**
 * Get the effective plan for a user, considering subscription expiry
 * @param user - User object from database
 * @returns Current effective plan ('free', 'tier1', 'tier2', or 'tier3')
 */
export const getCurrentPlan = (user) => {
    // If no subscription or explicitly free, return free
    if (!user?.subscription?.plan || user.subscription.plan === 'free') {
        return 'free';
    }

    // Check if subscription has expired
    const expiryDate = user.subscription.expiryDate ? new Date(user.subscription.expiryDate) : null;
    if (expiryDate && expiryDate < new Date()) {
        // Subscription expired, downgrade to free
        return 'free';
    }

    // Valid subscription
    return user.subscription.plan;
};

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS = {
    free: 4,
    tier1: 20,
    tier2: 100,
    tier3: Infinity
};

/**
 * Check if a user can access a specific feature based on their plan
 * @param user - User object from database  
 * @param feature - Feature to check ('rename', 'edit', 'align', 'preview')
 * @returns boolean indicating if feature is available
 */
export const canAccessFeature = (user, feature) => {
    const currentPlan = getCurrentPlan(user);

    const featureAccess = {
        rename: ['tier1', 'tier2', 'tier3'],
        edit: ['tier2', 'tier3'],
        align: ['tier1', 'tier2', 'tier3'],
        preview: ['tier2', 'tier3']
    };

    return featureAccess[feature]?.includes(currentPlan) || false;
};
