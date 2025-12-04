import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { anonymousUsage } from '../anonymousUsage';

describe('anonymousUsage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start with null usage', () => {
        expect(anonymousUsage.get()).toBeNull();
    });

    it('should increment usage', () => {
        const usage = anonymousUsage.increment(1);
        expect(usage.uploadCount).toBe(1);
        expect(usage.firstMergeTime).toBeDefined();

        const stored = anonymousUsage.get();
        expect(stored).toEqual(usage);
    });

    it('should accumulate usage within 24h', () => {
        anonymousUsage.increment(1);
        const usage = anonymousUsage.increment(2);
        expect(usage.uploadCount).toBe(3);
    });

    it('should reset usage after 24h', () => {
        anonymousUsage.increment(1);

        // Advance time by 25 hours
        const now = Date.now();
        vi.setSystemTime(now + 25 * 60 * 60 * 1000);

        const usage = anonymousUsage.increment(1);
        expect(usage.uploadCount).toBe(1); // Should reset to 1 (the new increment)
    });
});
