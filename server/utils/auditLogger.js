import { getDB } from '../config/db.js';

/**
 * Security Audit Logger
 * Logs all security-relevant events for monitoring and compliance
 */

export const AuditEventType = {
    // Authentication events
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    TOKEN_EXPIRED: 'token_expired',

    // Authorization events
    UPLOAD_LIMIT_REACHED: 'upload_limit_reached',
    FEATURE_LOCKED: 'feature_locked',
    SUBSCRIPTION_EXPIRED: 'subscription_expired',

    // File operations
    FILE_UPLOAD: 'file_upload',
    FILE_SIZE_EXCEEDED: 'file_size_exceeded',
    FILE_SAVE: 'file_save',
    FILE_DELETE: 'file_delete',
    FILE_RENAME: 'file_rename',

    // Payment events
    PAYMENT_INITIATED: 'payment_initiated',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',

    // Security events
    INVALID_TOKEN: 'invalid_token',
    API_BYPASS_ATTEMPT: 'api_bypass_attempt',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
};

/**
 * Log a security audit event
 * @param {string} eventType - Type of event from AuditEventType
 * @param {Object} details - Event details
 * @param {string} details.userId - User ID (optional for anonymous)
 * @param {string} details.email - User email (optional)
 * @param {string} details.ip - IP address
 * @param {string} details.userAgent - User agent string
 * @param {Object} details.metadata - Additional event-specific data
 * @param {string} details.severity - 'info', 'warning', 'error', 'critical'
 */
export const logAuditEvent = async (eventType, details = {}) => {
    try {
        const db = getDB();
        const auditLogs = db.collection('auditLogs');

        const logEntry = {
            eventType,
            timestamp: new Date(),
            userId: details.userId || null,
            email: details.email || null,
            ip: details.ip || 'unknown',
            userAgent: details.userAgent || 'unknown',
            severity: details.severity || 'info',
            metadata: details.metadata || {},
            createdAt: new Date()
        };

        await auditLogs.insertOne(logEntry);

        // For critical events, also log to console
        if (details.severity === 'critical' || details.severity === 'error') {
            console.error('🚨 AUDIT EVENT:', eventType, logEntry);
        } else if (details.severity === 'warning') {
            console.warn('⚠️  AUDIT EVENT:', eventType, logEntry);
        }
    } catch (error) {
        // Audit logging should never break the application
        console.error('Failed to log audit event:', error);
    }
};

/**
 * Get audit logs with filtering
 * @param {Object} filters
 * @param {string} filters.userId - Filter by user
 * @param {string} filters.eventType - Filter by event type
 * @param {Date} filters.startDate - Start date
 * @param {Date} filters.endDate - End date
 * @param {string} filters.severity - Filter by severity
 * @param {number} filters.limit - Max results (default 100)
 */
export const getAuditLogs = async (filters = {}) => {
    const db = getDB();
    const auditLogs = db.collection('auditLogs');

    const query = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.eventType) query.eventType = filters.eventType;
    if (filters.severity) query.severity = filters.severity;

    if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const limit = filters.limit || 100;

    const logs = await auditLogs
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

    return logs;
};

/**
 * Get audit statistics
 * @param {Object} filters - Same as getAuditLogs
 */
export const getAuditStats = async (filters = {}) => {
    const db = getDB();
    const auditLogs = db.collection('auditLogs');

    const query = {};
    if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const [eventCounts, severityCounts] = await Promise.all([
        auditLogs.aggregate([
            { $match: query },
            { $group: { _id: '$eventType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray(),

        auditLogs.aggregate([
            { $match: query },
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]).toArray()
    ]);

    return {
        eventCounts: eventCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {}),
        severityCounts: severityCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {})
    };
};

/**
 * Clean up old audit logs (for maintenance)
 * @param {number} daysToKeep - Number of days to retain logs
 */
export const cleanupOldAuditLogs = async (daysToKeep = 90) => {
    const db = getDB();
    const auditLogs = db.collection('auditLogs');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await auditLogs.deleteMany({
        timestamp: { $lt: cutoffDate }
    });

    console.log(`Cleaned up ${result.deletedCount} audit logs older than ${daysToKeep} days`);
    return result.deletedCount;
};
