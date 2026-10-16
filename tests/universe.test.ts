/**
 * universe.test.ts
 * 
 * Unit tests for the Universe scene container and manager.
 * 
 * Testing Focus:
 * 1. Adding, querying, replacing, and removing celestial bodies.
 * 2. Kinematic stepping across all bodies in the scene.
 * 3. Physical Center of Mass (Barycenter) calculation.
 * 4. Total mass aggregation.
 * 5. Spatial nearest-neighbor queries for selection tools.
 * 6. Bounding box calculation for viewport framing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Universe } from '../src/simulation/Universe';
import { CelestialBodyFactory } from '../src/factories/CelestialBodyFactory';
import { Vector2 } from '../src/physics/Vector2';

describe('Universe Scene Container', () => {
  let universe: Universe;

  beforeEach(() => {
    universe = new Universe();
  });

  it('should initialize with an empty container', () => {
    expect(universe.bodyCount).toBe(0);
    expect(universe.getBodies().length).toBe(0);
    expect(universe.getTotalMass()).toBe(0);
    expect(universe.getBoundingBox()).toBeNull();
  });

  it('should add bodies and retrieve them by ID', () => {
    const sun = CelestialBodyFactory.createSun(new Vector2(0, 0), new Vector2(0, 0), 'Sun');
    const earth = CelestialBodyFactory.createPlanet(new Vector2(100, 0), false, new Vector2(0, 5), 'Earth');

    universe.addBody(sun);
    universe.addBody(earth);

    expect(universe.bodyCount).toBe(2);
    expect(universe.getBodyById(sun.id)).toBe(sun);
    expect(universe.getBodyById(earth.id)).toBe(earth);
  });

  it('should support batch body addition (addBodies)', () => {
    const bodies = [
      CelestialBodyFactory.createSun(new Vector2(0, 0)),
      CelestialBodyFactory.createRedDwarf(new Vector2(50, 50)),
      CelestialBodyFactory.createBlueGiant(new Vector2(-50, -50)),
    ];

    universe.addBodies(bodies);
    expect(universe.bodyCount).toBe(3);
  });

  it('should remove bodies by ID and handle non-existent IDs cleanly', () => {
    const sun = CelestialBodyFactory.createSun(new Vector2(0, 0));
    universe.addBody(sun);

    expect(universe.removeBody(sun.id)).toBe(true);
    expect(universe.bodyCount).toBe(0);
    expect(universe.removeBody('non_existent_id')).toBe(false);
  });

  it('should clear all bodies', () => {
    universe.addBody(CelestialBodyFactory.createSun(new Vector2(0, 0)));
    universe.addBody(CelestialBodyFactory.createPlanet(new Vector2(20, 0)));
    expect(universe.bodyCount).toBe(2);

    universe.clear();
    expect(universe.bodyCount).toBe(0);
    expect(universe.getBodies().length).toBe(0);
  });

  it('should advance all bodies during step(dt)', () => {
    const movingStar = CelestialBodyFactory.createSun(new Vector2(0, 0), new Vector2(10, -5));
    const fixedAnchor = CelestialBodyFactory.createBlackHole(new Vector2(100, 100), true); // Fixed = true

    universe.addBody(movingStar);
    universe.addBody(fixedAnchor);

    // Advance by 2.0 seconds: movingStar moves to (20, -10), fixed anchor remains at (100, 100)
    universe.step(2.0);

    expect(movingStar.position.x).toBe(20);
    expect(movingStar.position.y).toBe(-10);
    expect(fixedAnchor.position.x).toBe(100);
    expect(fixedAnchor.position.y).toBe(100);
  });

  it('should calculate Center of Mass (Barycenter) accurately', () => {
    // 1. Empty universe barycenter is (0, 0)
    expect(universe.getCenterOfMass().x).toBe(0);
    expect(universe.getCenterOfMass().y).toBe(0);

    // 2. Two equal mass bodies: mass 1 at (0, 0) and mass 1 at (10, 0) => Center of mass at (5, 0)
    const starA = CelestialBodyFactory.createSun(new Vector2(0, 0)); // mass = 1.0
    const starB = CelestialBodyFactory.createSun(new Vector2(10, 0)); // mass = 1.0
    universe.addBody(starA);
    universe.addBody(starB);

    const com1 = universe.getCenterOfMass();
    expect(com1.x).toBe(5);
    expect(com1.y).toBe(0);

    // 3. Unequal mass test:
    universe.clear();
    const giant = CelestialBodyFactory.createBlueGiant(new Vector2(0, 0)); // mass = 16.0
    const sun = CelestialBodyFactory.createSun(new Vector2(34, 0)); // mass = 1.0
    // Total mass = 17.0
    // Weighted X = (16 * 0) + (1 * 34) = 34 => COM X = 34 / 17 = 2.0
    universe.addBody(giant);
    universe.addBody(sun);

    const com2 = universe.getCenterOfMass();
    expect(com2.x).toBe(2.0);
    expect(com2.y).toBe(0);
  });

  it('should find the nearest body to a query point', () => {
    const starNear = CelestialBodyFactory.createSun(new Vector2(10, 10));
    const starFar = CelestialBodyFactory.createSun(new Vector2(200, 200));

    universe.addBody(starNear);
    universe.addBody(starFar);

    // Query point at (12, 11) is closest to starNear
    const found = universe.findNearest(new Vector2(12, 11));
    expect(found).toBe(starNear);

    // Search with maximum distance threshold that excludes starNear
    const notFound = universe.findNearest(new Vector2(100, 100), 10);
    expect(notFound).toBeNull();
  });

  it('should compute the axis-aligned bounding box enclosing all bodies', () => {
    universe.addBody(CelestialBodyFactory.createSun(new Vector2(-50, 20)));
    universe.addBody(CelestialBodyFactory.createSun(new Vector2(120, -80)));
    universe.addBody(CelestialBodyFactory.createSun(new Vector2(10, 150)));

    const bbox = universe.getBoundingBox();
    expect(bbox).not.toBeNull();
    expect(bbox!.min.x).toBe(-50);
    expect(bbox!.min.y).toBe(-80);
    expect(bbox!.max.x).toBe(120);
    expect(bbox!.max.y).toBe(150);
  });

  it('should apply gravitational acceleration during step(dt) when gravity is enabled', () => {
    // Enable gravity with G = 1.0
    universe.enableGravity(1.0);
    expect(universe.gravityEnabled).toBe(true);

    // Two bodies released from rest at (0, 0) and (10, 0), each of mass 10
    // r = 10, r^2 = 100. F = 1.0 * (10 * 10) / 100 = 1.0
    // a = 1.0 / 10 = 0.1
    // In step(1.0): dv = a * dt = 0.1 * 1.0 = 0.1
    // Body 1 velocity becomes (0.1, 0), and moves to position (0.1, 0)
    const bodyA = CelestialBodyFactory.createSun(new Vector2(0, 0), new Vector2(0, 0));
    bodyA.mass = 10.0;
    const bodyB = CelestialBodyFactory.createSun(new Vector2(10, 0), new Vector2(0, 0));
    bodyB.mass = 10.0;

    universe.addBody(bodyA);
    universe.addBody(bodyB);

    universe.step(1.0);

    expect(bodyA.velocity.x).toBeCloseTo(0.1, 6);
    expect(bodyB.velocity.x).toBeCloseTo(-0.1, 6);
    expect(bodyA.position.x).toBeCloseTo(0.1, 6);
    expect(bodyB.position.x).toBeCloseTo(9.9, 6);

    // Test disabling gravity
    universe.disableGravity();
    expect(universe.gravityEnabled).toBe(false);
  });

  it('should scale simulation speed when timeScale is customized', () => {
    const star = CelestialBodyFactory.createSun(new Vector2(0, 0), new Vector2(10, 0));
    universe.addBody(star);

    // Default timeScale is 1.0: 1.0s step moves star by 10 units (0 -> 10)
    universe.step(1.0);
    expect(star.position.x).toBe(10);

    // Double time speed (2x): 1.0s step moves star by 10 * 2 = 20 units (10 -> 30)
    universe.setTimeScale(2.0);
    expect(universe.timeScale).toBe(2.0);
    universe.step(1.0);
    expect(star.position.x).toBe(30);

    // Half time speed (0.5x): 1.0s step moves star by 10 * 0.5 = 5 units (30 -> 35)
    universe.setTimeScale(0.5);
    universe.step(1.0);
    expect(star.position.x).toBe(35);

    // Freeze time (0x): 1.0s step results in no movement
    universe.setTimeScale(0);
    universe.step(1.0);
    expect(star.position.x).toBe(35);

    // Safety: negative time scales clamped to 0
    universe.setTimeScale(-5);
    expect(universe.timeScale).toBe(0);
  });
});

