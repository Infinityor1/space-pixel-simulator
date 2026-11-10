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
| **Red Supergiant** | `STAR` | $18.0$ | Vermilion (`#ef4444`) | Dark red corona | Massive bloated star; pre-supernova |
| **White Dwarf** | `STAR` | $0.8$ | Pure White (`#ffffff`) | None (bright point)| Compact, hot stellar remnant |
| **Neutron Star** | `STAR` | $1.5$ | Blue-White (`#e0e7ff`) | Indigo pulsar halo | Ultra-dense remnant core |
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
  - `createRedSupergiant(position, velocity?)`
  - `createWhiteDwarf(position, velocity?)`
  - `createNeutronStar(position, velocity?)`
  - `createBlackHole(position, isSupermassive?)`
  - `createPlanet(position, isGasGiant?)`
  - `createAsteroid(position, velocity)`
  - `createComet(position, velocity)`

### Layer 1: Domain Entities & Astrodynamics Math (`src/entities/`, `src/physics/`)
- **`Vector2` (`src/physics/Vector2.ts`)**: 2D coordinate, velocity, and distance calculations with `magnitudeSquared()` optimizations.
- **`CelestialBody` (`src/entities/CelestialBody.ts`)**: Single atomic data container storing mass, position, velocity, and visual rendering metadata. Free of rendering logic.
- **`OrbitMath` (`src/physics/OrbitMath.ts`)**:
  - **Perifocal Conic Coordinate System ($P, Q$):** Generates exact orbital positions and velocities from orbital elements ($a, e, \omega, \nu$):
    $$\vec{r} = \frac{p}{1 + e \cos \nu} (\cos \nu \hat{P} + \sin \nu \hat{Q}), \quad \vec{v} = \sqrt{\frac{\mu}{p}} [-\sin \nu \hat{P} + (e + \cos \nu) \hat{Q}]$$
    Powers realistic eccentric comets ($0.7 < e < 0.95$) and grazing hyperbolic galaxy collisions ($e \ge 1.0$).
  - **Sphere of Influence (SOI) & Moon Shepherding:**
    $$r_{\text{SOI}} \approx r \left(\frac{m_{\text{planet}}}{M_{\text{star}}}\right)^{2/5}$$
    Guarantees moonlets spawned near gas giants stay gravitationally bound rather than stripped by solar tides.
  - **Solar Radiation Pressure Vector:**
    Directs comet particle tails radially outward from the host star along $\hat{u} = \frac{\vec{r}_{\text{comet}} - \vec{r}_{\text{star}}}{|\vec{r}_{\text{comet}} - \vec{r}_{\text{star}}|}$.

### Layer 2: Atomic Creational Layer (`src/factories/CelestialBodyFactory.ts`)
- **Pattern:** Factory Pattern (GoF).
- **Responsibility:** Encapsulates the specific parameters (mass, colors, radius) required to construct individual bodies:
  - `createSun(position, velocity?)`
  - `createRedDwarf(position, velocity?)`
  - `createBlueGiant(position, velocity?)`
  - `createRedSupergiant(position, velocity?)`
  - `createWhiteDwarf(position, velocity?)`
  - `createNeutronStar(position, velocity?)`
  - `createBlackHole(position, isSupermassive?)`
  - `createPlanet(position, isGasGiant?)`
  - `createAsteroid(position, velocity)`
  - `createComet(position, velocity)`

### Layer 3: Intermediary Scene & Viewport Layer
- **`Universe` (`src/simulation/Universe.ts`):**
  - Manages the collection of `CelestialBody` instances. Zero DOM dependencies; 100% unit-testable in Node/Vitest.
  - **Conservation Invariants Diagnostics:** Computes total mechanical energy $E = T + V$ and total angular momentum $H_z = \sum m_i (x_i v_{y,i} - y_i v_{x,i})$.
  - **Barycentric Centering:** Provides center of mass $\vec{R}_{\text{cm}} = \frac{\sum m_i \vec{r}_i}{\sum m_i}$ and momentum cancellation to prevent galaxy drift.
- **`Camera` (`src/renderer/Camera.ts`):**
  - Encapsulates camera position $(X_{\text{cam}}, Y_{\text{cam}})$, zoom factor, and screen dimensions.
  - Mathematical transformation:
    $$X_{\text{screen}} = (X_{\text{world}} - X_{\text{cam}}) \cdot \text{zoom} + \frac{\text{width}}{2}$$
    $$Y_{\text{screen}} = (Y_{\text{world}} - Y_{\text{cam}}) \cdot \text{zoom} + \frac{\text{height}}{2}$$
  - **Viewport Culling:** Filters out bodies positioned beyond the visible buffer boundaries, preventing wasted draw calls.

