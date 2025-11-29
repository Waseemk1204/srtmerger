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
    const user = await users.findOne({ _id: new ObjectId(userId) });

    const now = new Date();
    const firstMergeTime = user?.usage?.firstMergeTime ? new Date(user.usage.firstMergeTime) : null;

    // Calculate hours since first merge
    const hoursSinceFirst = firstMergeTime
        ? (now - firstMergeTime) / (1000 * 60 * 60)
        : 25; // 25 hours = past the 24h window, will trigger reset

    console.log('incrementUsage - Rolling 24h window:', {
        userId,
        count,
        firstMergeTime: firstMergeTime?.toISOString() || 'none',
        now: now.toISOString(),
        hoursSinceFirst: hoursSinceFirst.toFixed(2),
        currentCount: user?.usage?.uploadCount || 0,
        willReset: hoursSinceFirst >= 24
    });

    if (!firstMergeTime || hoursSinceFirst >= 24) {
        // Start new 24h window
        console.log('STARTING NEW 24H WINDOW - Setting count to:', count);
        await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    'usage.uploadCount': count,
                    'usage.firstMergeTime': now.toISOString()
                },
                $unset: {
                    'usage.date': '' // Remove old date field
                }
            }
        );
    } else {
        // Within 24h window, add to existing count
        const newCount = (user?.usage?.uploadCount || 0) + count;
        console.log('WITHIN 24H WINDOW - Adding', count, 'to existing. New total:', newCount);
        await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $inc: { 'usage.uploadCount': count },
                $unset: {
                    'usage.date': '' // Remove old date field
                }
            }
        );
    }
};
