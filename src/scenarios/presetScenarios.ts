/**
 * presetScenarios.ts
 * 
 * Catalog of interactive simulation scenarios demonstrating various astrophysical principles.
 * 
 * EDUCATIONAL CONCEPT: "Keplerian Orbits & Velocity Regimes"
 * -----------------------------------------------------------
 * In gravitational two-body systems, the shape of an orbit is governed strictly
 * by the ratio between kinetic energy (velocity) and gravitational potential energy:
 * 
 * 1. Circular Speed: v_circ = sqrt(G * M / r)
 *    Centripetal acceleration matches gravitational pull. The orbit is a closed circle.
 * 2. Escape Speed: v_esc = sqrt(2 * G * M / r) = sqrt(2) * v_circ ≈ 1.414 * v_circ
 *    Kinetic energy equals gravitational binding energy. The orbit breaks open into a parabola.
 * 3. Velocity Regimes:
 *    - v < v_circ: Sub-orbital plunge (inward ellipse; will hit primary if v is low).
 *    - v = v_circ: Stable circle.
 *    - v_circ < v < v_esc: Bound eccentric ellipse.
 *    - v >= v_esc: Unbound hyperbolic escape into deep space.
 */

import { Vector2 } from '../physics/Vector2';
import { CelestialBody } from '../entities/CelestialBody';
import { CelestialBodyFactory } from '../factories/CelestialBodyFactory';
import { BodyCategory, BodyType } from '../entities/types';
import type { Universe } from '../simulation/Universe';
import type { Camera } from '../renderer/Camera';
import type { Scenario } from './types';

/** Standard gravitational constant used across default scenarios */
export const SCENARIO_G = 50.0;

/**
 * Scenario 1: Keplerian Solar System (Default)
 * ---------------------------------------------
 * A massive central yellow dwarf star with two orbiting planets in stable circular orbits:
 * - Sol (Mass: 100, Anchor)
 * - Terra (Rocky planet, r = 20)
 * - Jovian (Gas giant, r = 100)
 */
export const keplerianSystemScenario: Scenario = {
  id: 'keplerian-system',
  name: '1. Keplerian Solar System ☀️',
  description: 'Stable circular orbits: Inward gravitational pull perfectly balances outward tangential inertia.',
  setup: (universe: Universe, camera: Camera): void => {
    universe.clear();
    camera.reset();
    universe.enableGravity(SCENARIO_G);

    const SUN_MASS = 100.0;

    // Central Star
    const sol = CelestialBodyFactory.createSun(
      new Vector2(0, 0),
      new Vector2(0, 0),
      'Sol (Yellow Dwarf)'
    );
    sol.mass = SUN_MASS;
    sol.radius = 4.0;
    sol.fixed = true;

    // Helper: v = sqrt(G * M / r)
    const calcSpeed = (r: number) => Math.sqrt((SCENARIO_G * SUN_MASS) / r);

    // Inner rocky planet (Terra)
    const terraDistance = 20.0;
    const terraSpeed = calcSpeed(terraDistance);
    const terra = CelestialBodyFactory.createPlanet(
      new Vector2(terraDistance, 0),
      false,
      new Vector2(0, terraSpeed),
      'Terra (Terrestrial)'
    );
    terra.radius = 1.5;

    // Outer gas giant (Jovian)
    const jovianDistance = 100.0;
    const jovianSpeed = calcSpeed(jovianDistance);
    const jovian = CelestialBodyFactory.createPlanet(
      new Vector2(-jovianDistance, 0),
      true,
      new Vector2(0, -jovianSpeed),
      'Jovian (Gas Giant)'
    );
    jovian.radius = 2.5;

    universe.addBodies([sol, terra, jovian]);
  },
};

/**
 * Scenario 2: Orbital Velocity Regimes (The 4 Fates)
 * --------------------------------------------------
 * Demonstrates the 4 distinct outcomes of velocity vs gravity.
 * 4 identical test probes are released at distance r = 60 from the central star,
 * each with a different initial tangential speed along +Y:
 * 1. 🔴 Plunge Probe (0.5x v_circ): Sub-orbital trajectory falling into the sun.
 * 2. 🟢 Circular Probe (1.0x v_circ): Perfectly circular orbit.
 * 3. 🟡 Elliptical Probe (1.22x v_circ): Stretched egg-shaped bound orbit.
 * 4. 🔵 Escape Probe (1.50x v_circ > v_esc): Hyperbolic escape trajectory into deep space.
 */
