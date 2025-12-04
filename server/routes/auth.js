import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { loginLimiter, signupLimiter } from '../middleware/rateLimit.js';
import authMiddleware from '../middleware/auth.js';
import { toObjectId } from '../utils/objectIdValidator.js';
import { linkFingerprintToUser } from '../middleware/usageLimit.js';
import { logAuditEvent, AuditEventType } from '../utils/auditLogger.js';
import { checkSubscriptionExpiry } from '../utils/subscription.js';
import crypto from 'crypto';
import { sendResetPasswordEmail } from '../utils/email.js';

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
        console.log(`Login: User found ${user._id}`);

        // Check for subscription expiry
        let updatedUser = user;
        try {
            updatedUser = await checkSubscriptionExpiry(user);
            console.log('Login: Subscription check passed');
        } catch (e) {
            console.error('Login: Subscription check failed', e);
            // Continue with original user if check fails, don't block login
        }

        // Verify password
        console.log('Login: Verifying password...');
        const isValid = await bcrypt.compare(password, updatedUser.passwordHash);
        if (!isValid) {
            console.log('Login: Password mismatch');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('Login: Password verified');

        // Initialize missing fields for existing users
        const updates = { lastLogin: new Date() };

        if (!updatedUser.subscription) {
            updates.subscription = { plan: 'free', status: 'active' };
        }

        if (!updatedUser.usage) {
            const today = new Date().toISOString().split('T')[0];
            updates.usage = { date: today, uploadCount: 0 };
        }

        // Update user with last login and any missing fields
        await users.updateOne(
            { _id: updatedUser._id },
            { $set: updates }
        );
        console.log('Login: User updated');

        // Link fingerprint if provided
        if (fingerprint) {
            try {
                await linkFingerprintToUser(updatedUser._id.toString(), fingerprint);
                console.log('Login: Fingerprint linked');
            } catch (e) {
                console.error('Login: Fingerprint link failed', e);
                // Don't fail login for this
            }
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: updatedUser._id.toString(), email: updatedUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
                name: updatedUser.name,
                subscription: updates.subscription || updatedUser.subscription,
                usage: updates.usage || updatedUser.usage
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
            { _id: toObjectId(req.user.userId, 'User ID') },
            { projection: { passwordHash: 0 } }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check for subscription expiry
        const updatedUser = await checkSubscriptionExpiry(user);

        res.json({ user: updatedUser });
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
            audience: process.env.GOOGLE_CLIENT_ID, // Fixed: was using VITE_GOOGLE_CLIENT_ID
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

            // Check for subscription expiry
            user = await checkSubscriptionExpiry(user);
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

// Delete Account
router.delete('/delete', authMiddleware, async (req, res) => {
    try {
        const db = getDB();
        const users = db.collection('users');
        const files = db.collection('files');
        const userId = toObjectId(req.user.userId, 'User ID');

        // 1. Delete all user files
        const fileDeleteResult = await files.deleteMany({ userId });
        console.log(`Deleted ${fileDeleteResult.deletedCount} files for user ${userId}`);

        // 2. Delete user account
        const userDeleteResult = await users.deleteOne({ _id: userId });

        if (userDeleteResult.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 3. Log audit event
        await logAuditEvent(
            userId.toString(),
            req.user.email,
            AuditEventType.USER_ACTION,
            req.ip,
            req.headers['user-agent'],
            true,
            { action: 'account_deleted', filesDeleted: fileDeleteResult.deletedCount }
        );

        res.json({
            message: 'Account and all associated data deleted successfully',
            filesDeleted: fileDeleteResult.deletedCount
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const db = getDB();
        const users = db.collection('users');

        const user = await users.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Don't reveal if user exists
            return res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetToken,
                    resetTokenExpiry
                }
            }
        );

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?view=reset-password&token=${resetToken}`;
        const emailSent = await sendResetPasswordEmail(user.email, resetUrl);

        if (!emailSent) {
            // In dev without creds, we logged it. In prod, this is an error.
            if (process.env.NODE_ENV === 'production') {
                return res.status(500).json({ error: 'Failed to send email' });
            }
        }

        res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const db = getDB();
        const users = db.collection('users');

        const user = await users.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update user
        await users.updateOne(
            { _id: user._id },
            {
                $set: { passwordHash },
                $unset: { resetToken: "", resetTokenExpiry: "" }
            }
        );

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
