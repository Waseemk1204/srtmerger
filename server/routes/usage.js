import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { incrementUsage, checkAnonymousUsageLimit, incrementAnonymousUsage } from '../middleware/usageLimit.js';

const router = express.Router();

// ==================== AUTHENTICATED ROUTES ====================

// All authenticated routes require authentication
router.use('/merge', authMiddleware);

// Track merge operation (increment usage count)
router.post('/merge', async (req, res) => {
    try {
        const { fileCount } = req.body;
        const count = fileCount || 1; // Default to 1 if not provided

        // Log for debugging
        console.log('Track merge request:', {
            userId: req.user?.userId,
            fileCount: count,
            userExists: !!req.user
        });

        if (!req.user || !req.user.userId) {
            console.error('Track merge error: No user ID in request');
            return res.status(401).json({ error: 'User ID not found in token' });
        }

        await incrementUsage(req.user.userId, count);
        res.json({ success: true });
    } catch (error) {
        console.error('Track merge error:', {
            message: error.message,
            stack: error.stack,
            userId: req.user?.userId
        });
        res.status(500).json({
            error: 'Failed to track merge operation',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== ANONYMOUS ROUTES ====================

// Check anonymous usage (no auth required)
router.post('/check-anonymous', async (req, res) => {
    try {
        const { fingerprint } = req.body;

        if (!fingerprint) {
            return res.status(400).json({ error: 'Fingerprint required' });
        }

        // Extract IP from request
        const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || 'unknown';

        const result = await checkAnonymousUsageLimit(fingerprint, ipAddress);
        res.json(result);
    } catch (error) {
        console.error('Check anonymous usage error:', error);
        res.status(500).json({ error: 'Failed to check usage limits' });
    }
});

// Track anonymous merge (no auth required)
router.post('/merge-anonymous', async (req, res) => {
    try {
        const { fingerprint, fileCount = 1 } = req.body;

        if (!fingerprint) {
            return res.status(400).json({ error: 'Fingerprint required' });
        }

        const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || 'unknown';

        // Check limit first
        const limitCheck = await checkAnonymousUsageLimit(fingerprint, ipAddress);
        if (!limitCheck.allowed) {
            if (limitCheck.requiresLogin) {
                return res.status(403).json({
                    error: limitCheck.message,
                    code: 'REQUIRES_LOGIN',
                    requiresLogin: true
                });
            }
            return res.status(403).json({
                error: 'Daily upload limit reached',
                code: 'LIMIT_REACHED',
                limit: limitCheck.limit,
                current: limitCheck.current,
                resetTime: limitCheck.resetTime
            });
        }

        // Increment usage
        await incrementAnonymousUsage(fingerprint, ipAddress, fileCount);

        res.json({ success: true });
    } catch (error) {
        console.error('Track anonymous merge error:', error);
        res.status(500).json({ error: 'Failed to track merge operation' });
    }
});

export default router;

