import express from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import authMiddleware from '../middleware/auth.js';
import { getCurrentPlan, canAccessFeature } from '../utils/planUtils.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Save file
router.post('/', async (req, res) => {
    try {
        const { filename, content, filesize } = req.body;

        if (!filename || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate file size (25MB limit for merged files)
        const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
        if (filesize && filesize > MAX_FILE_SIZE) {
            return res.status(413).json({
                error: `File too large (${(filesize / 1024 / 1024).toFixed(1)}MB). Maximum: 25MB`
            });
        }

        const db = getDB();
        const files = db.collection('files');

        const result = await files.insertOne({
            userId: new ObjectId(req.user.userId),
            filename,
            originalFilename: filename,
            content, // Plain text SRT content
            filesize: filesize || 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({
            id: result.insertedId,
            filename,
            createdAt: new Date()
        });
    } catch (error) {
        console.error('Save file error', error);
        res.status(500).json({ error: 'Failed to save file' });
    }
});

// List user's files
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const files = db.collection('files');

        const userFiles = await files
            .find(
                { userId: new ObjectId(req.user.userId) },
                { projection: { content: 0 } } // Don't send content in list
            )
            .sort({ createdAt: -1 })
            .toArray();

        res.json({ files: userFiles });
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// Get single file (with encrypted data)
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const files = db.collection('files');

        const file = await files.findOne({
            _id: new ObjectId(req.params.id),
            userId: new ObjectId(req.user.userId)
        });

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({ file });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Failed to fetch file' });
    }
});

// Rename file
router.put('/:id', async (req, res) => {
    try {
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        const db = getDB();
        const files = db.collection('files');
        const users = db.collection('users');

        // Check if user has rename feature access (tier1+)
        const user = await users.findOne({ _id: new ObjectId(req.user.userId) });
        if (!canAccessFeature(user, 'rename')) {
            return res.status(403).json({
                error: 'Rename feature requires a premium plan',
                code: 'FEATURE_LOCKED',
                feature: 'rename'
            });
        }

        const result = await files.updateOne(
            {
                _id: new ObjectId(req.params.id),
                userId: new ObjectId(req.user.userId)
            },
            {
                $set: {
                    filename,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({ message: 'File renamed successfully', filename });
    } catch (error) {
        console.error('Rename file error:', error);
        res.status(500).json({ error: 'Failed to rename file' });
    }
});

// Delete file
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        const files = db.collection('files');

        const result = await files.deleteOne({
            _id: new ObjectId(req.params.id),
            userId: new ObjectId(req.user.userId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
