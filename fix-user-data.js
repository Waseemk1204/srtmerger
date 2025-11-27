import 'dotenv/config';
import dbModule from './server/config/db.js';
import { ObjectId } from 'mongodb';

const { connectDB, getDB } = dbModule;

async function fixUserData() {
    try {
        await connectDB();
        const db = getDB();
        const users = db.collection('users');

        const userId = '69277435aabbf157a71823b6';

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    subscription: {
                        plan: 'free',
                        status: 'active'
                    },
                    usage: {
                        date: '2025-11-26',  // Yesterday's date for testing reset
                        uploadCount: 0
                    }
                }
            }
        );

        console.log('✅ User data updated successfully!');
        console.log('Modified count:', result.modifiedCount);

        // Verify the update
        const user = await users.findOne({ _id: new ObjectId(userId) });
        console.log('\nUpdated user data:');
        console.log('Subscription:', user.subscription);
        console.log('Usage:', user.usage);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating user data:', error);
        process.exit(1);
    }
}

fixUserData();
