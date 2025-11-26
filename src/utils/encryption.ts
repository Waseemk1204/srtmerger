/**
 * Client-side encryption using Web Crypto API
 * Encrypts file content before sending to server for maximum privacy
 */

export interface EncryptionMeta {
    algorithm: string;
    iv: string; // Base64 encoded
    salt: string; // Base64 encoded
}

export interface EncryptedData {
    encryptedContent: string; // Base64 encoded
    encryptionMeta: EncryptionMeta;
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt file content with user's password
 */
export async function encryptFile(
    content: string,
    password: string
): Promise<EncryptedData> {
    try {
        // Generate random salt and IV
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Derive key from password
        const key = await deriveKey(password, salt);

        // Encrypt content
        const encoder = new TextEncoder();
        const encodedContent = encoder.encode(content);
        const encryptedBuffer = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            encodedContent
        );

        // Convert to base64
        const encryptedArray = new Uint8Array(encryptedBuffer);
        const encryptedContent = btoa(String.fromCharCode(...encryptedArray));
        const ivBase64 = btoa(String.fromCharCode(...iv));
        const saltBase64 = btoa(String.fromCharCode(...salt));

        return {
            encryptedContent,
            encryptionMeta: {
                algorithm: 'AES-GCM',
                iv: ivBase64,
                salt: saltBase64
            }
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt file');
    }
}

/**
 * Decrypt file content with user's password
 */
export async function decryptFile(
    encryptedContent: string,
    password: string,
    encryptionMeta: EncryptionMeta
): Promise<string> {
    try {
        // Decode base64
        const encryptedArray = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(encryptionMeta.iv), c => c.charCodeAt(0));
        const salt = Uint8Array.from(atob(encryptionMeta.salt), c => c.charCodeAt(0));

        // Derive key from password
        const key = await deriveKey(password, salt);

        // Decrypt content
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            encryptedArray
        );

        // Convert to string
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt file - incorrect password or corrupted data');
    }
}
