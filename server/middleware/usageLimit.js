import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const PLAN_LIMITS = {
    free: 4,
    tier1: 20,
    tier2: 100,
    tier3: Infinity
};

export const usageLimit = async (req, res, next) => {
    try {
        const db = getDB();
        const users = db.collection('users');

        const user = await users.findOne({ _id: new ObjectId(req.user.userId) });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const today = new Date().toISOString().split('T')[0];
        const userPlan = user.subscription?.plan || 'free';
        const limit = PLAN_LIMITS[userPlan];

        // Reset usage if it's a new day
        if (user.usage?.date !== today) {
            await users.updateOne(
                { _id: user._id },
                {
                    $set: {
                        usage: {
                            date: today,
                            uploadCount: 0
                        }
                    }
                }
            );
            user.usage = { date: today, uploadCount: 0 };
        }

        if (user.usage.uploadCount >= limit) {
            return res.status(403).json({
                error: 'Daily upload limit reached',
                code: 'LIMIT_REACHED',
                limit,
                current: user.usage.uploadCount,
                plan: userPlan
            });
        }

        // Attach user object to req for use in the route
        req.userFull = user;
        next();
    } catch (error) {
        console.error('Usage limit check error:', error);
        res.status(500).json({ error: 'Failed to check usage limits' });
    }
};

export const incrementUsage = async (userId, count = 1) => {
    const db = getDB();
    const users = db.collection('users');
    const today = new Date().toISOString().split('T')[0];

    // Get user to check if date reset is needed
    const user = await users.findOne({ _id: new ObjectId(userId) });

    // Reset usage if it's a new day
    if (user && user.usage?.date !== today) {
        await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    usage: {
                        date: today,
                        uploadCount: count  // Set to count instead of just 1
                    }
                }
            }
        );
    } else {
        // Same day, increment by count
        await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $inc: { 'usage.uploadCount': count },
                $set: { 'usage.date': today }
            }
        );
    }
};
