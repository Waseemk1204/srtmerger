// Local storage usage tracking for anonymous users
// Uses browser localStorage to track usage without requiring authentication

export interface AnonymousUsage {
    uploadCount: number;
    firstMergeTime: string; // ISO timestamp
}

const STORAGE_KEY = 'srt_merger_anonymous_usage';

export const anonymousUsage = {
    // Get current usage from localStorage
    get(): AnonymousUsage | null {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to read anonymous usage:', error);
            return null;
        }
    },

    // Set usage in localStorage
    set(usage: AnonymousUsage): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
        } catch (error) {
            console.error('Failed to save anonymous usage:', error);
        }
    },

    // Increment usage count
    increment(count: number = 1): AnonymousUsage {
        const current = this.get();
        const now = new Date().toISOString();

        // If no usage or 24h has passed, start new window
        if (!current || !current.firstMergeTime) {
            const newUsage = { uploadCount: count, firstMergeTime: now };
            this.set(newUsage);
            return newUsage;
        }

        // Check if 24h has passed
        const hoursSinceFirst = (Date.now() - new Date(current.firstMergeTime).getTime()) / (1000 * 60 * 60);

        if (hoursSinceFirst >= 24) {
            // Reset: new 24h window
            const newUsage = { uploadCount: count, firstMergeTime: now };
            this.set(newUsage);
            return newUsage;
        } else {
            // Within window: increment
            const newUsage = {
                uploadCount: current.uploadCount + count,
                firstMergeTime: current.firstMergeTime
            };
            this.set(newUsage);
            return newUsage;
        }
    },

    // Clear usage (for when user logs in)
    clear(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear anonymous usage:', error);
        }
    }
};