export const velocityRegimesScenario: Scenario = {
  id: 'velocity-regimes',
  name: '2. Velocity Regimes (The 4 Fates) 🎯',
  description: 'Compares the 4 orbital fates: Plunge (0.5x), Circle (1.0x), Ellipse (1.22x), and Escape (1.5x > v_esc).',
  setup: (universe: Universe, camera: Camera): void => {
    universe.clear();
    camera.reset();
    camera.setZoom(0.85); // Slightly wider view to observe the elliptical and escape paths
    universe.enableGravity(SCENARIO_G);

    const SUN_MASS = 100.0;
    const sol = CelestialBodyFactory.createSun(
      new Vector2(0, 0),
      new Vector2(0, 0),
      'Sol Anchor'
    );
    sol.mass = SUN_MASS;
    sol.radius = 4.0;
    sol.fixed = true;

    // Benchmark circular speed at r = 60:
    // v_circ = sqrt(50 * 100 / 60) ≈ 9.1287 units/sec
    // v_esc = sqrt(2) * v_circ ≈ 12.91 units/sec
    const launchDistance = 60.0;
    const vCirc = Math.sqrt((SCENARIO_G * SUN_MASS) / launchDistance);

    // 1. Plunge Probe (Sub-orbital: v = 0.5 * v_circ ≈ 4.56 units/sec)
    const plungeProbe = new CelestialBody({
      name: 'Probe 1: Plunge (0.5x)',
      category: BodyCategory.SMALL_BODY,
      type: BodyType.ASTEROID,
      mass: 0.001,
      radius: 1.2,
      position: new Vector2(launchDistance, 0),
      velocity: new Vector2(0, vCirc * 0.5),
      color: '#f87171', // Red
    });

    // 2. Circular Probe (v = 1.0 * v_circ ≈ 9.13 units/sec)
    const circularProbe = new CelestialBody({
      name: 'Probe 2: Circle (1.0x)',
      category: BodyCategory.SMALL_BODY,
      type: BodyType.ASTEROID,
      mass: 0.001,
      radius: 1.2,
      position: new Vector2(launchDistance, 0),
      velocity: new Vector2(0, vCirc * 1.0),
      color: '#4ade80', // Green
    });

    // 3. Elliptical Probe (v = 1.22 * v_circ ≈ 11.14 units/sec)
    const ellipticalProbe = new CelestialBody({
      name: 'Probe 3: Ellipse (1.22x)',
      category: BodyCategory.SMALL_BODY,
      type: BodyType.ASTEROID,
      mass: 0.001,
      radius: 1.2,
      position: new Vector2(launchDistance, 0),
      velocity: new Vector2(0, vCirc * 1.22),
      color: '#fde047', // Yellow
    });

    // 4. Escape Probe (v = 1.50 * v_circ ≈ 13.69 units/sec > v_esc)
    const escapeProbe = new CelestialBody({
      name: 'Probe 4: Escape (1.50x)',
      category: BodyCategory.SMALL_BODY,
      type: BodyType.ASTEROID,
      mass: 0.001,
      radius: 1.2,
      position: new Vector2(launchDistance, 0),
      velocity: new Vector2(0, vCirc * 1.5),
      color: '#38bdf8', // Cyan
    });

    universe.addBodies([sol, plungeProbe, circularProbe, ellipticalProbe, escapeProbe]);
  },
};

/**
 * Scenario 3: Binary Star System (The Dancing Suns)
 * -------------------------------------------------
 * Two equal-mass stars orbiting their shared center of mass (barycenter),
 * with a distant circumbinary planet looping around both.
 * 
 * Physics of Equal-Mass Binary Circular Orbit:
 * - Separation d = 50 units (x = -25 and x = +25).
 * - Gravitational force: F = G * M^2 / d^2.
 * - Orbit radius R = d / 2 = 25.
 * - Circular orbital velocity: v = sqrt(G * M / (4 * R)) = 5.0 units/sec.
 */
export const binaryStarsScenario: Scenario = {
  id: 'binary-stars',
  name: '3. Binary Star System (Dancing Suns) 👥',
  description: 'Two non-fixed stars orbiting their shared center of mass with a circumbinary planet.',
  setup: (universe: Universe, camera: Camera): void => {
    universe.clear();
    camera.reset();
    camera.setZoom(0.9);
    universe.enableGravity(SCENARIO_G);

    const STAR_MASS = 50.0;
    const separation = 50.0;
    const rOrbit = separation / 2; // 25.0

    // Mutual circular velocity: v = sqrt(G * M / (4 * R)) = sqrt(50 * 50 / 100) = 5.0
    const vOrbit = Math.sqrt((SCENARIO_G * STAR_MASS) / (4 * rOrbit));

    // Star Alpha (Yellow Dwarf, left)
    const starAlpha = CelestialBodyFactory.createSun(
      new Vector2(-rOrbit, 0),
      new Vector2(0, -vOrbit),
      'Star Alpha'
    );
    starAlpha.mass = STAR_MASS;
    starAlpha.radius = 3.0;
    starAlpha.fixed = false; // Free to orbit under gravity!

    // Star Beta (Blue Giant, right)
    const starBeta = CelestialBodyFactory.createBlueGiant(
      new Vector2(rOrbit, 0),
      new Vector2(0, vOrbit),
      'Star Beta'
    );
    starBeta.mass = STAR_MASS;
    starBeta.radius = 3.0;
    starBeta.fixed = false; // Free to orbit under gravity!

    // Circumbinary Planet (Tatooine) orbiting both stars at distance r = 110
    // Total interior mass = 100.0 => v = sqrt(G * M_total / r)
    const planetDist = 110.0;
    const planetSpeed = Math.sqrt((SCENARIO_G * (STAR_MASS * 2)) / planetDist);
    const tatooine = CelestialBodyFactory.createPlanet(
      new Vector2(0, planetDist),
      false,
      new Vector2(-planetSpeed, 0),
      'Tatooine (Circumbinary)'
    );
    tatooine.radius = 1.5;

    universe.addBodies([starAlpha, starBeta, tatooine]);
  },
};

/** All available preset simulation scenarios in chronological order */
export const ALL_SCENARIOS: readonly Scenario[] = [
  keplerianSystemScenario,
  velocityRegimesScenario,
  binaryStarsScenario,
];

/**
 * Finds a scenario by its unique identifier.
 * 
 * @param id The scenario ID
 * @returns The matching Scenario or undefined
 */
export function getScenarioById(id: string): Scenario | undefined {
  return ALL_SCENARIOS.find((scenario) => scenario.id === id);
}
