/**
 * particle-emitter.test.ts
 * 
 * Unit tests for the ParticleEmitter stardust and trail system.
 * 
 * Testing Focus:
 * 1. Particle creation around active celestial bodies.
 * 2. Particle aging and pruning when life expires.
 * 3. Kinematic motion drift over time step dt.
 * 4. Maximum particle cap enforcement.
 * 5. Rendering through camera projection with color aging.
 */

import { describe, it, expect, vi } from 'vitest';
import { ParticleEmitter } from '../src/renderer/ParticleEmitter';
import { CelestialBodyFactory } from '../src/factories/CelestialBodyFactory';
import { Camera } from '../src/renderer/Camera';
import { Vector2 } from '../src/physics/Vector2';
import type { CanvasRenderer } from '../src/renderer/CanvasRenderer';

describe('ParticleEmitter Trail & Aura System', () => {
  it('should initialize with an empty particle list and configured defaults', () => {
    const emitter = new ParticleEmitter({ maxParticles: 150, emissionInterval: 0.05 });

    expect(emitter.particles.length).toBe(0);
    expect(emitter.maxParticles).toBe(150);
    expect(emitter.emissionInterval).toBe(0.05);
  });

  it('should spawn particles strictly outside celestial bodies (no overlapping with disk)', () => {
    const emitter = new ParticleEmitter({ emissionInterval: 0.02 });
    const sun = CelestialBodyFactory.createSun(new Vector2(100, 100)); // radius = 2.0

    // Update with dt greater than interval
    emitter.update([sun], 0.03);

    expect(emitter.particles.length).toBeGreaterThan(0);
    const particle = emitter.particles[0];

    // Particle must be spawned strictly OUTSIDE the sun's radius perimeter
    expect(particle.position.distanceTo(sun.position)).toBeGreaterThan(sun.radius);
    expect(particle.life).toBeGreaterThan(0);
    expect(particle.coreColor).toBeDefined();
  });

  it('should guarantee that spawned particles never overlap with moving planet disks', () => {
    const emitter = new ParticleEmitter({ emissionInterval: 0.005, maxParticles: 50 });
    const movingPlanet = CelestialBodyFactory.createPlanet(
      new Vector2(50, 50),
      true, // Gas Giant (radius = 2.0)
      new Vector2(15, -10)
    );

    emitter.update([movingPlanet], 0.01);

    for (const particle of emitter.particles) {
      // Distance from planet center must exceed the planet's radius
      expect(particle.position.distanceTo(movingPlanet.position)).toBeGreaterThan(movingPlanet.radius);
    }
  });

  it('should advance particle positions and reduce life over time', () => {
    const emitter = new ParticleEmitter({ emissionInterval: 0.01 });
    const planet = CelestialBodyFactory.createPlanet(new Vector2(0, 0), false, new Vector2(20, 0));

    emitter.update([planet], 0.02);
    expect(emitter.particles.length).toBeGreaterThan(0);

    const initialPos = emitter.particles[0].position.clone();
    const initialLife = emitter.particles[0].life;

    // Advance by 0.1s
    emitter.update([], 0.1);

    expect(emitter.particles[0].life).toBeLessThan(initialLife);
    expect(emitter.particles[0].position.distanceTo(initialPos)).toBeGreaterThan(0);
  });

  it('should remove particles whose lifetimes have expired (life <= 0)', () => {
    const emitter = new ParticleEmitter({ emissionInterval: 0.01 });
    const sun = CelestialBodyFactory.createSun(new Vector2(0, 0));

    emitter.update([sun], 0.02);
    expect(emitter.particles.length).toBeGreaterThan(0);

    // Fast-forward by 5 seconds (exceeding all maxLifetimes of ~1.0s)
    emitter.update([], 5.0);

    // All particles should have expired
    expect(emitter.particles.length).toBe(0);
  });

  it('should strictly enforce maxParticles cap', () => {
    const emitter = new ParticleEmitter({ maxParticles: 5, emissionInterval: 0.001 });
    const sun = CelestialBodyFactory.createSun(new Vector2(0, 0));

    // Repeated updates
    for (let i = 0; i < 20; i++) {
      emitter.update([sun], 0.01);
    }

    expect(emitter.particles.length).toBeLessThanOrEqual(5);
  });

  it('should render particles through the camera onto the canvas', () => {
    const emitter = new ParticleEmitter({ emissionInterval: 0.01 });
    const sun = CelestialBodyFactory.createSun(new Vector2(0, 0));

    emitter.update([sun], 0.02);

    const camera = new Camera({ viewportWidth: 320, viewportHeight: 180 });
    const mockRenderer = {
      drawPixel: vi.fn(),
    } as unknown as CanvasRenderer;

    emitter.render(mockRenderer, camera);

    expect(mockRenderer.drawPixel).toHaveBeenCalled();
  });

  it('should clear all particles when clear() is invoked', () => {
    const emitter = new ParticleEmitter({ emissionInterval: 0.01 });
    const sun = CelestialBodyFactory.createSun(new Vector2(0, 0));

    emitter.update([sun], 0.02);
    expect(emitter.particles.length).toBeGreaterThan(0);

    emitter.clear();
    expect(emitter.particles.length).toBe(0);
  });
});
