#!/usr/bin/env node

/**
 * One-time script to sync all subscription plans with Razorpay
 * Run: node scripts/sync-razorpay-plans.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import after env is loaded
const { syncPlansWithRazorpay } = await import('../server/utils/razorpayPlans.js');

async function main() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   Razorpay Plans Synchronization Script       ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Validate environment variables
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error('❌ Error: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env file');
        process.exit(1);
    }

    console.log('🔑 Credentials loaded successfully');
    console.log(`📍 Key ID: ${process.env.RAZORPAY_KEY_ID.slice(0, 8)}...`);
    console.log('');

    try {
        const results = await syncPlansWithRazorpay();

        console.log('\n✅ Plan synchronization completed successfully!');
        console.log('\n📝 Next Steps:');
        console.log('  1. Verify plans in Razorpay Dashboard: https://dashboard.razorpay.com/app/subscriptions/plans');
        console.log('  2. Note down the plan IDs (shown above)');
        console.log('  3. Server will automatically load these plans on startup');
        console.log('  4. Set up webhooks at: https://dashboard.razorpay.com/app/webhooks');
        console.log('     - Webhook URL: https://your-domain.com/api/webhook/razorpay');
        console.log('     - Events: subscription.charged, subscription.cancelled, payment.failed');
        console.log('     - Add the webhook secret to .env as RAZORPAY_WEBHOOK_SECRET\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Plan synchronization failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

main();
