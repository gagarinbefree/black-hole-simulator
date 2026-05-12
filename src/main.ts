/**
 * Black Hole Simulator - Relativistic Plasma Accretion Simulation
 * 
 * A realistic simulation of a supermassive black hole with:
 * - Relativistic plasma accretion disk
 * - Gravitational lensing effects
 * - Einstein rings
 * - Relativistic jets
 * - Doppler shift and time dilation effects
 * 
 * @module BlackHoleSimulator
 * @version 1.0.0
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'; 
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'; 

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Simulation runtime parameters
 * @interface SimulationParams
 */
interface SimulationParams {
    /** Plasma rotation speed multiplier (0-2) */
    plasmaSpeed: number;
    /** Visual intensity/brightness multiplier (0.3-2) */
    intensity: number;
    /** Particle density/size multiplier (0.5-2) */
    density: number;
    /** Current simulation time in seconds */
    time: number;
    /** Time delta since last frame in seconds */
    deltaTime: number;
}

/**
 * Plasma particle data structure
 * @interface PlasmaParticle
 */
interface PlasmaParticle {
    /** Orbital radius from black hole center */
    radius: number;
    /** Current angular position in radians */
    angle: number;
    /** Vertical offset from disk plane */
    yOffset: number;
    /** Angular velocity in radians per second */
    speed: number;
    /** RGB color of the particle */
    color: THREE.Color;
}

/**
 * Configuration for plasma particle system
 * @interface PlasmaConfig
 */
interface PlasmaConfig {
    /** Number of particles in the system */
    particleCount: number;
    /** Minimum orbital radius */
    innerRadius: number;
    /** Maximum orbital radius */
    outerRadius: number;
    /** Minimum angular speed */
    minSpeed: number;
    /** Maximum angular speed */
    maxSpeed: number;
    /** Minimum particle size in pixels */
    sizeMin: number;
    /** Maximum particle size in pixels */
    sizeMax: number;
    /** Minimum opacity value */
    opacityMin: number;
    /** Maximum opacity value */
    opacityMax: number;
    /** Color at inner radius (hot) */
    colorInner: THREE.Color;
    /** Color at outer radius (cool) */
    colorOuter: THREE.Color;
}

/**
 * UI control elements reference
 * @interface UIControls
 */
