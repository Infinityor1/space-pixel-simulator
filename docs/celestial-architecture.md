# Celestial Architecture & Taxonomy Specification

**Project:** Pixel Galaxy Simulator (Software Engineering Final Year Project)  
**Date:** October 2026  
**Status:** Approved Architectural Baseline  

---

## 1. Design Philosophy & Separation of Concerns

The simulator operates on three distinct conceptual layers:
1. **The Physics & Entity Model (The Truth):** Mathematically grounded 2D Newtonian physics (positions, velocities, masses, gravitational interactions). Pure TypeScript, completely decoupled from the DOM and Canvas APIs so it can run inside Web Workers or automated test suites.
2. **The Intermediary & Viewport Pipeline (The Bridge):** 
   - **`Universe` (Scene Container):** Pure data manager that tracks active bodies, handles additions/removals, and provides spatial bounds.
   - **`Camera` (Coordinate Transformer):** Translates continuous world coordinates $(X_w, Y_w)$ centered at $(0, 0)$ into discrete screen buffer pixels $(X_s, Y_s)$, handling zoom levels and viewport culling.
3. **The Pixel Render Pipeline (The View):** Retro, low-resolution pixel-art presentation ($320 \times 180$ buffer, nearest-neighbor upscaling, limited palette, glow halos). 

> **Architectural Rule:** A `CelestialBody` never draws itself. It only stores state. The `Universe` holds bodies, the `Camera` transforms world coordinates and culls off-screen entities, and the `CanvasRenderer` paints the pixels.

---

## 2. Astrophysics Taxonomy

Every object in the universe is categorized into a two-level classification: `BodyCategory` (broad physical nature) and `BodyType` (specific astrophysical classification).

```
BodyCategory
 ├── STAR
 │    ├── YELLOW_DWARF      (Sun-like, Class G)
 │    ├── RED_DWARF         (Cool, long-lived, Class M)
 │    ├── BLUE_GIANT        (Massive, hot, luminous, Class O/B)
 │    ├── RED_SUPERGIANT    (Dying massive star, precursor to supernova)
 │    ├── WHITE_DWARF       (Dense cooling remnant of Sun-like stars)
 │    └── NEUTRON_STAR      (Ultra-dense pulsar remnant)
 ├── BLACK_HOLE
 │    ├── STELLAR_BLACK_HOLE      (Collapsed core of giant star)
 │    └── SUPERMASSIVE_BLACK_HOLE (Galactic anchor, millions of solar masses)
 ├── PLANET
 │    ├── TERRESTRIAL_PLANET      (Rocky, small, e.g. Earth/Mars)
 │    └── GAS_GIANT               (Large, banded atmosphere, e.g. Jupiter)
 ├── SMALL_BODY
 │    ├── ASTEROID                (Rocky kinetic debris)
 │    └── COMET                   (Icy nucleus with dynamic solar-driven tail)
 ├── GAS_CLOUD
 │    └── GAS_PARTICLE            (Diffuse interstellar medium, star nurseries)
 └── DARK_MATTER
      └── DARK_MATTER_HALO        (Invisible gravitational scaffolding)
```

### Astrophysical & Visual Specification Table

| Body Type | Category | Typical Mass ($M_\odot$) | Core Color | Halo / Trail Style | Physical Role in Simulation |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Yellow Dwarf** | `STAR` | $1.0$ | Gold (`#fde047`) | Orange 1px cross | Stable host for planetary systems |
| **Red Dwarf** | `STAR` | $0.2$ | Crimson (`#f87171`) | None (dim 1px) | Most abundant star; long-lived |
| **Blue Giant** | `STAR` | $16.0$ | Cyan (`#67e8f9`) | Deep blue cross | Gravitational heavyweight; short life |
| **White Dwarf** | `STAR` | $0.8$ | Pure White (`#ffffff`) | None (bright point)| Compact, hot stellar remnant |
| **Supermassive Black Hole** | `BLACK_HOLE` | $500.0+$ | Black (`#000000`) | Violet accretion ring | Gravitational center of galaxies |
| **Stellar Black Hole** | `BLACK_HOLE` | $25.0$ | Black (`#000000`) | Cyan/blue accretion | Severe local gravitational sink |
| **Terrestrial Planet** | `PLANET` | $0.001$ | Slate Blue (`#94a3b8`) | None (1px) | Orbits stars; low gravitational pull |
| **Gas Giant** | `PLANET` | $0.01$ | Amber/Sand (`#fcd34d`) | None (1px) | Can shepherd asteroids and moonlets |
| **Asteroid** | `SMALL_BODY` | $0.00001$ | Dull Gray (`#64748b`) | None | High-speed kinetic impacts |
| **Comet** | `SMALL_BODY` | $0.00001$ | Ice Cyan (`#e0f2fe`) | Solar wind tail | Highly eccentric Keplerian orbits |

---

## 3. Architecture & Software Engineering Patterns

To adhere to **SOLID principles** and industry design patterns, system architecture is organized into clean, decoupled layers:

