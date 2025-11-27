// Migration script to convert usage.date to usage.firstMergeTime
// Run this once to migrate existing users

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateUsageSchema() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('srtmerger');
        const users = db.collection('users');

        // Find all users with old date field
        const usersWithOldSchema = await users.find({ 'usage.date': { $exists: true } }).toArray();

        console.log(`Found ${usersWithOldSchema.length} users with old schema`);

        for (const user of usersWithOldSchema) {
            const usageDate = user.usage?.date;
            const uploadCount = user.usage?.uploadCount || 0;

            // Convert date string to timestamp (use start of day as approximation)
            const firstMergeTime = usageDate
                ? new Date(usageDate + 'T00:00:00.000Z').toISOString()
                : new Date().toISOString(); // If no date, use now

            console.log(`Migrating user ${user.email}:`, {
                oldDate: usageDate,
                newFirstMergeTime: firstMergeTime,
                uploadCount
            });

            await users.updateOne(
                { _id: user._id },
                {
                    $set: {
                        'usage.firstMergeTime': firstMergeTime,
                        'usage.uploadCount': uploadCount
                    },
                    $unset: {
                        'usage.date': '' // Remove old date field
                    }
                }
            );
        }

        console.log('Migration complete!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.close();
    }
}

migrateUsageSchema();
