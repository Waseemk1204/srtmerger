import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID?.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET?.trim()
});

// Plan configuration - INR only (Indian Rupees)
export const PLAN_CONFIG = {
    'tier1-weekly': {
        amount: 9900,
        plan: 'tier1',
        duration: 'weekly',
        name: 'Basic Plan - Weekly',
        description: '20 daily uploads, renaming, and timeline alignment'
    },
    'tier1-monthly': {
        amount: 29900,
        plan: 'tier1',
        duration: 'monthly',
        name: 'Basic Plan - Monthly',
        description: '20 daily uploads, renaming, and timeline alignment'
    },
    'tier1-yearly': {
        amount: 299900,
        plan: 'tier1',
        duration: 'yearly',
        name: 'Basic Plan - Yearly',
        description: '20 daily uploads, renaming, and timeline alignment'
    },
    'tier2-weekly': {
        amount: 19900,
        plan: 'tier2',
        duration: 'weekly',
        name: 'Pro Plan - Weekly',
        description: '100 daily uploads, merge preview, and all Basic features'
    },
    'tier2-monthly': {
        amount: 59900,
        plan: 'tier2',
        duration: 'monthly',
        name: 'Pro Plan - Monthly',
        description: '100 daily uploads, merge preview, and all Basic features'
    },
    'tier2-yearly': {
        amount: 599900,
        plan: 'tier2',
        duration: 'yearly',
        name: 'Pro Plan - Yearly',
        description: '100 daily uploads, merge preview, and all Basic features'
    },
    'tier3-weekly': {
        amount: 39900,
        plan: 'tier3',
        duration: 'weekly',
        name: 'Unlimited Pro - Weekly',
        description: 'Unlimited uploads, text editing, and priority support'
    },
    'tier3-monthly': {
        amount: 99900,
        plan: 'tier3',
        duration: 'monthly',
        name: 'Unlimited Pro - Monthly',
        description: 'Unlimited uploads, text editing, and priority support'
    },
    'tier3-yearly': {
        amount: 999900,
        plan: 'tier3',
        duration: 'yearly',
        name: 'Unlimited Pro - Yearly',
        description: 'Unlimited uploads, text editing, and priority support'
    }
};

// Storage for Razorpay Plan IDs (will be populated after sync)
export const RAZORPAY_PLAN_IDS = {};

/**
 * Convert duration to Razorpay period format
 */
function getPeriodConfig(duration) {
    switch (duration) {
        case 'weekly':
            return { period: 'weekly', interval: 1 };
        case 'monthly':
            return { period: 'monthly', interval: 1 };
        case 'yearly':
            return { period: 'yearly', interval: 1 };
        default:
            throw new Error(`Invalid duration: ${duration}`);
    }
}

/**
 * Create a single plan on Razorpay (INR only)
 */
async function createPlan(planKey, planConfig) {
    const { period, interval } = getPeriodConfig(planConfig.duration);

    const planData = {
        period: period,
        interval: interval,
        item: {
            name: planConfig.name,
            amount: planConfig.amount,
            currency: 'INR',
            description: planConfig.description
        },
        notes: {
            plan_key: planKey,
            tier: planConfig.plan,
            duration: planConfig.duration
        }
    };

    try {
        const plan = await razorpay.plans.create(planData);
        console.log(`✓ Created plan: ${planKey} (INR) - ID: ${plan.id}`);
        return plan;
    } catch (error) {
        console.error(`✗ Failed to create plan: ${planKey} (INR)`, error.error);
        throw error;
    }
}

/**
 * Fetch all existing plans from Razorpay
 */
async function fetchExistingPlans() {
    try {
        // Fetch up to 100 plans to ensure we get all of them
        // Default is 10, which might miss plans if there are many
        const plans = await razorpay.plans.all({ count: 100 });
        return plans.items || [];
    } catch (error) {
        console.error('Failed to fetch existing plans:', error);
        return [];
    }
}

/**
 * Sync all plans with Razorpay (INR only)
 * Creates plans that don't exist, skips existing ones
 */
export async function syncPlansWithRazorpay() {
    console.log('🔄 Starting Razorpay Plans synchronization (INR only)...\n');

    // Fetch existing plans
    const existingPlans = await fetchExistingPlans();
    console.log(`Found ${existingPlans.length} existing plans on Razorpay\n`);

    const results = {
        created: [],
        existing: [],
        failed: []
    };

    console.log('📦 Processing INR plans...');
    // Process all plans
    for (const [planKey, planConfig] of Object.entries(PLAN_CONFIG)) {
        // Match by plan_key only (ignore currency in notes as we are INR-only now)
        const existing = existingPlans.find(p =>
            p.notes?.plan_key === planKey
        );

        if (existing) {
            console.log(`⏭  Plan already exists: ${planKey} (INR) - ID: ${existing.id}`);
            RAZORPAY_PLAN_IDS[planKey] = existing.id;
            results.existing.push({ planKey, planId: existing.id });
        } else {
            try {
                const plan = await createPlan(planKey, planConfig);
                RAZORPAY_PLAN_IDS[planKey] = plan.id;
                results.created.push({ planKey, planId: plan.id });
            } catch (error) {
                results.failed.push({ planKey, error: error.message });
            }
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Synchronization Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Created: ${results.created.length} plans`);
    console.log(`⏭  Existing: ${results.existing.length} plans`);
    console.log(`❌ Failed: ${results.failed.length} plans`);

    if (results.failed.length > 0) {
        console.log('\n⚠️  Failed Plans:');
        results.failed.forEach(f => {
            console.log(`  - ${f.planKey}: ${f.error}`);
        });
    }

    console.log('\n' + '='.repeat(50));
    console.log('Plan ID Mapping (INR):');
    console.log('='.repeat(50));
    console.log(JSON.stringify(RAZORPAY_PLAN_IDS, null, 2));

    return results;
}

/**
 * Get Razorpay plan ID for a given plan key
 */
export function getRazorpayPlanId(planKey) {
    const planId = RAZORPAY_PLAN_IDS[planKey];

    if (!planId) {
        throw new Error(`No Razorpay plan ID found for ${planKey}. Please run plan sync first.`);
    }

    return planId;
}

/**
 * Initialize plan IDs from existing Razorpay plans
 * Call this on server startup to populate RAZORPAY_PLAN_IDS
 */
export async function initializePlanIds() {
    try {
        const existingPlans = await fetchExistingPlans();

        existingPlans.forEach(plan => {
            const planKey = plan.notes?.plan_key;

            if (planKey) {
                RAZORPAY_PLAN_IDS[planKey] = plan.id;
            }
        });

        console.log('✓ Razorpay plan IDs initialized');
        return RAZORPAY_PLAN_IDS;
    } catch (error) {
        console.error('Failed to initialize plan IDs:', error);
        throw error;
    }
}
