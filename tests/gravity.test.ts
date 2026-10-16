/**
 * gravity.test.ts
 * 
 * Unit tests for Newtonian Universal Gravitation: F = G * (m1 * m2) / r^2.
 * 
 * Testing Focus:
 * 1. Inverse-square relationship with distance: F proportional to 1 / r^2.
 * 2. Linear proportionality with mass: F proportional to m1 * m2.
 * 3. Directional correctness: Force pulls along line of centers towards attractor.
 * 4. Newton's Third Law: Equal and opposite reaction forces (F_A = -F_B).
 * 5. Coincident bodies safety: No division by zero / NaN when distance is zero.
 * 6. System equilibrium: Net gravitational cancellation at symmetric equilibrium points.
 * 7. System momentum conservation: Sum of all internal gravitational forces is zero.
 */

import { describe, it, expect } from 'vitest';
import { Vector2 } from '../src/physics/Vector2';
import { CelestialBody } from '../src/entities/CelestialBody';
import { BodyCategory, BodyType } from '../src/entities/types';
import {
  calculateGravitationalForce,
  computeSystemGravitationalForces,
  applySystemGravity,
} from '../src/physics/NewtonianGravity';

describe('Newtonian Gravitational Physics (F = G * m1 * m2 / r^2)', () => {
  // Helper to create simple test bodies with specified mass and position
  function createTestBody(id: string, mass: number, position: Vector2): CelestialBody {
    return new CelestialBody({
      id,
      name: `Body ${id}`,
      category: BodyCategory.STAR,
      type: BodyType.YELLOW_DWARF,
      mass,
      radius: 1.0,
      position,
      color: '#ffffff',
    });
  }

  it('should calculate the exact force magnitude for F = G * m1 * m2 / r^2', () => {
    // Body A at (0, 0) with mass 2.0
    // Body B at (10, 0) with mass 5.0
    // Distance r = 10, r^2 = 100
    // F = 1.0 * (2.0 * 5.0) / 100 = 10 / 100 = 0.1
    const bodyA = createTestBody('A', 2.0, new Vector2(0, 0));
    const bodyB = createTestBody('B', 5.0, new Vector2(10, 0));

    const forceOnA = calculateGravitationalForce(bodyA, bodyB, 1.0);

    // Force should pull Body A towards the right (+X)
    expect(forceOnA.x).toBeCloseTo(0.1, 6);
    expect(forceOnA.y).toBeCloseTo(0, 6);
  });

  it('should obey the inverse-square law when distance doubles', () => {
    const bodyA = createTestBody('A', 1.0, new Vector2(0, 0));
    const bodyB_near = createTestBody('B1', 1.0, new Vector2(10, 0));  // r = 10 => F1
    const bodyB_far  = createTestBody('B2', 1.0, new Vector2(20, 0));  // r = 20 => F2

    const forceNear = calculateGravitationalForce(bodyA, bodyB_near, 1.0);
    const forceFar = calculateGravitationalForce(bodyA, bodyB_far, 1.0);

    // When distance doubles, force must decrease by a factor of 4: F_far = F_near / 4
    expect(forceNear.x).toBeCloseTo(0.01, 6);
    expect(forceFar.x).toBeCloseTo(0.0025, 6);
    expect(forceFar.x).toBeCloseTo(forceNear.x / 4, 6);
  });

  it('should obey linear mass proportionality', () => {
    const bodyA = createTestBody('A', 1.0, new Vector2(0, 0));
    const bodyB_standard = createTestBody('B1', 2.0, new Vector2(5, 0));
    const bodyB_tripleMass = createTestBody('B2', 6.0, new Vector2(5, 0));

    const force1 = calculateGravitationalForce(bodyA, bodyB_standard, 1.0);
    const force2 = calculateGravitationalForce(bodyA, bodyB_tripleMass, 1.0);

    // Tripling the mass must triple the force
    expect(force2.x).toBeCloseTo(force1.x * 3, 6);
  });

  it('should pull diagonally along the 2D line of centers (Pythagorean 3-4-5 triangle)', () => {
    // Body A at (0, 0), Body B at (3, 4)
    // Distance r = sqrt(3^2 + 4^2) = 5
    // Unit vector towards B = (3/5, 4/5) = (0.6, 0.8)
    // Choose masses: m1 = 1, m2 = 25 => F magnitude = 1 * 25 / (5^2) = 1.0
    // Vector force = 1.0 * (0.6, 0.8) = (0.6, 0.8)
    const bodyA = createTestBody('A', 1.0, new Vector2(0, 0));
    const bodyB = createTestBody('B', 25.0, new Vector2(3, 4));

    const forceOnA = calculateGravitationalForce(bodyA, bodyB, 1.0);

    expect(forceOnA.x).toBeCloseTo(0.6, 6);
    expect(forceOnA.y).toBeCloseTo(0.8, 6);
  });

  it("should uphold Newton's Third Law: F_BA = -F_AB", () => {
    const bodyA = createTestBody('A', 4.0, new Vector2(-15, 20));
    const bodyB = createTestBody('B', 7.0, new Vector2(40, -10));

    const forceOnA = calculateGravitationalForce(bodyA, bodyB, 1.0);
    const forceOnB = calculateGravitationalForce(bodyB, bodyA, 1.0);

    // Action and reaction forces must be exactly opposite
    expect(forceOnA.x).toBeCloseTo(-forceOnB.x, 6);
    expect(forceOnA.y).toBeCloseTo(-forceOnB.y, 6);
  });

  it('should safely return zero force if two bodies are at the exact same location (r = 0)', () => {
    const bodyA = createTestBody('A', 1.0, new Vector2(50, 50));
    const bodyB = createTestBody('B', 1.0, new Vector2(50, 50));

    const force = calculateGravitationalForce(bodyA, bodyB, 1.0);

    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
    expect(Number.isNaN(force.x)).toBe(false);
    expect(Number.isFinite(force.x)).toBe(true);
  });

  it('should cancel out forces at a symmetric gravitational equilibrium point', () => {
    // Star 1 at (-50, 0) with mass 10
    // Star 2 at (+50, 0) with mass 10
    // Probe at the exact center (0, 0) with mass 1
    // The pull from Star 1 to the left (-X) should cancel the pull from Star 2 to the right (+X)
    const starLeft = createTestBody('left', 10.0, new Vector2(-50, 0));
    const starRight = createTestBody('right', 10.0, new Vector2(50, 0));
    const probe = createTestBody('probe', 1.0, new Vector2(0, 0));

    const forces = computeSystemGravitationalForces([starLeft, probe, starRight], 1.0);
    const probeForce = forces.get('probe')!;

    expect(probeForce.x).toBeCloseTo(0, 6);
    expect(probeForce.y).toBeCloseTo(0, 6);
  });

  it('should conserve net system momentum (sum of all gravitational forces is zero)', () => {
    // In any isolated system of bodies, internal gravitational forces must sum to zero vector
    const bodies = [
      createTestBody('1', 5.0, new Vector2(10, 20)),
      createTestBody('2', 8.0, new Vector2(-30, 45)),
      createTestBody('3', 2.0, new Vector2(60, -15)),
      createTestBody('4', 0.5, new Vector2(-10, -50)),
    ];

    const forces = computeSystemGravitationalForces(bodies, 1.0);

    let netX = 0;
    let netY = 0;
    for (const force of forces.values()) {
      netX += force.x;
      netY += force.y;
    }

    expect(netX).toBeCloseTo(0, 6);
    expect(netY).toBeCloseTo(0, 6);
  });

  it('should update body velocities when applying system gravity over time step dt', () => {
    // Two bodies released from rest:
    // Body A at (0, 0), mass 10
    // Body B at (10, 0), mass 10
    // r = 10, r^2 = 100. F = 1.0 * (10 * 10) / 100 = 1.0
    // Acceleration: a = F / m = 1.0 / 10 = 0.1
    // Over dt = 2.0 seconds: dv = a * dt = 0.1 * 2.0 = 0.2
    const bodyA = createTestBody('A', 10.0, new Vector2(0, 0));
    const bodyB = createTestBody('B', 10.0, new Vector2(10, 0));

    applySystemGravity([bodyA, bodyB], 2.0, 1.0);

    // Body A accelerates to the right: velocity x = +0.2
    expect(bodyA.velocity.x).toBeCloseTo(0.2, 6);
    expect(bodyA.velocity.y).toBeCloseTo(0, 6);

    // Body B accelerates to the left: velocity x = -0.2
    expect(bodyB.velocity.x).toBeCloseTo(-0.2, 6);
    expect(bodyB.velocity.y).toBeCloseTo(0, 6);
  });
});

