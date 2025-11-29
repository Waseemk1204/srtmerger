// Cleanup script to remove old 'date' field from all users
// Run this once to clean up existing data

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanupOldDateField() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('srtmerger');
        const users = db.collection('users');

        // Find all users with old date field
        const usersWithDateField = await users.find({ 'usage.date': { $exists: true } }).toArray();

        console.log(`Found ${usersWithDateField.length} users with old date field`);

        if (usersWithDateField.length > 0) {
            // Remove the date field from all users
            const result = await users.updateMany(
                { 'usage.date': { $exists: true } },
                { $unset: { 'usage.date': '' } }
            );

            console.log(`Removed 'date' field from ${result.modifiedCount} users`);
        } else {
            console.log('No users with old date field found. Database is clean!');
        }

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await client.close();
    }
}

cleanupOldDateField();
