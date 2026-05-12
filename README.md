# Black Hole Simulator - Relativistic Plasma Accretion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Three.js](https://img.shields.io/badge/Three.js-r128-green)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple)](https://vitejs.dev/)

A **real-time 3D simulation** of a supermassive black hole featuring relativistic plasma accretion, gravitational lensing, Einstein rings, and relativistic jets. Built with Three.js and TypeScript.

## Features

- **Relativistic Plasma Accretion Disk** - Three layers of hot plasma particles with differential rotation (inner layers rotate faster)
- **Gravitational Lensing** - Realistic light distortion around the event horizon
- **Einstein Rings** - Gravitational lensing artifacts with edge fading effects
- **Relativistic Jets** - Polar outflows with particle animation
- **Photon Sphere** - Pulsing glow region where light orbits the black hole
- **Dynamic Lighting** - Real-time point lights with color shifting based on plasma temperature
- **Post-Processing Effects** - Bloom and glow effects for realistic visuals
- **Interactive Camera** - Orbit controls with mouse (rotate, zoom)
- **Real-time UI Controls** - Adjust plasma speed, visual intensity, and particle density

## Controls

| Action | Control |
|--------|---------|
| Rotate camera | Left mouse button + drag |
| Zoom in/out | Mouse wheel |
| Plasma speed | UI slider (0-2x) |
| Visual intensity | UI slider (0.3-2x) |
| Particle density | UI slider (0.5-2x) |

## Technologies

- **Three.js** - 3D graphics library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **Effect Composer** - Post-processing effects (Bloom)
- **Tests** - Jest