```mermaid
flowchart TD
    subgraph Macro Layer [System & Presets]
        GF[GalaxyFactory / PresetGenerator]
    end

    subgraph Atomic Layer [Creational Pattern]
        BF[CelestialBodyFactory]
    end

    subgraph Entity & Scene Layer [Domain Model]
        CB[CelestialBody]
        V[Vector2]
        U[Universe / Scene]
        U -->|holds & manages| CB
        CB *--|holds position & velocity| V
    end

    subgraph Intermediary & Viewport Layer [Bridge]
        CAM[Camera / Viewport]
    end

    subgraph Render Layer [View]
        CR[CanvasRenderer (320x180 Buffer)]
    end

    GF -->|Calls for individual bodies| BF
    BF -->|Instantiates| CB
    GF -->|Populates| U
    CR -->|Queries visible bodies| U
    CR -->|Transforms coords via| CAM
    CAM -->|WorldToScreen| CR
```

### Layer 1: Domain Entities (`src/entities/`)
- **`Vector2`**: 2D coordinate, velocity, and distance calculations.
- **`CelestialBody`**: Single atomic data container storing mass, position, velocity, and visual rendering metadata. Free of rendering logic.

### Layer 2: Atomic Creational Layer (`src/factories/CelestialBodyFactory.ts`)
- **Pattern:** Factory Pattern (GoF).
- **Responsibility:** Encapsulates the specific parameters (mass, colors, radius) required to construct individual bodies:
  - `createSun(position, velocity?)`
  - `createRedDwarf(position, velocity?)`
  - `createBlueGiant(position, velocity?)`
  - `createBlackHole(position, isSupermassive?)`
  - `createPlanet(position, isGasGiant?)`
  - `createAsteroid(position, velocity)`
  - `createComet(position, velocity)`

### Layer 3: Intermediary Scene & Viewport Layer
- **`Universe` (`src/simulation/Universe.ts`):**
  - Manages the collection of `CelestialBody` instances.
  - Zero DOM dependencies; 100% unit-testable in Node/Vitest.
  - Exposes addition, removal, clearing, and iteration capabilities.
- **`Camera` (`src/renderer/Camera.ts`):**
  - Encapsulates camera position $(X_{\text{cam}}, Y_{\text{cam}})$, zoom factor, and screen dimensions.
  - Mathematical transformation:
    $$X_{\text{screen}} = (X_{\text{world}} - X_{\text{cam}}) \cdot \text{zoom} + \frac{\text{width}}{2}$$
    $$Y_{\text{screen}} = (Y_{\text{world}} - Y_{\text{cam}}) \cdot \text{zoom} + \frac{\text{height}}{2}$$
  - **Viewport Culling:** Filters out bodies positioned beyond the visible buffer boundaries, preventing wasted draw calls.

### Layer 4: Macro Systems Layer (`src/factories/GalaxyFactory.ts`)
- **Pattern:** Layered Factory / Preset Generator (Single Responsibility Principle).
- **Responsibility:** Constructs macro-systems of hundreds or thousands of bodies:
  - Calculates exponential galactic disk distributions.
  - Computes tangential Keplerian orbital velocity ($v = \sqrt{\frac{GM}{r}}$) so disk stars orbit stably without flying apart.
  - Populates a `Universe` instance with presets: `createMilkyWay()`, `createSolarSystem()`, `createGalaxyCollision()`.

### Layer 5: Renderer (`src/renderer/CanvasRenderer.ts`)
- Projects visible bodies onto the $320 \times 180$ low-res buffer using integer pixel drawing, halo routines, and nearest-neighbor scaling.

---

## 4. Academic Justification for the FYP Report

1. **Single Responsibility Principle (SRP):**
   - Entities hold physical state, the `Universe` manages collection lifecycle, the `Camera` performs coordinate geometry, and the `CanvasRenderer` issues pixel draw calls.
2. **Open/Closed Principle (OCP):**
   - Adding a new celestial type (e.g., `PULSAR` or `DARK_MATTER`) requires adding an enum entry and a factory method, without modifying physics, camera projection, or rendering algorithms.
3. **Decoupled Architecture & Testability:**
   - The domain model (`CelestialBody`, `Universe`, physics) runs headless without HTML canvas dependencies, enabling comprehensive automated unit testing in Vitest.
4. **Performance & Viewport Culling:**
   - Off-screen bodies are pruned at the camera transformation stage before reaching the canvas rasterizer.

---

## 5. Phased Implementation Roadmap

- [x] **Step 0:** Project setup (Vite, TypeScript, Vitest).
- [x] **Step 1:** CanvasRenderer & low-res pixel buffer.
- [x] **Step 2:** `Vector2` mathematical class and automated test suite.
- [ ] **Step 3:** Celestial types and enums (`src/entities/types.ts`).
- [ ] **Step 4:** `CelestialBody` entity class (`src/entities/CelestialBody.ts`) + unit tests.
- [ ] **Step 5:** `CelestialBodyFactory` (`src/factories/CelestialBodyFactory.ts`) + unit tests.
- [ ] **Step 6:** `Camera` viewport & coordinate transformer (`src/renderer/Camera.ts`) + unit tests.
- [ ] **Step 7:** `Universe` scene container (`src/simulation/Universe.ts`) + unit tests.
- [ ] **Step 8:** Scene rendering pipeline in `CanvasRenderer` and `src/main.ts`.
- [ ] **Step 9:** Gravitational physics engine (Leapfrog integrator, $F = G \frac{m_1 m_2}{r^2}$).
- [ ] **Step 10:** `GalaxyFactory` (Milky Way preset with rotating disk).

