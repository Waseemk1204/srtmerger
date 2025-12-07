import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<any> | null = null;
let cachedFingerprint: string | null = null;

/**
 * Generate a unique browser fingerprint
 * This fingerprint persists across sessions and even in incognito mode
 * Based on hardware/software configuration (screen, canvas, fonts, WebGL, etc.)
 */
export async function getBrowserFingerprint(): Promise<string> {
    // Return cached value if available
    if (cachedFingerprint) {
        return cachedFingerprint;
    }

    try {
        // Load FingerprintJS (only once)
        if (!fpPromise) {
            fpPromise = FingerprintJS.load();
        }

        const fp = await fpPromise;
        const result = await fp.get();

        cachedFingerprint = result.visitorId;
        return cachedFingerprint;
    } catch (error) {
        console.error('Fingerprint generation failed:', error);

        // Fallback: use a combination of available browser info
        const fallback = `fallback-${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}`;
        // Fallback: use a combination of user agent and timestamp
        cachedFingerprint = btoa(`${navigator.userAgent}-${Date.now()}`);
        return cachedFingerprint;
    }
}

/**
 * Simple hash function for fallback fingerprint
 */
async function simpleHash(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