interface UIControls {
    plasmaSpeed: HTMLInputElement;
    intensity: HTMLInputElement;
    density: HTMLInputElement;
    speedValue: HTMLElement;
    intensityValue: HTMLElement;
    densityValue: HTMLElement;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clamps a number between minimum and maximum values
 * @param value - Input value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 */
const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

/**
 * Linear interpolation between two values
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * clamp(t, 0, 1);
};

/**
 * Maps a value from one range to another
 * @param value - Input value
 * @param fromMin - Source range minimum
 * @param fromMax - Source range maximum
 * @param toMin - Target range minimum
 * @param toMax - Target range maximum
 * @returns Mapped value
 */
const mapRange = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number => {
    const t = (value - fromMin) / (fromMax - fromMin);
    return lerp(toMin, toMax, t);
};

/**
 * Generates random number in range
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number
 */
const randomRange = (min: number, max: number): number => {
    return min + Math.random() * (max - min);
};

/**
 * Calculates relativistic Doppler factor for color shifting
 * @param velocity - Normalized velocity (0-1)
 * @param angle - Viewing angle in radians
 * @returns Doppler factor
 */
const relativisticDopplerFactor = (velocity: number, angle: number): number => {
    const beta = clamp(velocity, 0, 0.99);
    const cosTheta = Math.cos(angle);
    return Math.sqrt(1 - beta * beta) / (1 - beta * cosTheta);
};

// ============================================================================
// Texture Generation
// ============================================================================

/**
 * Creates a procedural texture for the accretion disk with blur and spiral arms
 * @returns CanvasTexture for the disk
 */
const createDiskTexture = (): THREE.CanvasTexture => {
    const width = 1024;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = width / 2;
    
    // Draw radial gradient
    for (let r = 0; r < maxRadius; r++) {
        const t = r / maxRadius;
        
        // Intensity profile: peaks in mid region
        let intensity: number;
        if (t < 0.25) {
            intensity = Math.pow(1 - t / 0.25, 0.7) * 1.0;
        } else if (t < 0.65) {
            intensity = 0.85 + Math.sin((t - 0.25) / 0.4 * Math.PI) * 0.15;
        } else {
            intensity = Math.pow(1 - (t - 0.65) / 0.35, 1.3) * 0.7;
        }
        
        // Add noise for turbulent gas effect
        const noise = 0.8 + Math.random() * 0.5;
        intensity *= noise;
        
        // Color gradient: hot white-orange inside, cooler red outside
        const rColor = Math.min(255, 200 + Math.floor(55 * (1 - t)));
        const gColor = Math.min(255, 100 + Math.floor(100 * (1 - t * 0.7)));
        const bColor = Math.min(255, 50 + Math.floor(80 * (1 - t * 1.2)));
        const alpha = Math.min(220, Math.floor(200 * intensity));
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rColor}, ${gColor}, ${bColor}, ${alpha / 255})`;
        ctx.fill();
    }
    
    // Add spiral arm structures
    const spiralArms = 12;
    for (let i = 0; i < spiralArms; i++) {
        const spiralAngle = (i / spiralArms) * Math.PI * 2;
        for (let r = 50; r < maxRadius - 30; r += 15) {
            const angle = spiralAngle + r * 0.02;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            if (x > 0 && x < width && y > 0 && y < height) {
                ctx.fillStyle = `rgba(255, ${180 + Math.random() * 75}, ${100 + Math.random() * 80}, ${0.3 + Math.random() * 0.3})`;
                ctx.fillRect(x - 1, y - 1, 2, 2);
            }
        }
    }
    
    // Apply Gaussian blur approximation
    const imageData = ctx.getImageData(0, 0, width, height);
    const blurredData = ctx.getImageData(0, 0, width, height);
    const blurRadius = 2;
    
    for (let y = blurRadius; y < height - blurRadius; y++) {
        for (let x = blurRadius; x < width - blurRadius; x++) {
            let rSum = 0, gSum = 0, bSum = 0, aSum = 0, wSum = 0;
            
            for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                    const idx = ((y + dy) * width + (x + dx)) * 4;
                    const weight = 1 / (1 + Math.abs(dx) + Math.abs(dy));
                    rSum += imageData.data[idx] * weight;
                    gSum += imageData.data[idx + 1] * weight;
                    bSum += imageData.data[idx + 2] * weight;
                    aSum += imageData.data[idx + 3] * weight;
                    wSum += weight;
                }
            }
            
            const idx = (y * width + x) * 4;
            blurredData.data[idx] = rSum / wSum;
            blurredData.data[idx + 1] = gSum / wSum;
            blurredData.data[idx + 2] = bSum / wSum;
            blurredData.data[idx + 3] = aSum / wSum * 0.85;
        }
    }
    
    ctx.putImageData(blurredData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    
    return texture;
};

/**
 * Creates a procedural texture for Einstein rings with edge fading
 * @param color - Base color of the ring
 * @param intensity - Brightness intensity
 * @returns CanvasTexture for the ring
 */
const createRingTexture = (color: THREE.Color, intensity: number): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    
    for (let x = 0; x < width; x++) {
        const t = x / width;
        
        // Fade at edges
        let fadeFactor: number;
        if (t < 0.2) {
            fadeFactor = t / 0.2;
        } else if (t > 0.8) {
            fadeFactor = (1 - t) / 0.2;
        } else {
            fadeFactor = 1.0;
        }
        
        const alpha = Math.min(200, Math.floor(180 * intensity * fadeFactor));
        
        for (let y = 0; y < height; y++) {
            const yPos = (y - height / 2) / (height / 2);
            const yIntensity = Math.exp(-yPos * yPos * 8) * fadeFactor;
            
            ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${alpha / 255 * yIntensity})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
};

// ============================================================================
// Plasma System Creation
// ============================================================================

/**
 * Creates a plasma particle system with realistic distribution and colors
 * @param config - Configuration for the plasma system
 * @returns Object containing Points object and particle data array
 */
const createPlasmaSystem = (config: PlasmaConfig): { points: THREE.Points; particles: PlasmaParticle[] } => {
    const positions = new Float32Array(config.particleCount * 3);
    const colors = new Float32Array(config.particleCount * 3);
    const particles: PlasmaParticle[] = [];
    
    for (let i = 0; i < config.particleCount; i++) {
        // Bias distribution toward inner region (more particles closer to black hole)
        const t = Math.pow(Math.random(), 1.5);
        const radius = config.innerRadius + t * (config.outerRadius - config.innerRadius);
        const angle = Math.random() * Math.PI * 2;
        
        // Vertical thickness decreases with radius
        const heightFactor = 1 - (radius - config.innerRadius) / (config.outerRadius - config.innerRadius);
        const yOffset = (Math.random() - 0.5) * 0.35 * heightFactor;
        
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = yOffset;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
        
        // Color gradient based on radius
        const colorT = (radius - config.innerRadius) / (config.outerRadius - config.innerRadius);
        const r = lerp(config.colorInner.r, config.colorOuter.r, colorT);
        const g = lerp(config.colorInner.g, config.colorOuter.g, colorT);
        const b = lerp(config.colorInner.b, config.colorOuter.b, colorT);
        
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
        
        // Relativistic speed: inner layers rotate faster
        const speedT = 1 - colorT;
        const speed = lerp(config.maxSpeed, config.minSpeed, speedT);
        
        particles.push({
            radius,
            angle,
            yOffset,
            speed: clamp(speed, config.minSpeed, config.maxSpeed),
            color: new THREE.Color(r, g, b)
        });
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: lerp(config.sizeMin, config.sizeMax, 0.5),
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: lerp(config.opacityMin, config.opacityMax, 0.7)
    });
    
    return { points: new THREE.Points(geometry, material), particles };
};

/**
 * Updates plasma particle positions and visual properties
 * @param points - The Points object to update
 * @param particles - Array of particle data
 * @param params - Current simulation parameters
 */
const updatePlasmaSystem = (
    points: THREE.Points,
    particles: PlasmaParticle[],
    params: SimulationParams
): void => {
    const positions = points.geometry.attributes.position.array as Float32Array;
    const speedMultiplier = params.plasmaSpeed;
    const deltaTime = params.deltaTime || 0.016;
    
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const deltaAngle = particle.speed * speedMultiplier * deltaTime * 1.5;
        particle.angle += deltaAngle;
        
        positions[i * 3] = Math.cos(particle.angle) * particle.radius;
        positions[i * 3 + 2] = Math.sin(particle.angle) * particle.radius;
        
        // Turbulence effect
        positions[i * 3 + 1] = particle.yOffset + Math.sin(params.time * 2 + particle.radius * 4) * 0.02;
    }
    
    points.geometry.attributes.position.needsUpdate = true;
    
    // Update visual properties based on parameters
    const material = points.material as THREE.PointsMaterial;
    const opacity = lerp(0.4, 0.95, params.intensity / 1.5);
    material.opacity = clamp(opacity, 0.3, 0.95);
    material.size = lerp(0.025, 0.07, params.density / 1.5);
};

// ============================================================================
// Scene Object Creation
// ============================================================================

/**
 * Creates the black hole event horizon sphere
 * @returns Mesh for the black hole core
 */
const createBlackHoleCore = (): THREE.Mesh => {
    const geometry = new THREE.SphereGeometry(0.95, 128, 128);
    const material = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.2,
        metalness: 0.98,
        emissive: 0x000000
    });
    return new THREE.Mesh(geometry, material);
};

/**
 * Creates the photon sphere (glowing region around event horizon)
 * @returns Mesh for the photon sphere
 */
const createPhotonSphere = (): THREE.Mesh => {
    const geometry = new THREE.SphereGeometry(1.55, 96, 96);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff4422,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    return new THREE.Mesh(geometry, material);
};

/**
 * Creates the main accretion disk
 * @returns Mesh for the accretion disk
 */
const createAccretionDisk = (): { mesh: THREE.Mesh; texture: THREE.CanvasTexture; rotationOffset: number } => {
    const texture = createDiskTexture();
    const geometry = new THREE.RingGeometry(1.3, 6.0, 256, 160);
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        emissive: 0xff4422,
        emissiveIntensity: 0.55,
        opacity: 0.88,
        color: 0xffaa66,
        roughness: 0.45,
        metalness: 0.35
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2.2;
    mesh.rotation.z = 0.2;
    
    return { mesh, texture, rotationOffset: 0 };
};

/**
 * Creates Einstein rings (gravitational lensing artifacts)
 * @returns Array of ring meshes
 */
const createEinsteinRings = (): THREE.Mesh[] => {
    const ringConfigs = [
        { radius: 2.0, thickness: 0.06, color: 0xff8844, emissive: 0xff4422, intensity: 0.65, opacity: 0.7, rotX: 0.007, rotZ: 0.005 },
        { radius: 2.6, thickness: 0.045, color: 0xffaa66, emissive: 0xff6622, intensity: 0.45, opacity: 0.55, rotX: -0.006, rotZ: 0.007 },
        { radius: 3.2, thickness: 0.035, color: 0xffcc88, emissive: 0xff8844, intensity: 0.3, opacity: 0.4, rotX: 0.005, rotZ: -0.004 }
    ];
    
    return ringConfigs.map(config => {
        const texture = createRingTexture(new THREE.Color(config.color), config.intensity);
        const geometry = new THREE.TorusGeometry(config.radius, config.thickness, 256, 400);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            color: config.color,
            emissive: config.emissive,
            emissiveIntensity: config.intensity,
            transparent: true,
            opacity: config.opacity,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(geometry, material);
        (ring as any).rotationSpeeds = { x: config.rotX, z: config.rotZ };
        (ring as any).baseOpacity = config.opacity;
        (ring as any).baseIntensity = config.intensity;
        return ring;
    });
};

/**
 * Creates relativistic jets (polar outflows)
 * @param particleCount - Number of particles per jet
 * @returns Object containing up and down jet Points objects
 */
const createRelativisticJets = (particleCount: number = 500): { up: THREE.Points; down: THREE.Points; speeds: number[] } => {
    const upPositions = new Float32Array(particleCount * 3);
    const downPositions = new Float32Array(particleCount * 3);
    const speeds: number[] = [];
    
    for (let i = 0; i < particleCount; i++) {
        const radius = 0.7 + Math.random() * 1.3;
        const angle = Math.random() * Math.PI * 2;
        
        upPositions[i * 3] = Math.cos(angle) * radius * Math.random();
        upPositions[i * 3 + 1] = 0.7 + Math.random() * 3;
        upPositions[i * 3 + 2] = Math.sin(angle) * radius * Math.random();
        
        downPositions[i * 3] = Math.cos(angle) * radius * Math.random();
        downPositions[i * 3 + 1] = -0.7 - Math.random() * 3;
        downPositions[i * 3 + 2] = Math.sin(angle) * radius * Math.random();
        
        speeds.push(0.018 + Math.random() * 0.03);
    }
    
    const upGeometry = new THREE.BufferGeometry();
    const downGeometry = new THREE.BufferGeometry();
    upGeometry.setAttribute('position', new THREE.BufferAttribute(upPositions, 3));
    downGeometry.setAttribute('position', new THREE.BufferAttribute(downPositions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0x88aaff,
        size: 0.05,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.7
    });
    
    return {
        up: new THREE.Points(upGeometry, material),
        down: new THREE.Points(downGeometry, material),
        speeds
    };
};

/**
 * Creates background star field with two layers
 * @returns Object containing both star field layers
 */
const createStarField = (): { layer1: THREE.Points; layer2: THREE.Points } => {
    // First layer - distant stars
    const starCount1 = 6000;
    const positions1 = new Float32Array(starCount1 * 3);
    for (let i = 0; i < starCount1; i++) {
        const radius = 200 + Math.random() * 300;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions1[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions1[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
        positions1[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    const geometry1 = new THREE.BufferGeometry();
    geometry1.setAttribute('position', new THREE.BufferAttribute(positions1, 3));
    const material1 = new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    
    // Second layer - colored stars
    const starCount2 = 3000;
    const positions2 = new Float32Array(starCount2 * 3);
    const colors2 = new Float32Array(starCount2 * 3);
    for (let i = 0; i < starCount2; i++) {
        positions2[i * 3] = (Math.random() - 0.5) * 400;
        positions2[i * 3 + 1] = (Math.random() - 0.5) * 300;
        positions2[i * 3 + 2] = (Math.random() - 0.5) * 200 - 50;
        
        const brightness = 0.5 + Math.random() * 0.5;
        colors2[i * 3] = brightness;
        colors2[i * 3 + 1] = brightness * (0.7 + Math.random() * 0.3);
        colors2[i * 3 + 2] = brightness * (0.5 + Math.random() * 0.5);
    }
    
    const geometry2 = new THREE.BufferGeometry();
    geometry2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
    geometry2.setAttribute('color', new THREE.BufferAttribute(colors2, 3));
    const material2 = new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    
    return {
        layer1: new THREE.Points(geometry1, material1),
        layer2: new THREE.Points(geometry2, material2)
    };
};

/**
 * Creates gravitational lensing effect sphere
 * @returns Mesh for lensing effect
 */
const createLensingSphere = (): THREE.Mesh => {
    const geometry = new THREE.SphereGeometry(2.4, 128, 128);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffaa55,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    return new THREE.Mesh(geometry, material);
};

// ============================================================================
// Lighting Setup
// ============================================================================

/**
 * Creates all scene lighting
 * @returns Object containing all light sources
 */
const createLights = () => {
    const ambient = new THREE.AmbientLight(0x110822);
    
    const main = new THREE.PointLight(0xff6633, 0.8, 20);
    main.position.set(2, 1.5, 2);
    
    const back = new THREE.PointLight(0x4488ff, 0.4, 20);
    back.position.set(-2, 1, -2);
    
    const plasma = new THREE.PointLight(0xff4422, 0.6, 15);
    plasma.position.set(1.5, 0, 1.5);
    
    return { ambient, main, back, plasma };
};

// ============================================================================
// Animation and Updates
// ============================================================================

/**
 * Updates accretion disk rotation and visual properties
 * @param disk - Disk object containing mesh, texture, and rotation offset
 * @param params - Current simulation parameters
 */
const updateAccretionDisk = (
    disk: { mesh: THREE.Mesh; texture: THREE.CanvasTexture; rotationOffset: number },
    params: SimulationParams
): void => {
    disk.rotationOffset += 0.02 * params.plasmaSpeed;
    disk.texture.offset.x = disk.rotationOffset;
    disk.texture.needsUpdate = true;
    
    disk.mesh.rotation.z += 0.01 * params.plasmaSpeed;
    
    const material = disk.mesh.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = 0.4 + params.intensity * 0.3;
    material.opacity = 0.7 + params.intensity * 0.2;
};

/**
 * Updates Einstein rings rotation and opacity
 * @param rings - Array of ring meshes
 * @param params - Current simulation parameters
 */
const updateEinsteinRings = (rings: THREE.Mesh[], params: SimulationParams): void => {
    rings.forEach(ring => {
        const speeds = (ring as any).rotationSpeeds;
        if (speeds) {
            ring.rotation.x += speeds.x;
            ring.rotation.z += speeds.z;
        }
        
        const material = ring.material as THREE.MeshStandardMaterial;
        const intensityFactor = clamp(params.intensity, 0.5, 1.8);
        const baseIntensity = (ring as any).baseIntensity || 0.5;
        const baseOpacity = (ring as any).baseOpacity || 0.6;
        
        material.emissiveIntensity = baseIntensity * (0.7 + intensityFactor * 0.3);
        material.opacity = clamp(baseOpacity * (0.8 + intensityFactor * 0.2), 0.2, 0.85);
    });
};

/**
 * Updates relativistic jets particle positions
 * @param jets - Jet system object
 * @param params - Current simulation parameters
 */
const updateRelativisticJets = (
    jets: { up: THREE.Points; down: THREE.Points; speeds: number[] },
    params: SimulationParams
): void => {
    const upPositions = jets.up.geometry.attributes.position.array as Float32Array;
    const downPositions = jets.down.geometry.attributes.position.array as Float32Array;
    const particleCount = jets.speeds.length;
    
    for (let i = 0; i < particleCount; i++) {
        // Upper jet
        let yUp = upPositions[i * 3 + 1];
        yUp += jets.speeds[i] * 0.5;
        
        if (yUp > 5.5) {
            yUp = 0.7;
            const radius = 0.7 + Math.random() * 1.3;
            const angle = Math.random() * Math.PI * 2;
            upPositions[i * 3] = Math.cos(angle) * radius * Math.random();
            upPositions[i * 3 + 2] = Math.sin(angle) * radius * Math.random();
        }
        upPositions[i * 3 + 1] = yUp;
        
        // Lower jet
        let yDown = downPositions[i * 3 + 1];
        yDown -= jets.speeds[i] * 0.5;
        
        if (yDown < -5.5) {
            yDown = -0.7;
            const radius = 0.7 + Math.random() * 1.3;
            const angle = Math.random() * Math.PI * 2;
            downPositions[i * 3] = Math.cos(angle) * radius * Math.random();
            downPositions[i * 3 + 2] = Math.sin(angle) * radius * Math.random();
        }
        downPositions[i * 3 + 1] = yDown;
    }
    
    jets.up.geometry.attributes.position.needsUpdate = true;
    jets.down.geometry.attributes.position.needsUpdate = true;
    
    // Update opacity based on intensity
    const materialUp = jets.up.material as THREE.PointsMaterial;
    const materialDown = jets.down.material as THREE.PointsMaterial;
    const opacity = clamp(0.4 + params.intensity * 0.3, 0.3, 0.9);
    materialUp.opacity = opacity;
    materialDown.opacity = opacity;
};

/**
 * Updates star field rotation and twinkling
 * @param stars - Star field object
 * @param params - Current simulation parameters
 */
const updateStarField = (stars: { layer1: THREE.Points; layer2: THREE.Points }, params: SimulationParams): void => {
    stars.layer1.rotation.y += 0.0002;
    stars.layer1.rotation.x += 0.0001;
    stars.layer2.rotation.y -= 0.0001;
    
    const material1 = stars.layer1.material as THREE.PointsMaterial;
    const material2 = stars.layer2.material as THREE.PointsMaterial;
    
    material1.opacity = 0.65 + Math.sin(params.time * 0.2) * 0.05;
    material2.opacity = 0.55 + Math.cos(params.time * 0.15) * 0.05;
};

/**
 * Updates dynamic lighting positions and intensities
 * @param lights - Light sources object
 * @param params - Current simulation parameters
 */
const updateLights = (
    lights: { ambient: THREE.AmbientLight; main: THREE.PointLight; back: THREE.PointLight; plasma: THREE.PointLight },
    params: SimulationParams
): void => {
    const time = params.time;
    const intensity = params.intensity;
    
    lights.plasma.position.x = Math.cos(time * 0.8) * 2.2;
    lights.plasma.position.z = Math.sin(time * 0.8) * 2.2;
    lights.plasma.intensity = 0.4 + Math.sin(time * 2) * 0.2 + intensity * 0.2;
    
    lights.main.intensity = 0.6 + intensity * 0.2;
    lights.back.intensity = 0.3 + intensity * 0.15;
};

// ============================================================================
// UI Controls
// ============================================================================

/**
 * Initializes UI controls and attaches event listeners
 * @returns UIControls object with all elements and current values
 */
const initUIControls = (): { controls: UIControls; getParams: () => { plasmaSpeed: number; intensity: number; density: number } } => {
    const controls: UIControls = {
        plasmaSpeed: document.getElementById('plasmaSpeed') as HTMLInputElement,
        intensity: document.getElementById('intensity') as HTMLInputElement,
        density: document.getElementById('density') as HTMLInputElement,
        speedValue: document.getElementById('speedVal') as HTMLElement,
        intensityValue: document.getElementById('intensityVal') as HTMLElement,
        densityValue: document.getElementById('densityVal') as HTMLElement
    };
    
    const updateValues = () => {
        controls.speedValue.textContent = parseFloat(controls.plasmaSpeed.value).toFixed(2);
        controls.intensityValue.textContent = parseFloat(controls.intensity.value).toFixed(2);
        controls.densityValue.textContent = parseFloat(controls.density.value).toFixed(2);
    };
    
    controls.plasmaSpeed.addEventListener('input', updateValues);
    controls.intensity.addEventListener('input', updateValues);
    controls.density.addEventListener('input', updateValues);
    
    const getParams = () => ({
        plasmaSpeed: parseFloat(controls.plasmaSpeed.value),
        intensity: parseFloat(controls.intensity.value),
        density: parseFloat(controls.density.value)
    });
    
    return { controls, getParams };
};

// ============================================================================
// Main Simulation Setup and Animation Loop
// ============================================================================

/**
 * Initializes and runs the black hole simulation
 */
const main = (): void => {
    // Setup scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010108);
    scene.fog = new THREE.FogExp2(0x010108, 0.0002);
    
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(7, 3, 10);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);
    
    // Post-processing
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.5, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 0.9;
    bloomPass.radius = 0.7;
    const effectComposer = new EffectComposer(renderer);
    effectComposer.addPass(renderPass);
    effectComposer.addPass(bloomPass);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.0;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 1.6;
    
    // Create all scene objects
    const blackHoleCore = createBlackHoleCore();
    const photonSphere = createPhotonSphere();
    const accretionDisk = createAccretionDisk();
    const einsteinRings = createEinsteinRings();
    const jets = createRelativisticJets(500);
    const stars = createStarField();
    const lensingSphere = createLensingSphere();
    const lights = createLights();
    
    // Create plasma systems with different configurations
    const innerPlasma = createPlasmaSystem({
        particleCount: 8000,
        innerRadius: 1.4,
        outerRadius: 5.8,
        minSpeed: 0.008,
        maxSpeed: 0.035,
        sizeMin: 0.03,
        sizeMax: 0.06,
        opacityMin: 0.6,
        opacityMax: 0.95,
        colorInner: new THREE.Color(0xff6644),
        colorOuter: new THREE.Color(0xffaa88)
    });
    
    const outerPlasma = createPlasmaSystem({
        particleCount: 5000,
        innerRadius: 3.2,
        outerRadius: 7.0,
        minSpeed: 0.005,
        maxSpeed: 0.02,
        sizeMin: 0.025,
        sizeMax: 0.05,
        opacityMin: 0.4,
        opacityMax: 0.7,
        colorInner: new THREE.Color(0xcc8855),
        colorOuter: new THREE.Color(0xaa6644)
    });
    
    const hotPlasma = createPlasmaSystem({
        particleCount: 3000,
        innerRadius: 1.2,
        outerRadius: 3.0,
        minSpeed: 0.018,
        maxSpeed: 0.045,
        sizeMin: 0.035,
        sizeMax: 0.07,
        opacityMin: 0.7,
        opacityMax: 1.0,
        colorInner: new THREE.Color(0xffaa88),
        colorOuter: new THREE.Color(0xff6644)
    });
    
    // Add all objects to scene
    scene.add(blackHoleCore);
    scene.add(photonSphere);
    scene.add(accretionDisk.mesh);
    scene.add(innerPlasma.points);
    scene.add(outerPlasma.points);
    scene.add(hotPlasma.points);
    einsteinRings.forEach(ring => scene.add(ring));
    scene.add(jets.up);
    scene.add(jets.down);
    scene.add(stars.layer1);
    scene.add(stars.layer2);
    scene.add(lensingSphere);
    scene.add(lights.ambient);
    scene.add(lights.main);
    scene.add(lights.back);
    scene.add(lights.plasma);
    
    // Initialize UI controls
    const ui = initUIControls();
    
    // Animation state
    let lastTime = performance.now() / 1000;
    let animationFrameId: number;
    
    /**
     * Main animation loop
     */
    const animate = (): void => {
        const now = performance.now() / 1000;
        let deltaTime = now - lastTime;
        deltaTime = clamp(deltaTime, 0.01, 0.033);
        lastTime = now;
        
        // Get current parameters from UI
        const uiParams = ui.getParams();
        
        const params: SimulationParams = {
            plasmaSpeed: uiParams.plasmaSpeed,
            intensity: uiParams.intensity,
            density: uiParams.density,
            time: now,
            deltaTime: deltaTime
        };
        
        // Update bloom effect
        bloomPass.strength = 0.6 + params.intensity * 0.5;
        
        // Update all systems
        const pulse = 1 + Math.sin(now * 2.5) * 0.008;
        photonSphere.scale.set(pulse, pulse, pulse);
        
        updateAccretionDisk(accretionDisk, params);
        updatePlasmaSystem(innerPlasma.points, innerPlasma.particles, params);
        updatePlasmaSystem(outerPlasma.points, outerPlasma.particles, params);
        updatePlasmaSystem(hotPlasma.points, hotPlasma.particles, params);
        updateEinsteinRings(einsteinRings, params);
        updateRelativisticJets(jets, params);
        updateStarField(stars, params);
        updateLights(lights, params);
        
        // Update lensing sphere
        const lensScale = 1 + Math.sin(now * 1.5) * 0.02;
        lensingSphere.scale.set(lensScale * 1.05, lensScale, lensScale * 1.05);
        (lensingSphere.material as THREE.MeshBasicMaterial).opacity = 0.06 + params.intensity * 0.05;
        
        // Update controls and render
        controls.update();
        effectComposer.render();
        
        animationFrameId = requestAnimationFrame(animate);
    };
    
    // Handle window resize
    const handleResize = (): void => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        effectComposer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start animation
    animate();
    
    console.log('Black Hole Simulator started successfully');
};

// Start the simulation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}