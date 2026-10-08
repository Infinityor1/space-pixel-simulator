/**
 * celestial-body.test.ts
 * 
 * Unit tests for the CelestialBody domain entity.
 * 
 * Testing Focus:
 * 1. Proper initialization from options and defaults.
 * 2. Kinematic position updates (velocity * dt).
 * 3. Newtonian dynamics (force, mass, acceleration: F = m*a).
 * 4. Spatial distance calculations between two bodies.
 * 5. Fixed body immobility (anchors ignore forces and motion).
 * 6. Cloning behavior and snapshot independence.
 */

import { describe, it, expect } from 'vitest';
import { CelestialBody } from '../src/entities/CelestialBody';
import { BodyCategory, BodyType } from '../src/entities/types';
import { Vector2 } from '../src/physics/Vector2';

describe('CelestialBody Entity', () => {
  it('should initialize with provided options and appropriate defaults', () => {
    const star = new CelestialBody({
      name: 'Alpha Centauri',
      category: BodyCategory.STAR,
      type: BodyType.YELLOW_DWARF,
      mass: 1.1,
      radius: 1.2,
      position: new Vector2(10, 20),
      color: '#fde047',
    });

    expect(star.name).toBe('Alpha Centauri');
    expect(star.category).toBe(BodyCategory.STAR);
    expect(star.type).toBe(BodyType.YELLOW_DWARF);
    expect(star.mass).toBe(1.1);
    expect(star.radius).toBe(1.2);
    expect(star.position.x).toBe(10);
    expect(star.position.y).toBe(20);
    // Default velocity should be (0, 0)
    expect(star.velocity.x).toBe(0);
    expect(star.velocity.y).toBe(0);
    // Default fixed flag should be false
    expect(star.fixed).toBe(false);
    // An ID should have been generated
    expect(star.id).toBeDefined();
    expect(typeof star.id).toBe('string');
  });

  it('should update position based on velocity and delta time (dt)', () => {
    const planet = new CelestialBody({
      name: 'Earth',
      category: BodyCategory.PLANET,
      type: BodyType.TERRESTRIAL_PLANET,
      mass: 0.001,
      radius: 0.5,
      position: new Vector2(0, 0),
      velocity: new Vector2(10, -5), // Moving right at 10 units/s, up at 5 units/s
      color: '#94a3b8',
    });

    // Advance by 0.5 seconds: x should be 0 + 10 * 0.5 = 5, y should be 0 + (-5) * 0.5 = -2.5
    planet.updatePosition(0.5);
    expect(planet.position.x).toBe(5);
    expect(planet.position.y).toBe(-2.5);

    // Advance by another 1.0 second: x should be 5 + 10 = 15, y should be -2.5 + (-5) = -7.5
    planet.updatePosition(1.0);
    expect(planet.position.x).toBe(15);
    expect(planet.position.y).toBe(-7.5);
  });

  it('should not update position if fixed is true', () => {
    const coreBlackHole = new CelestialBody({
      name: 'Sagittarius A*',
      category: BodyCategory.BLACK_HOLE,
      type: BodyType.SUPERMASSIVE_BLACK_HOLE,
      mass: 1000,
      radius: 5,
      position: new Vector2(0, 0),
      velocity: new Vector2(100, 100),
      color: '#000000',
      fixed: true, // Fixed anchor
    });

    coreBlackHole.updatePosition(10);
    expect(coreBlackHole.position.x).toBe(0);
    expect(coreBlackHole.position.y).toBe(0);
  });

  it('should apply Newtonian force correctly (F = m * a => a = F / m => dv = a * dt)', () => {
    const asteroid = new CelestialBody({
      name: 'Ceres',
      category: BodyCategory.SMALL_BODY,
      type: BodyType.ASTEROID,
      mass: 2.0, // Mass = 2.0
      radius: 0.2,
      position: new Vector2(0, 0),
      velocity: new Vector2(0, 0),
      color: '#64748b',
    });

    // Force vector: (20, 0) for 1 second.
    // Acceleration: a = 20 / 2.0 = 10 units/s^2.
    // dv = 10 * 1 = 10 units/s.
    const force = new Vector2(20, 0);
    asteroid.applyForce(force, 1.0);

    expect(asteroid.velocity.x).toBe(10);
    expect(asteroid.velocity.y).toBe(0);
  });

  it('should ignore forces if fixed is true', () => {
    const anchor = new CelestialBody({
      name: 'Anchor Star',
      category: BodyCategory.STAR,
      type: BodyType.YELLOW_DWARF,
      mass: 10,
      radius: 1,
      position: new Vector2(0, 0),
      velocity: new Vector2(0, 0),
      color: '#ffffff',
      fixed: true,
    });

    anchor.applyForce(new Vector2(100, 100), 5);
    expect(anchor.velocity.x).toBe(0);
    expect(anchor.velocity.y).toBe(0);
  });

  it('should apply velocity impulse directly', () => {
    const probe = new CelestialBody({
      name: 'Voyager',
      category: BodyCategory.SMALL_BODY,
      type: BodyType.ASTEROID,
      mass: 0.0001,
      radius: 0.1,
      position: new Vector2(0, 0),
      velocity: new Vector2(5, 5),
      color: '#ffffff',
    });

    // Burn thrusters: impulse (+3, -2)
    probe.applyImpulse(new Vector2(3, -2));
    expect(probe.velocity.x).toBe(8);
    expect(probe.velocity.y).toBe(3);
  });

  it('should calculate distance accurately between two celestial bodies', () => {
    const bodyA = new CelestialBody({
      name: 'A',
      category: BodyCategory.STAR,
      type: BodyType.YELLOW_DWARF,
      mass: 1,
      radius: 1,
      position: new Vector2(0, 0),
      color: '#ffffff',
    });

    const bodyB = new CelestialBody({
      name: 'B',
      category: BodyCategory.PLANET,
      type: BodyType.TERRESTRIAL_PLANET,
      mass: 0.1,
      radius: 0.5,
      position: new Vector2(3, 4), // 3-4-5 right triangle
      color: '#ffffff',
    });

    expect(bodyA.distanceTo(bodyB)).toBe(5);
    expect(bodyB.distanceTo(bodyA)).toBe(5);
  });

  it('should create an independent clone of the body', () => {
    const original = new CelestialBody({
      name: 'Original Sun',
      category: BodyCategory.STAR,
      type: BodyType.YELLOW_DWARF,
      mass: 1.0,
      radius: 2.0,
      position: new Vector2(50, 50),
      velocity: new Vector2(1, -1),
      color: '#fde047',
      haloColor: '#ea580c',
    });

    const clone = original.clone();

    expect(clone.name).toBe('Original Sun (Clone)');
    expect(clone.mass).toBe(original.mass);
    expect(clone.color).toBe(original.color);
    expect(clone.haloColor).toBe(original.haloColor);
    expect(clone.position.x).toBe(original.position.x);

    // Mutating the original must not affect the clone
    original.updatePosition(10);
    expect(original.position.x).toBe(60);
    expect(clone.position.x).toBe(50);
  });
});

