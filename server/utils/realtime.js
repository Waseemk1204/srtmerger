/**
 * Real-time Plan Updates Helper
 * Provides utilities for notifying clients about plan changes
 * 
 * Note: This is a polling-based implementation (simpler than WebSocket)
 * For WebSocket support, use Socket.IO in the future
 */

import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { getCurrentPlan } from './planUtils.js';

/**
 * Get user's current plan status for real-time updates
 * This endpoint can be polled by the client
 */
export const getUserPlanStatus = async (userId) => {
    const db = getDB();
    const users = db.collection('users');

    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
        return null;
    }

    const currentPlan = getCurrentPlan(user);
    const uploadCount = user?.usage?.uploadCount || 0;
    const firstMergeTime = user?.usage?.firstMergeTime;

    // Calculate time until reset
    let resetTime = null;
    if (firstMergeTime) {
        resetTime = new Date(new Date(firstMergeTime).getTime() + 24 * 60 * 60 * 1000);
    }

    return {
        plan: currentPlan,
        subscription: {
            plan: user?.subscription?.plan || 'free',
            status: user?.subscription?.status,
            expiryDate: user?.subscription?.expiryDate,
            isExpired: currentPlan !== (user?.subscription?.plan || 'free')
        },
        usage: {
            uploadCount,
            firstMergeTime,
            resetTime
        },
        lastUpdated: new Date()
    };
};

/**
 * Check if user's plan has changed since last check
 * Used for efficient polling
 */
export const hasPlanChanged = async (userId, lastKnownPlan, lastKnownCount) => {
    const status = await getUserPlanStatus(userId);

    if (!status) {
        return { changed: false };
    }

    const planChanged = status.plan !== lastKnownPlan;
    const countChanged = status.usage.uploadCount !== lastKnownCount;

    return {
        changed: planChanged || countChanged,
        status: planChanged || countChanged ? status : null
    };
};

/**
 * Middleware to add plan status to response
 * Can be used to piggyback plan updates on existing requests
 */
export const attachPlanStatus = async (req, res, next) => {
    if (req.user?.userId) {
        try {
            req.planStatus = await getUserPlanStatus(req.user.userId);
        } catch (error) {
            // Don't fail request if plan status fetch fails
            console.error('Failed to attach plan status:', error);
        }
    }
    next();
};

/**
 * Send plan status in response
 * Use this in API responses to include plan updates
 */
export const includePlanInResponse = (res, data) => {
    return res.json({
        ...data,
        planStatus: res.req.planStatus || null
    });
};

// Future: WebSocket implementation
// export const setupWebSocket = (server) => {
//     const io = new Server(server, {
//         cors: { origin: process.env.FRONTEND_URL }
//     });
//
//     io.on('connection', (socket) => {
//         socket.on('subscribe-plan', async (userId) => {
//             socket.join(`user-${userId}`);
//             // Send initial status
//             const status = await getUserPlanStatus(userId);
//             socket.emit('plan-update', status);
//         });
//     });
//
//     // To emit updates:
//     // io.to(`user-${userId}`).emit('plan-update', status);
// };
