import { ObjectId } from 'mongodb';

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId format
 */
export function isValidObjectId(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }

    // Check if it's a valid ObjectId format
    if (!ObjectId.isValid(id)) {
        return false;
    }

    // Additional check: ensure the string representation matches
    // This catches edge cases like invalid hex strings
    return String(new ObjectId(id)) === id;
}

/**
 * Validates and converts to ObjectId, throwing descriptive error
 * @param {string} id - The ID to convert
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {ObjectId} - Valid ObjectId instance
 * @throws {Error} - If ID is invalid
 */
export function toObjectId(id, fieldName = 'ID') {
    if (!isValidObjectId(id)) {
        const error = new Error(`Invalid ${fieldName} format`);
        error.statusCode = 400;
        throw error;
    }
    return new ObjectId(id);
}
