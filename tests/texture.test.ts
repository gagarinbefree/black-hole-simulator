/**
 * Texture generation tests
 */

// Mock canvas for testing
class MockCanvas {
    width: number = 1024;
    height: number = 1024;
    getContext(): MockContext {
        return new MockContext();
    }
}

class MockContext {
    fillStyle: string = '';
    fillRect(x: number, y: number, w: number, h: number): void {}
    beginPath(): void {}
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void {}
    fill(): void {}
    getImageData(x: number, y: number, w: number, h: number): MockImageData {
        return new MockImageData(w, h);
    }
    putImageData(data: MockImageData, x: number, y: number): void {}
}

class MockImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = 0;
        }
    }
}

// Texture generation logic for testing
const calculateIntensity = (t: number): number => {
    if (t < 0.25) {
        return Math.pow(1 - t / 0.25, 0.7) * 1.0;
    } else if (t < 0.65) {
        return 0.85 + Math.sin((t - 0.25) / 0.4 * Math.PI) * 0.15;
    } else {
        return Math.pow(1 - (t - 0.65) / 0.35, 1.3) * 0.7;
    }
};

const calculateColor = (t: number): { r: number; g: number; b: number } => {
    return {
        r: Math.min(255, 200 + Math.floor(55 * (1 - t))),
        g: Math.min(255, 100 + Math.floor(100 * (1 - t * 0.7))),
        b: Math.min(255, 50 + Math.floor(80 * (1 - t * 1.2)))
    };
};

describe('Texture Generation', () => {
    describe('calculateIntensity', () => {
        it('should peak in mid region', () => {
            const innerIntensity = calculateIntensity(0.1);
            const midIntensity = calculateIntensity(0.45);
            const outerIntensity = calculateIntensity(0.8);
            
            expect(midIntensity).toBeGreaterThan(innerIntensity);
            expect(midIntensity).toBeGreaterThan(outerIntensity);
        });

        it('should return values between 0 and 1', () => {
            for (let t = 0; t <= 1; t += 0.1) {
                const intensity = calculateIntensity(t);
                expect(intensity).toBeGreaterThanOrEqual(0);
                expect(intensity).toBeLessThanOrEqual(1);
            }
        });

        it('should be highest near inner edge of mid region', () => {
            const intensity1 = calculateIntensity(0.25);
            const intensity2 = calculateIntensity(0.35);
            expect(intensity2).toBeGreaterThan(intensity1);
        });

        it('should decrease near outer edge', () => {
            const intensity1 = calculateIntensity(0.65);
            const intensity2 = calculateIntensity(0.8);
            expect(intensity2).toBeLessThan(intensity1);
        });
    });

    describe('calculateColor', () => {
        it('should be brighter at inner radius', () => {
            const innerColor = calculateColor(0.1);
            const outerColor = calculateColor(0.9);
            expect(innerColor.r).toBeGreaterThan(outerColor.r);
            expect(innerColor.g).toBeGreaterThan(outerColor.g);
            expect(innerColor.b).toBeGreaterThan(outerColor.b);
        });

        it('should have red channel highest', () => {
            for (let t = 0; t <= 1; t += 0.2) {
                const color = calculateColor(t);
                expect(color.r).toBeGreaterThanOrEqual(color.g);
                expect(color.g).toBeGreaterThanOrEqual(color.b);
            }
        });

        it('should have valid RGB values', () => {
            for (let t = 0; t <= 1; t += 0.2) {
                const color = calculateColor(t);
                expect(color.r).toBeGreaterThanOrEqual(0);
                expect(color.r).toBeLessThanOrEqual(255);
                expect(color.g).toBeGreaterThanOrEqual(0);
                expect(color.g).toBeLessThanOrEqual(255);
                expect(color.b).toBeGreaterThanOrEqual(0);
                expect(color.b).toBeLessThanOrEqual(255);
            }
        });
    });
});