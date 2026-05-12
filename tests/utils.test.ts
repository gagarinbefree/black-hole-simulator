/**
 * Utility functions tests
 */

// Utility functions (copied from main.ts for testing)
const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * clamp(t, 0, 1);
};

const mapRange = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number => {
    const t = (value - fromMin) / (fromMax - fromMin);
    return lerp(toMin, toMax, t);
};

const randomRange = (min: number, max: number): number => {
    return min + Math.random() * (max - min);
};

describe('Math Utilities', () => {
    describe('clamp', () => {
        it('should clamp value within range', () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-5, 0, 10)).toBe(0);
            expect(clamp(15, 0, 10)).toBe(10);
            expect(clamp(0, 0, 10)).toBe(0);
            expect(clamp(10, 0, 10)).toBe(10);
        });

        it('should handle negative ranges', () => {
            expect(clamp(-5, -10, -1)).toBe(-5);
            expect(clamp(-15, -10, -1)).toBe(-10);
            expect(clamp(0, -10, -1)).toBe(-1);
        });

        it('should handle zero range', () => {
            expect(clamp(5, 0, 0)).toBe(0);
            expect(clamp(-5, 0, 0)).toBe(0);
        });
    });

    describe('lerp', () => {
        it('should linearly interpolate between values', () => {
            expect(lerp(0, 10, 0)).toBe(0);
            expect(lerp(0, 10, 0.5)).toBe(5);
            expect(lerp(0, 10, 1)).toBe(10);
            expect(lerp(5, 15, 0.3)).toBe(8);
        });

        it('should handle negative values', () => {
            expect(lerp(-10, 10, 0.5)).toBe(0);
            expect(lerp(-5, -15, 0.5)).toBe(-10);
        });

        it('should clamp t between 0 and 1', () => {
            expect(lerp(0, 10, 2)).toBe(10);
            expect(lerp(0, 10, -1)).toBe(0);
        });
    });

    describe('mapRange', () => {
        it('should map value from one range to another', () => {
            expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
            expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
            expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
            expect(mapRange(2.5, 0, 10, 0, 100)).toBe(25);
        });

        it('should handle inverse ranges', () => {
            expect(mapRange(5, 0, 10, 100, 0)).toBe(50);
            expect(mapRange(0, 0, 10, 100, 0)).toBe(100);
            expect(mapRange(10, 0, 10, 100, 0)).toBe(0);
        });

        it('should handle negative ranges', () => {
            expect(mapRange(0, -10, 10, 0, 100)).toBe(50);
            expect(mapRange(-10, -10, 10, 0, 100)).toBe(0);
            expect(mapRange(10, -10, 10, 0, 100)).toBe(100);
        });
    });

    describe('randomRange', () => {
        it('should generate number within range', () => {
            for (let i = 0; i < 100; i++) {
                const value = randomRange(0, 10);
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(10);
            }
        });

        it('should generate number within negative range', () => {
            for (let i = 0; i < 100; i++) {
                const value = randomRange(-10, 0);
                expect(value).toBeGreaterThanOrEqual(-10);
                expect(value).toBeLessThanOrEqual(0);
            }
        });

        it('should generate different values', () => {
            const values = new Set();
            for (let i = 0; i < 50; i++) {
                values.add(randomRange(0, 100));
            }
            expect(values.size).toBeGreaterThan(1);
        });
    });
});