### Layer 4: Macro Systems Layer (`src/factories/GalaxyFactory.ts`, `src/scenarios/`)
- **Pattern:** Layered Factory / Preset Generator (Single Responsibility Principle).
- **Responsibility:** Constructs macro-systems of hundreds or thousands of bodies:
  - **Enclosed Mass & Dark Matter Halo Rotation Curve:**
    $$v_{\text{tangent}}(r) = \sqrt{\frac{G \cdot [M_{\text{SMBH}} + M_{\text{disk}}(<r) + M_{\text{halo}}(<r)]}{r + \epsilon}}$$
    Reproduces authentic flat galactic rotation curves without disk collapse.
  - **Barycentric Momentum Cancellation:** Zeroes net system velocity $\vec{v}_{\text{cm}} = \frac{\sum m_i \vec{v}_i}{\sum m_i}$ so the galaxy remains stationary at $(0, 0)$.
  - **Preset Scenarios (`src/scenarios/`):** Provides educational presets for Keplerian orbits, the 4 velocity fates, and binary star systems.

### Layer 5: Renderer (`src/renderer/CanvasRenderer.ts`)
- Projects visible bodies onto the $320 \times 180$ low-res buffer using sub-linear zoom scaling ($r \cdot \text{zoom}^{0.8}$), integer pixel drawing, halo routines, and nearest-neighbor scaling.

---

## 4. Academic Justification for the FYP Report

1. **Single Responsibility Principle (SRP) & Decoupled Architecture:**
   - Entities hold physical state, `Universe` manages collection lifecycle, `Camera` performs coordinate geometry, and `CanvasRenderer` issues pixel draw calls. Enables headless unit testing in Vitest without browser mocks.
2. **Open/Closed Principle (OCP):**
   - Adding a new celestial type requires adding an enum entry and a factory method, without modifying physics, camera projection, or rendering algorithms.
3. **Astrodynamic Rigor & Symplectic Conservation:**
   - Replacing standard Euler with a Symplectic Leapfrog (Velocity Verlet) integrator mathematically preserves geometric phase space, keeping energy drift $|\Delta E / E_0| < 10^{-4}$ across 10,000+ simulation steps.
4. **Physical Justification of Dark Matter:**
   - Using Newton's Shell Theorem with an enclosed mass profile $M(<r)$ demonstrates why galaxies require dark matter halos to prevent outer stellar disk dispersion.
5. **Performance & Viewport Culling:**
   - Off-screen bodies are pruned at the camera transformation stage before reaching the canvas rasterizer, scaling to thousands of bodies.

---

## 5. Phased Implementation Roadmap

- [x] **Step 0:** Project setup (Vite, TypeScript, Vitest).
- [x] **Step 1:** CanvasRenderer & low-res pixel buffer.
- [x] **Step 2:** `Vector2` mathematical class and automated test suite.
- [x] **Step 3:** Celestial types and enums (`src/entities/types.ts`).
- [x] **Step 4:** `CelestialBody` entity class (`src/entities/CelestialBody.ts`) + unit tests.
- [x] **Step 5:** `CelestialBodyFactory` (`src/factories/CelestialBodyFactory.ts`) + unit tests.
- [x] **Step 6:** `Camera` viewport & coordinate transformer (`src/renderer/Camera.ts`) + unit tests.
- [x] **Step 7:** `Universe` scene container (`src/simulation/Universe.ts`) + unit tests.
- [x] **Step 8:** Scene rendering pipeline in `CanvasRenderer` and `src/main.ts`.
- [x] **Step 9:** Newtonian gravitational physics ($F = G \frac{m_1 m_2}{r^2}$) and live simulation loop.
- [x] **Step 9.5:** Preset Simulation Scenarios & Examples tab (Keplerian, 4 Velocity Regimes, Binary Stars).
- [ ] **Step 9.6:** Interactive Drag-and-Drop Body Palette with Auto-Orbit velocity assist.
- [ ] **Step 10:** Plummer Gravitational Softening ($\epsilon$), Symplectic Leapfrog (Velocity Verlet) Integrator, and Energy Conservation Diagnostics ($E, H_z$).
- [ ] **Step 11:** Perifocal Conic Spawner (`OrbitMath.ts`) & Sphere of Influence (SOI) moonlet shepherding.
- [ ] **Step 12:** `GalaxyFactory` (Milky Way with exponential disk, Enclosed Mass $M(<r)$, Dark Matter Halo flat rotation curve, and Barycentric zeroing).
- [ ] **Step 13:** Inelastic Collision & Accretion Mergers ($M_{\text{new}} = m_1 + m_2$, $\vec{v}_{\text{new}} = \frac{m_1 \vec{v}_1 + m_2 \vec{v}_2}{m_1 + m_2}$) and Solar Wind Comet Tails.
- [ ] **Step 14:** Barnes-Hut $\mathcal{O}(N \log N)$ Quadtree optimization for scaling to 1,000+ stars.

