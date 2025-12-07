import jwt from 'jsonwebtoken';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export default async function authMiddleware(req, res, next) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validate session for tier3 (unlimited) users only
        if (decoded.sessionId) {
            try {
                const db = getDB();
                const users = db.collection('users');
                const user = await users.findOne({ _id: new ObjectId(decoded.userId) });

                if (user && user.subscription?.plan === 'tier3') {
                    // For tier3 users, validate session ID
                    if (user.activeSessionId !== decoded.sessionId) {
                        return res.status(401).json({
                            error: 'Session invalidated. You have been logged in from another device.',
                            code: 'SESSION_INVALIDATED'
                        });
                    }
                }
            } catch (dbError) {
                console.error('Session validation error:', dbError);
                // Don't block request if DB check fails, but log it
            }
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}
