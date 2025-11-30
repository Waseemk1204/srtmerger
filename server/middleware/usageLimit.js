import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { getCurrentPlan, PLAN_LIMITS } from '../utils/planUtils.js';
import { toObjectId } from '../utils/objectIdValidator.js';



export const usageLimit = async (req, res, next) => {
    try {
        const db = getDB();
        const users = db.collection('users');

        const user = await users.findOne({ _id: toObjectId(req.user.userId, 'User ID') });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const today = new Date().toISOString().split('T')[0];
        const userPlan = getCurrentPlan(user); // Now checks expiry
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
    const now = new Date();

    // Use atomic findOneAndUpdate to prevent race conditions
    const result = await users.findOneAndUpdate(
        {
            _id: new ObjectId(userId),
            $or: [
                { 'usage.firstMergeTime': { $exists: false } },
                {
                    'usage.firstMergeTime': {
                        $lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            ]
        },
        {
            $set: {
                'usage.uploadCount': count,
                'usage.firstMergeTime': now.toISOString()
            },
            $unset: { 'usage.date': '' }
        },
        { returnDocument: 'after' }
    );

    // If no document was updated, window hasn't expired - increment within window
    if (!result.value) {
        await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $inc: { 'usage.uploadCount': count },
                $unset: { 'usage.date': '' }
            }
        );
    }
};

// ==================== ANONYMOUS USER TRACKING ====================

/**
 * Check if an anonymous user (identified by fingerprint) is within their usage limit
 * Also checks if this fingerprint has ever been associated with an account (prevent logout abuse)
 */
export const checkAnonymousUsageLimit = async (fingerprint, ipAddress) => {
    const db = getDB();
    const anonymousUsage = db.collection('anonymousUsage');
    const users = db.collection('users');

    // Hash the fingerprint and IP for privacy
    const fingerprintHash = crypto.createHash('sha256').update(fingerprint).digest('hex');
    const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');

    // Check if this fingerprint has ever logged in (prevent logout abuse)
    const existingUser = await users.findOne({ knownFingerprints: fingerprintHash });
    if (existingUser) {
        return {
            allowed: false,
            requiresLogin: true,
            message: 'This device has been used with an account. Please log in to continue.',
            current: 0,
            limit: 0
        };
    }

    // Check fingerprint-based usage
    const record = await anonymousUsage.findOne({ fingerprintHash });

    if (!record) {
        // New user, allow
        return { allowed: true, current: 0, limit: 4, isNew: true };
    }

    // Check if 24h window expired
    const hoursSinceFirst = (Date.now() - new Date(record.firstMergeTime).getTime()) / (1000 * 60 * 60);

    if (hoursSinceFirst >= 24) {
        // Window expired, reset
        return {
            allowed: true,
            current: 0,
            limit: 4,
            resetTime: new Date(record.firstMergeTime)
        };
    }

    // Within window, check limit
    const limit = 4; // Free tier limit
    if (record.uploadCount >= limit) {
        const resetTime = new Date(new Date(record.firstMergeTime).getTime() + 24 * 60 * 60 * 1000);
        return {
            allowed: false,
            current: record.uploadCount,
            limit,
            resetTime
        };
    }

    return { allowed: true, current: record.uploadCount, limit };
};

/**
 * Increment anonymous usage count for a fingerprint
 */
export const incrementAnonymousUsage = async (fingerprint, ipAddress, count = 1) => {
    const db = getDB();
    const anonymousUsage = db.collection('anonymousUsage');

    const fingerprintHash = crypto.createHash('sha256').update(fingerprint).digest('hex');
    const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');

    const now = new Date();

    const record = await anonymousUsage.findOne({ fingerprintHash });

    if (!record) {
        // Create new record
        await anonymousUsage.insertOne({
            fingerprintHash,
            ipHash,
            uploadCount: count,
            firstMergeTime: now,
            lastActivity: now,
            createdAt: now
        });
        console.log('New anonymous user tracked:', { fingerprintHash: fingerprintHash.substring(0, 8), count });
        return;
    }

    // Check if window expired
    const hoursSinceFirst = (now - new Date(record.firstMergeTime)) / (1000 * 60 * 60);

    if (hoursSinceFirst >= 24) {
        // Reset window
        await anonymousUsage.updateOne(
            { fingerprintHash },
            {
                $set: {
                    uploadCount: count,
                    firstMergeTime: now,
                    lastActivity: now,
                    ipHash // Update IP in case it changed
                }
            }
        );
        console.log('Anonymous user window reset:', { fingerprintHash: fingerprintHash.substring(0, 8), count });
    } else {
        // Increment within window
        await anonymousUsage.updateOne(
            { fingerprintHash },
            {
                $inc: { uploadCount: count },
                $set: {
                    lastActivity: now,
                    ipHash // Update IP in case it changed
                }
            }
        );
        console.log('Anonymous user incremented:', { fingerprintHash: fingerprintHash.substring(0, 8), newCount: record.uploadCount + count });
    }
};

/**
 * Link a fingerprint to a user account (called on login)
 * This prevents logout abuse - once you've logged in on a device, you can't use anonymous mode
 */
export const linkFingerprintToUser = async (userId, fingerprint) => {
    const db = getDB();
    const users = db.collection('users');

    const fingerprintHash = crypto.createHash('sha256').update(fingerprint).digest('hex');

    // Add fingerprint to user's known fingerprints array (if not already there)
    await users.updateOne(
        { _id: new ObjectId(userId) },
        {
            $addToSet: { knownFingerprints: fingerprintHash }
        }
    );

    console.log('Fingerprint linked to user:', { userId, fingerprintHash: fingerprintHash.substring(0, 8) });
};
