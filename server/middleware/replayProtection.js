import crypto from 'crypto';

/**
 * Request Replay Protection
 * Prevents the same request from being processed multiple times
 * using nonce-based duplicate detection
 */

// In-memory nonce store (use Redis in production for cluster support)
const nonceStore = new Map();

// Cleanup interval - remove nonces older than 5 minutes
const NONCE_TTL = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

/**
 * Clean up expired nonces
 */
function cleanupExpiredNonces() {
    const now = Date.now();
    for (const [nonce, timestamp] of nonceStore.entries()) {
        if (now - timestamp > NONCE_TTL) {
            nonceStore.delete(nonce);
        }
    }
}

// Start cleanup interval
setInterval(cleanupExpiredNonces, CLEANUP_INTERVAL);

/**
 * Generate a nonce for the client
 * @returns {string} Nonce value
 */
export const generateNonce = () => {
    return crypto.randomBytes(32).toString('base64');
};

/**
 * Middleware to check for replay attacks
 * Requires client to send 'X-Request-Nonce' header with a unique value
 */
export const replayProtection = (req, res, next) => {
    const nonce = req.headers['x-request-nonce'];

    // Skip replay protection for GET requests (they're idempotent)
    if (req.method === 'GET') {
        return next();
    }

    // Nonce is required for state-changing operations
    if (!nonce) {
        return res.status(400).json({
            error: 'Missing request nonce',
            code: 'MISSING_NONCE',
            message: 'Include X-Request-Nonce header with a unique value'
        });
    }

    // Check if nonce has been used before
    if (nonceStore.has(nonce)) {
        return res.status(409).json({
            error: 'Duplicate request detected',
            code: 'REPLAY_ATTACK',
            message: 'This request has already been processed'
        });
    }

    // Store the nonce with current timestamp
    nonceStore.set(nonce, Date.now());

    // Continue processing
    next();
};

/**
 * Optional middleware - only for critical operations
 * Stricter version that also validates nonce format
 */
export const strictReplayProtection = (req, res, next) => {
    const nonce = req.headers['x-request-nonce'];

    if (req.method === 'GET') {
        return next();
    }

    if (!nonce) {
        return res.status(400).json({
            error: 'Missing request nonce',
            code: 'MISSING_NONCE'
        });
    }

    // Validate nonce format (should be base64, 32 bytes = 44 chars base64)
    if (nonce.length < 32 || nonce.length > 64) {
        return res.status(400).json({
            error: 'Invalid nonce format',
            code: 'INVALID_NONCE'
        });
    }

    if (nonceStore.has(nonce)) {
        // Log this as a potential security incident
        console.warn('🚨 REPLAY ATTACK DETECTED:', {
            nonce,
            ip: req.ip,
            path: req.path,
            userId: req.user?.userId
        });

        return res.status(409).json({
            error: 'Duplicate request detected',
            code: 'REPLAY_ATTACK'
        });
    }

    nonceStore.set(nonce, Date.now());
    next();
};

/**
 * Get nonce statistics
 */
export const getNonceStats = () => {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;

    for (const timestamp of nonceStore.values()) {
        if (now - timestamp > NONCE_TTL) {
            expiredCount++;
        } else {
            activeCount++;
        }
    }

    return {
        total: nonceStore.size,
        active: activeCount,
        expired: expiredCount,
        ttl: NONCE_TTL / 1000 + ' seconds'
    };
};

/**
 * Clear all nonces (for testing)
 */
export const clearNonces = () => {
    nonceStore.clear();
};
