import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { incrementUsage } from '../middleware/usageLimit.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Track merge operation (increment usage count)
router.post('/merge', async (req, res) => {
    try {
        const { fileCount } = req.body;
        const count = fileCount || 1; // Default to 1 if not provided

        await incrementUsage(req.user.userId, count);
        res.json({ success: true });
    } catch (error) {
        console.error('Track merge error:', error);
        res.status(500).json({ error: 'Failed to track merge operation' });
    }
});

export default router;
