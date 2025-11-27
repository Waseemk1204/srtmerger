import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

let client;
let db;

export async function connectDB() {
    try {
        if (db) {
            return db;
        }

        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        client = new MongoClient(uri, {
            maxPoolSize: 10,
            minPoolSize: 2,
            maxIdleTimeMS: 30000
        });

        await client.connect();
        console.log('✅ Connected to MongoDB');

        db = client.db('srt_merger');

        // Create indexes
        await createIndexes();

        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

async function createIndexes() {
    try {
        const users = db.collection('users');
        const files = db.collection('files');

        await users.createIndex({ email: 1 }, { unique: true });
        await files.createIndex({ userId: 1 });
        await files.createIndex({ createdAt: -1 });

        console.log('✅ Database indexes created');
    } catch (error) {
        console.warn('⚠️  Index creation warning:', error.message);
    }
}

export function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
}

export async function closeDB() {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
        db = null;
        client = null;
    }
}
