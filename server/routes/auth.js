import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { loginLimiter, signupLimiter } from '../middleware/rateLimit.js';
import authMiddleware from '../middleware/auth.js';
import { linkFingerprintToUser } from '../middleware/usageLimit.js';
import { logAuditEvent, AuditEventType } from '../utils/auditLogger.js';

const router = express.Router();

// Signup
router.post('/signup', signupLimiter, async (req, res) => {
    try {
        const { email, password, name, fingerprint } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const db = getDB();
        const users = db.collection('users');

        // Check if user exists
        const existingUser = await users.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const result = await users.insertOne({
            email: email.toLowerCase(),
            passwordHash,
            name,
            subscription: {
                plan: 'free',
                status: 'active',
                expiryDate: null
            },
            usage: {
                date: new Date().toISOString().split('T')[0],
                uploadCount: 0
            },
            createdAt: new Date(),
            lastLogin: new Date(),
            knownFingerprints: [] // Initialize empty array
        });

        // Link fingerprint if provided
        if (fingerprint) {
            await linkFingerprintToUser(result.insertedId.toString(), fingerprint);
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: result.insertedId.toString(), email: email.toLowerCase() },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: result.insertedId,
                email: email.toLowerCase(),
                name,
                subscription: { plan: 'free', status: 'active' }
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password, fingerprint } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const db = getDB();
        const users = db.collection('users');

        // Find user
        const user = await users.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Initialize missing fields for existing users
        const updates = { lastLogin: new Date() };

        if (!user.subscription) {
            updates.subscription = { plan: 'free', status: 'active' };
        }

        if (!user.usage) {
            const today = new Date().toISOString().split('T')[0];
            updates.usage = { date: today, uploadCount: 0 };
        }

        // Update user with last login and any missing fields
        await users.updateOne(
            { _id: user._id },
            { $set: updates }
        );

        // Link fingerprint if provided
        if (fingerprint) {
            await linkFingerprintToUser(user._id.toString(), fingerprint);
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                subscription: updates.subscription || user.subscription,
                usage: updates.usage || user.usage
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const db = getDB();
        const users = db.collection('users');

        const user = await users.findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { passwordHash: 0 } }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout (client-side - just clear token)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Google Login
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
    try {
        const { credential, fingerprint } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.VITE_GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        if (!email) {
            return res.status(400).json({ error: 'Email not provided by Google' });
        }

        const db = getDB();
        const users = db.collection('users');

        // Check if user exists
        let user = await users.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Create new user if not exists
            // We set a random password hash since they use Google to login
            // This prevents password login unless they reset it, which is fine
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const passwordHash = await bcrypt.hash(randomPassword, 12);

            const result = await users.insertOne({
                email: email.toLowerCase(),
                passwordHash,
                name: name || 'Google User',
                googleId,
                subscription: {
                    plan: 'free',
                    status: 'active',
                    expiryDate: null
                },
                usage: {
                    date: new Date().toISOString().split('T')[0],
                    uploadCount: 0
                },
                createdAt: new Date(),
                lastLogin: new Date(),
                knownFingerprints: []
            });

            user = {
                _id: result.insertedId,
                email: email.toLowerCase(),
                name: name || 'Google User',
                subscription: { plan: 'free', status: 'active' }
            };
        } else {
            // Initialize missing fields for existing users
            const updates = { lastLogin: new Date() };

            if (googleId && !user.googleId) {
                updates.googleId = googleId;
            }

            if (!user.subscription) {
                updates.subscription = { plan: 'free', status: 'active' };
            }

            if (!user.usage) {
                const today = new Date().toISOString().split('T')[0];
                updates.usage = { date: today, uploadCount: 0 };
            }

            // Update user with last login and any missing fields
            await users.updateOne(
                { _id: user._id },
                { $set: updates }
            );

            // Merge updates into user object for response
            if (updates.subscription) user.subscription = updates.subscription;
            if (updates.usage) user.usage = updates.usage;
            if (updates.googleId) user.googleId = updates.googleId;
        }

        // Link fingerprint if provided
        if (fingerprint) {
            await linkFingerprintToUser(user._id.toString(), fingerprint);
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                subscription: user.subscription || { plan: 'free', status: 'active' },
                usage: user.usage || { date: new Date().toISOString().split('T')[0], uploadCount: 0 }
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

export default router;
