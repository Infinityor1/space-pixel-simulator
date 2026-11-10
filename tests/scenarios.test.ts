/**
 * scenarios.test.ts
 * 
 * Unit tests for simulation scenarios and preset configurations.
 * 
 * Testing Focus:
 * 1. Scenario catalog registry and lookup by ID.
 * 2. Keplerian system setup and body count.
 * 3. Velocity regimes scenario launches 4 probes at the correct velocity ratios.
 * 4. Binary star system setups stars with mutual circular velocity and circumbinary planet.
 * 5. Scenario switching cleanly clears prior bodies and resets camera.
 */

import { describe, it, expect } from 'vitest';
import { Universe } from '../src/simulation/Universe';
import { Camera } from '../src/renderer/Camera';
import {
  ALL_SCENARIOS,
  getScenarioById,
  keplerianSystemScenario,
  velocityRegimesScenario,
  binaryStarsScenario,
  SCENARIO_G,
} from '../src/scenarios/presetScenarios';

describe('Preset Simulation Scenarios', () => {
  it('should register all defined scenarios in the catalog', () => {
    expect(ALL_SCENARIOS.length).toBe(3);
    expect(ALL_SCENARIOS.map((s) => s.id)).toEqual([
      'keplerian-system',
      'velocity-regimes',
      'binary-stars',
    ]);
  });

  it('should retrieve a scenario by its unique identifier', () => {
    const scenario = getScenarioById('velocity-regimes');
    expect(scenario).toBeDefined();
    expect(scenario?.name).toContain('Velocity Regimes');

    const invalid = getScenarioById('non-existent');
    expect(invalid).toBeUndefined();
  });

  it('should configure the Keplerian Solar System scenario properly', () => {
    const universe = new Universe();
    const camera = new Camera();

    keplerianSystemScenario.setup(universe, camera);

    expect(universe.bodyCount).toBe(3);
    const bodies = universe.getBodies();

    const sol = bodies.find((b) => b.name.includes('Sol'));
    const terra = bodies.find((b) => b.name.includes('Terra'));
    const jovian = bodies.find((b) => b.name.includes('Jovian'));

    expect(sol).toBeDefined();
    expect(sol?.fixed).toBe(true);
    expect(sol?.mass).toBe(100.0);

    expect(terra).toBeDefined();
    expect(terra?.position.x).toBe(20.0);
    // Keplerian circular speed: v = sqrt(G * M / r) = sqrt(50 * 100 / 20) = sqrt(250) ≈ 15.811
    expect(terra?.velocity.y).toBeCloseTo(15.811, 2);

    expect(jovian).toBeDefined();
    expect(jovian?.position.x).toBe(-100.0);
    // Keplerian circular speed: v = sqrt(50 * 100 / 100) = sqrt(50) ≈ 7.071
    expect(jovian?.velocity.y).toBeCloseTo(-7.071, 2);
  });

  it('should configure the Velocity Regimes scenario with 4 test probes in correct speed hierarchy', () => {
    const universe = new Universe();
    const camera = new Camera();

    velocityRegimesScenario.setup(universe, camera);

    expect(universe.bodyCount).toBe(5); // 1 Sun + 4 Probes
    const bodies = universe.getBodies();

    const probes = bodies.filter((b) => b.name.includes('Probe'));
    expect(probes.length).toBe(4);

    const plunge = probes.find((p) => p.name.includes('Plunge'));
    const circle = probes.find((p) => p.name.includes('Circle'));
    const ellipse = probes.find((p) => p.name.includes('Ellipse'));
    const escape = probes.find((p) => p.name.includes('Escape'));

    expect(plunge).toBeDefined();
    expect(circle).toBeDefined();
    expect(ellipse).toBeDefined();
    expect(escape).toBeDefined();

    // Verify velocity progression: Plunge < Circle < Ellipse < Escape
    expect(plunge!.velocity.y).toBeLessThan(circle!.velocity.y);
    expect(circle!.velocity.y).toBeLessThan(ellipse!.velocity.y);
    expect(ellipse!.velocity.y).toBeLessThan(escape!.velocity.y);

    // Escape speed should exceed sqrt(2) * circle speed
    const vEscapeThreshold = Math.sqrt(2) * circle!.velocity.y;
    expect(escape!.velocity.y).toBeGreaterThan(vEscapeThreshold);
  });

  it('should configure the Binary Star System with mutually orbiting stars and circumbinary planet', () => {
    const universe = new Universe();
    const camera = new Camera();

    binaryStarsScenario.setup(universe, camera);

    expect(universe.bodyCount).toBe(3); // 2 Stars + 1 Planet
    const bodies = universe.getBodies();

    const alpha = bodies.find((b) => b.name === 'Star Alpha');
    const beta = bodies.find((b) => b.name === 'Star Beta');
    const tatooine = bodies.find((b) => b.name.includes('Tatooine'));

    expect(alpha).toBeDefined();
    expect(beta).toBeDefined();
    expect(tatooine).toBeDefined();

    // Both stars must be free to move (non-fixed)
    expect(alpha?.fixed).toBe(false);
    expect(beta?.fixed).toBe(false);
    expect(alpha?.mass).toBe(50.0);
    expect(beta?.mass).toBe(50.0);

    // Mutual circular orbit speeds should be equal and opposite in sign along Y
    expect(alpha?.velocity.y).toBe(-5.0);
    expect(beta?.velocity.y).toBe(5.0);

    // Circumbinary planet orbits in opposite direction
    expect(tatooine?.velocity.x).toBeLessThan(0);
  });

  it('should cleanly replace previous bodies and reset camera when switching scenarios', () => {
    const universe = new Universe();
    const camera = new Camera();

    // Setup Scenario 1 (3 bodies)
    keplerianSystemScenario.setup(universe, camera);
    expect(universe.bodyCount).toBe(3);

    // Move camera
    camera.pan({ x: 100, y: 100 } as any);
    expect(camera.position.x).toBe(100);

    // Switch to Scenario 2 (5 bodies)
    velocityRegimesScenario.setup(universe, camera);
    expect(universe.bodyCount).toBe(5);

    // Camera position should have been reset to 0, 0
    expect(camera.position.x).toBe(0);
    expect(camera.position.y).toBe(0);
  });
});
