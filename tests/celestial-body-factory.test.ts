/**
 * celestial-body-factory.test.ts
 * 
 * Unit tests for the CelestialBodyFactory class.
 * 
 * Testing Focus:
 * 1. Factory methods correctly instantiate valid CelestialBody objects.
 * 2. Proper astrophysical defaults (mass, categories, colors, halos).
 * 3. Differentiation between subtype variants (e.g., Terrestrial vs. Gas Giant,
 *    Stellar vs. Supermassive Black Hole).
 * 4. Custom velocity and position propagation.
 */

import { describe, it, expect } from 'vitest';
import { CelestialBodyFactory } from '../src/factories/CelestialBodyFactory';
import { BodyCategory, BodyType } from '../src/entities/types';
import { Vector2 } from '../src/physics/Vector2';

describe('CelestialBodyFactory', () => {
  it('should create a Sun (Yellow Dwarf) with correct astrophysical attributes', () => {
    const sun = CelestialBodyFactory.createSun(new Vector2(100, 200));

    expect(sun.name).toBe('Yellow Dwarf');
    expect(sun.category).toBe(BodyCategory.STAR);
    expect(sun.type).toBe(BodyType.YELLOW_DWARF);
    expect(sun.mass).toBe(1.0);
    expect(sun.radius).toBe(2.0);
    expect(sun.position.x).toBe(100);
    expect(sun.position.y).toBe(200);
    expect(sun.velocity.x).toBe(0);
    expect(sun.velocity.y).toBe(0);
    expect(sun.color).toBe('#fde047');
    expect(sun.haloColor).toBe('#ea580c');
    expect(sun.fixed).toBe(false);
  });

  it('should create a Red Dwarf star with lower mass and crimson styling', () => {
    const redDwarf = CelestialBodyFactory.createRedDwarf(
      new Vector2(-50, 25),
      new Vector2(1, 2),
      'Proxima'
    );

    expect(redDwarf.name).toBe('Proxima');
    expect(redDwarf.category).toBe(BodyCategory.STAR);
    expect(redDwarf.type).toBe(BodyType.RED_DWARF);
    expect(redDwarf.mass).toBe(0.2);
    expect(redDwarf.radius).toBe(1.0);
    expect(redDwarf.color).toBe('#f87171');
    expect(redDwarf.velocity.x).toBe(1);
    expect(redDwarf.velocity.y).toBe(2);
  });

  it('should create a massive Blue Giant with cyan core and deep blue corona', () => {
    const blueGiant = CelestialBodyFactory.createBlueGiant(new Vector2(0, 0));

    expect(blueGiant.category).toBe(BodyCategory.STAR);
    expect(blueGiant.type).toBe(BodyType.BLUE_GIANT);
    expect(blueGiant.mass).toBe(16.0);
    expect(blueGiant.radius).toBe(3.0);
    expect(blueGiant.color).toBe('#67e8f9');
    expect(blueGiant.haloColor).toBe('#1d4ed8');
  });

  it('should create an expansive Red Supergiant with bloated radius and crimson halo', () => {
    const supergiant = CelestialBodyFactory.createRedSupergiant(new Vector2(15, -30));

    expect(supergiant.name).toBe('Red Supergiant');
    expect(supergiant.category).toBe(BodyCategory.STAR);
    expect(supergiant.type).toBe(BodyType.RED_SUPERGIANT);
    expect(supergiant.mass).toBe(18.0);
    expect(supergiant.radius).toBe(4.0);
    expect(supergiant.color).toBe('#ef4444');
    expect(supergiant.haloColor).toBe('#991b1b');
  });

  it('should create a compact White Dwarf', () => {
    const whiteDwarf = CelestialBodyFactory.createWhiteDwarf(new Vector2(5, 5));

    expect(whiteDwarf.category).toBe(BodyCategory.STAR);
    expect(whiteDwarf.type).toBe(BodyType.WHITE_DWARF);
    expect(whiteDwarf.mass).toBe(0.8);
    expect(whiteDwarf.color).toBe('#ffffff');
  });

  it('should create an ultra-dense Neutron Star with pulsar radiation halo', () => {
    const pulsar = CelestialBodyFactory.createNeutronStar(new Vector2(0, 0), new Vector2(5, 5), 'Crab Pulsar');

    expect(pulsar.name).toBe('Crab Pulsar');
    expect(pulsar.category).toBe(BodyCategory.STAR);
    expect(pulsar.type).toBe(BodyType.NEUTRON_STAR);
    expect(pulsar.mass).toBe(1.5);
    expect(pulsar.radius).toBe(1.0);
    expect(pulsar.color).toBe('#e0e7ff');
    expect(pulsar.haloColor).toBe('#818cf8');
    expect(pulsar.velocity.x).toBe(5);
    expect(pulsar.velocity.y).toBe(5);
  });

  it('should differentiate between Stellar-mass and Supermassive Black Holes', () => {
    const stellarBH = CelestialBodyFactory.createBlackHole(new Vector2(10, 10), false);
    const supermassiveBH = CelestialBodyFactory.createBlackHole(new Vector2(0, 0), true);

    // Stellar Black Hole
    expect(stellarBH.category).toBe(BodyCategory.BLACK_HOLE);
    expect(stellarBH.type).toBe(BodyType.STELLAR_BLACK_HOLE);
    expect(stellarBH.mass).toBe(25.0);
    expect(stellarBH.fixed).toBe(false);
    expect(stellarBH.haloColor).toBe('#06b6d4');

    // Supermassive Black Hole
    expect(supermassiveBH.category).toBe(BodyCategory.BLACK_HOLE);
    expect(supermassiveBH.type).toBe(BodyType.SUPERMASSIVE_BLACK_HOLE);
    expect(supermassiveBH.mass).toBe(1000.0);
    expect(supermassiveBH.fixed).toBe(true); // Pinned galactic center
    expect(supermassiveBH.haloColor).toBe('#a855f7');
  });

  it('should differentiate between Terrestrial planets and Gas Giants', () => {
    const terrestrial = CelestialBodyFactory.createPlanet(new Vector2(10, 0), false);
    const gasGiant = CelestialBodyFactory.createPlanet(new Vector2(50, 0), true);

    // Terrestrial
    expect(terrestrial.category).toBe(BodyCategory.PLANET);
    expect(terrestrial.type).toBe(BodyType.TERRESTRIAL_PLANET);
    expect(terrestrial.mass).toBe(0.001);
    expect(terrestrial.color).toBe('#94a3b8');

    // Gas Giant
    expect(gasGiant.category).toBe(BodyCategory.PLANET);
    expect(gasGiant.type).toBe(BodyType.GAS_GIANT);
    expect(gasGiant.mass).toBe(0.01);
    expect(gasGiant.color).toBe('#fcd34d');
  });

  it('should create kinetic Asteroids and icy Comets', () => {
    const asteroid = CelestialBodyFactory.createAsteroid(
      new Vector2(30, 40),
      new Vector2(-5, 2)
    );
    const comet = CelestialBodyFactory.createComet(
      new Vector2(-100, 50),
      new Vector2(12, -8)
    );

    // Asteroid
    expect(asteroid.category).toBe(BodyCategory.SMALL_BODY);
    expect(asteroid.type).toBe(BodyType.ASTEROID);
    expect(asteroid.mass).toBe(0.00001);
    expect(asteroid.color).toBe('#64748b');

    // Comet
    expect(comet.category).toBe(BodyCategory.SMALL_BODY);
    expect(comet.type).toBe(BodyType.COMET);
    expect(comet.mass).toBe(0.00001);
    expect(comet.color).toBe('#e0f2fe');
    expect(comet.haloColor).toBe('#38bdf8');
  });
});

