/**
 * Physics and relativistic effects tests
 */

// Relativistic Doppler factor calculation
const relativisticDopplerFactor = (velocity: number, angle: number): number => {
    const clamp = (value: number, min: number, max: number): number => {
        return Math.max(min, Math.min(max, value));
    };
    const beta = clamp(velocity, 0, 0.99);
    const cosTheta = Math.cos(angle);
    return Math.sqrt(1 - beta * beta) / (1 - beta * cosTheta);
};

// Plasma speed calculation based on radius
const calculatePlasmaSpeed = (radius: number, innerRadius: number, outerRadius: number): number => {
    const t = (radius - innerRadius) / (outerRadius - innerRadius);
    const minSpeed = 0.005;
    const maxSpeed = 0.035;
    const speed = maxSpeed - t * (maxSpeed - minSpeed);
    return Math.max(minSpeed, Math.min(maxSpeed, speed));
};

// Temperature based on radius (color mapping)
const calculatePlasmaColor = (radius: number, innerRadius: number, outerRadius: number): { r: number; g: number; b: number } => {
    const t = (radius - innerRadius) / (outerRadius - innerRadius);
    const r = 1.0;
    const g = 0.4 + (1 - t) * 0.5;
    const b = 0.2 + (1 - t) * 0.3;
    return { r, g, b };
};

// Gravitational lensing distortion factor
const lensingDistortion = (distance: number, eventHorizonRadius: number): number => {
    if (distance <= eventHorizonRadius) return 0;
    const factor = 1 + (eventHorizonRadius * eventHorizonRadius) / (distance * distance);
    return Math.min(3.0, factor);
};

describe('Relativistic Physics', () => {
    describe('relativisticDopplerFactor', () => {
        it('should return 1 for zero velocity', () => {
            expect(relativisticDopplerFactor(0, 0)).toBe(1);
            expect(relativisticDopplerFactor(0, Math.PI / 2)).toBe(1);
        });

        it('should increase factor for approaching objects', () => {
            const approaching = relativisticDopplerFactor(0.5, 0);
            const receding = relativisticDopplerFactor(0.5, Math.PI);
            expect(approaching).toBeGreaterThan(1);
            expect(receding).toBeLessThan(1);
        });

        it('should handle velocity clamp at 0.99', () => {
            const factor = relativisticDopplerFactor(1.5, 0);
            expect(factor).toBeDefined();
            expect(factor).toBeGreaterThan(0);
        });

        it('should produce larger effect at edge-on angles', () => {
            const faceOn = relativisticDopplerFactor(0.5, Math.PI / 2);
            const edgeOn = relativisticDopplerFactor(0.5, 0);
            expect(edgeOn).toBeGreaterThan(faceOn);
        });
    });

    describe('calculatePlasmaSpeed', () => {
        const innerRadius = 1.4;
        const outerRadius = 5.8;

        it('should give higher speed at inner radius', () => {
            const innerSpeed = calculatePlasmaSpeed(innerRadius, innerRadius, outerRadius);
            const outerSpeed = calculatePlasmaSpeed(outerRadius, innerRadius, outerRadius);
            expect(innerSpeed).toBeGreaterThan(outerSpeed);
        });

        it('should return speed within bounds', () => {
            for (let radius = innerRadius; radius <= outerRadius; radius += 0.5) {
                const speed = calculatePlasmaSpeed(radius, innerRadius, outerRadius);
                expect(speed).toBeGreaterThanOrEqual(0.005);
                expect(speed).toBeLessThanOrEqual(0.035);
            }
        });

        it('should decrease linearly with radius', () => {
            const speed1 = calculatePlasmaSpeed(1.4, innerRadius, outerRadius);
            const speed2 = calculatePlasmaSpeed(3.6, innerRadius, outerRadius);
            const speed3 = calculatePlasmaSpeed(5.8, innerRadius, outerRadius);
            expect(speed1).toBeGreaterThan(speed2);
            expect(speed2).toBeGreaterThan(speed3);
        });
    });

    describe('calculatePlasmaColor', () => {
        const innerRadius = 1.4;
        const outerRadius = 5.8;

        it('should return hot colors at inner radius', () => {
            const color = calculatePlasmaColor(innerRadius, innerRadius, outerRadius);
            expect(color.r).toBe(1.0);
            expect(color.g).toBeGreaterThan(0.8);
            expect(color.b).toBeGreaterThan(0.4);
        });

        it('should return cooler colors at outer radius', () => {
            const color = calculatePlasmaColor(outerRadius, innerRadius, outerRadius);
            expect(color.r).toBe(1.0);
            expect(color.g).toBeCloseTo(0.4, 1);
            expect(color.b).toBeCloseTo(0.2, 1);
        });

        it('should show gradient transition', () => {
            const innerColor = calculatePlasmaColor(innerRadius, innerRadius, outerRadius);
            const midColor = calculatePlasmaColor(3.6, innerRadius, outerRadius);
            const outerColor = calculatePlasmaColor(outerRadius, innerRadius, outerRadius);
            
            expect(innerColor.g).toBeGreaterThan(midColor.g);
            expect(midColor.g).toBeGreaterThan(outerColor.g);
            expect(innerColor.b).toBeGreaterThan(midColor.b);
            expect(midColor.b).toBeGreaterThan(outerColor.b);
        });
    });

    describe('lensingDistortion', () => {
        const eventHorizon = 0.95;

        it('should return zero inside event horizon', () => {
            expect(lensingDistortion(0.5, eventHorizon)).toBe(0);
            expect(lensingDistortion(0.95, eventHorizon)).toBe(0);
        });

        it('should increase distortion near event horizon', () => {
            const nearDistortion = lensingDistortion(1.1, eventHorizon);
            const farDistortion = lensingDistortion(5.0, eventHorizon);
            expect(nearDistortion).toBeGreaterThan(farDistortion);
        });

        it('should approach 1 at large distances', () => {
            const farDistortion = lensingDistortion(100, eventHorizon);
            expect(farDistortion).toBeCloseTo(1, 2);
        });

        it('should cap at 3.0', () => {
            const maxDistortion = lensingDistortion(0.96, eventHorizon);
            expect(maxDistortion).toBeLessThanOrEqual(3.0);
        });
    });
});