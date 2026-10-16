/**
 * CelestialBodyFactory.ts
 * 
 * Factory class responsible for manufacturing specialized CelestialBody instances.
 * 
 * DESIGN PATTERN: "Factory Pattern" (Gang of Four)
 * ------------------------------------------------
 * In astrophysics and game programming, celestial bodies have dozens of specific,
 * interconnected physical parameters (mass, radius, surface colors, accretion halos).
 * 
 * Without a Factory:
 * A developer would have to remember and manually type in all properties every time:
 * `new CelestialBody({ name: 'Sun', mass: 1.0, color: '#fde047', haloColor: '#ea580c', radius: 2.0, ... })`
 * If we change how a "Sun" looks or behaves, we would have to search and replace everywhere.
 * 
 * With a Factory:
 * We encapsulate creation behind clear, semantic methods:
 * `CelestialBodyFactory.createSun(new Vector2(0, 0))`
 * The caller only specifies what varies (position, optional velocity, optional name),
 * while the factory guarantees physically accurate, visually consistent defaults.
 */

import { Vector2 } from '../physics/Vector2';
import { CelestialBody } from '../entities/CelestialBody';
import { BodyCategory, BodyType } from '../entities/types';

export class CelestialBodyFactory {
  /**
   * Creates a G-type Yellow Dwarf star (analogous to our Sun).
   * 
   * @param position 2D coordinates in world space
   * @param velocity Optional initial velocity vector (defaults to 0, 0)
   * @param name Optional custom label (defaults to "Yellow Dwarf")
   */
  public static createSun(
    position: Vector2,
    velocity: Vector2 = new Vector2(0, 0),
    name: string = 'Yellow Dwarf'
  ): CelestialBody {
    return new CelestialBody({
      name,
      category: BodyCategory.STAR,
      type: BodyType.YELLOW_DWARF,
      mass: 1.0,             // 1.0 Solar Mass benchmark
      radius: 2.0,           // Standard visual/physical radius
      position,
      velocity,
      color: '#fde047',      // Radiant golden yellow core
      haloColor: '#ea580c',  // Warm orange corona cross
      fixed: false,
    });
  }

  /**
   * Creates an M-type Red Dwarf star (cool, small, long-lived).
   * 
   * @param position 2D coordinates in world space
   * @param velocity Optional initial velocity vector
   * @param name Optional custom label (defaults to "Red Dwarf")
   */
  public static createRedDwarf(
    position: Vector2,
    velocity: Vector2 = new Vector2(0, 0),
    name: string = 'Red Dwarf'
  ): CelestialBody {
    return new CelestialBody({
      name,
      category: BodyCategory.STAR,
      type: BodyType.RED_DWARF,
      mass: 0.2,             // Low mass (0.2 Solar Masses)
      radius: 1.0,           // Compact star
      position,
      velocity,
      color: '#f87171',      // Crimson red
      // No bright halo needed - dimmer star
      fixed: false,
    });
  }

  /**
   * Creates an O/B-type Blue Giant star (massive, energetic, luminous).
   * 
   * @param position 2D coordinates in world space
   * @param velocity Optional initial velocity vector
   * @param name Optional custom label (defaults to "Blue Giant")
   */
  public static createBlueGiant(
    position: Vector2,
    velocity: Vector2 = new Vector2(0, 0),
    name: string = 'Blue Giant'
  ): CelestialBody {
    return new CelestialBody({
      name,
      category: BodyCategory.STAR,
      type: BodyType.BLUE_GIANT,
      mass: 16.0,            // Heavy gravitational driver
      radius: 3.0,           // Expansive size
      position,
      velocity,
      color: '#67e8f9',      // Radiant cyan core
      haloColor: '#1d4ed8',  // Deep blue intense corona
      fixed: false,
    });
  }

  /**
   * Creates an aging Red Supergiant star (bloated radius, massive, pre-supernova).
   * 
   * @param position 2D coordinates in world space
   * @param velocity Optional initial velocity vector
   * @param name Optional custom label (defaults to "Red Supergiant")
   */
  public static createRedSupergiant(
    position: Vector2,
    velocity: Vector2 = new Vector2(0, 0),
    name: string = 'Red Supergiant'
  ): CelestialBody {
    return new CelestialBody({
      name,
      category: BodyCategory.STAR,
      type: BodyType.RED_SUPERGIANT,
      mass: 18.0,            // High stellar mass
      radius: 4.0,           // Bloated physical/visual disk
      position,
      velocity,
      color: '#ef4444',      // Radiant vermilion / deep red
      haloColor: '#991b1b',  // Dark convective crimson corona
      fixed: false,
    });
  }

  /**
   * Creates a compact White Dwarf stellar remnant.
   * 
   * @param position 2D coordinates in world space
   * @param velocity Optional initial velocity vector
   * @param name Optional custom label (defaults to "White Dwarf")
   */
  public static createWhiteDwarf(
    position: Vector2,
    velocity: Vector2 = new Vector2(0, 0),
    name: string = 'White Dwarf'
  ): CelestialBody {
    return new CelestialBody({
      name,
      category: BodyCategory.STAR,
      type: BodyType.WHITE_DWARF,
      mass: 0.8,
      radius: 1.0,
      position,
      velocity,
      color: '#ffffff',      // Pure bright white point
      fixed: false,
    });
  }

  /**
   * Creates an ultra-dense Neutron Star remnant (pulsar scale, rapid rotation).
   * 
   * @param position 2D coordinates in world space
   * @param velocity Optional initial velocity vector
   * @param name Optional custom label (defaults to "Neutron Star")
   */
  public static createNeutronStar(
    position: Vector2,
    velocity: Vector2 = new Vector2(0, 0),
    name: string = 'Neutron Star'
  ): CelestialBody {
    return new CelestialBody({
      name,
      category: BodyCategory.STAR,
      type: BodyType.NEUTRON_STAR,
      mass: 1.5,             // Chandrasekhar-scale dense remnant mass
      radius: 1.0,           // Compact point-like radius
      position,
      velocity,
      color: '#e0e7ff',      // High-energy electric blue-white core
      haloColor: '#818cf8',  // Energetic synchrotron radiation halo
      fixed: false,
    });
  }

  /**
   * Creates a Black Hole (either a Stellar-mass singularity or a Supermassive anchor).
   * 
   * @param position 2D coordinates in world space
   * @param isSupermassive If true, creates a massive galactic anchor (e.g., 1000 M_sun, pinned by default)
   * @param velocity Optional initial velocity vector
   * @param name Optional custom label
   */
  public static createBlackHole(
    position: Vector2,
    isSupermassive: boolean = false,
    velocity: Vector2 = new Vector2(0, 0),
    name?: string
  ): CelestialBody {
    if (isSupermassive) {
      return new CelestialBody({
        name: name ?? 'Supermassive Black Hole',
        category: BodyCategory.BLACK_HOLE,
        type: BodyType.SUPERMASSIVE_BLACK_HOLE,
        mass: 1000.0,          // Enormous gravitational sink
        radius: 4.0,           // Event horizon scale
        position,
        velocity,
        color: '#000000',      // Black singularity core
        haloColor: '#a855f7',  // High-energy violet accretion glow
        fixed: true,           // Anchored galactic center by default
      });
    }

    return new CelestialBody({
      name: name ?? 'Stellar Black Hole',
      category: BodyCategory.BLACK_HOLE,
      type: BodyType.STELLAR_BLACK_HOLE,
      mass: 25.0,            // Heavy stellar collapse remnant
      radius: 2.0,
      position,
      velocity,
      color: '#000000',      // Black core
      haloColor: '#06b6d4',  // Blue-cyan accretion glow
      fixed: false,
    });
  }

  /**
   * Creates a Planet (either a small rocky terrestrial world or a gas giant).
   * 
   * @param position 2D coordinates in world space
   * @param isGasGiant If true, constructs a large gas giant; otherwise a terrestrial planet
   * @param velocity Optional orbital velocity vector
   * @param name Optional custom label
   */
  public static createPlanet(
    position: Vector2,
    isGasGiant: boolean = false,
    velocity: Vector2 = new Vector2(0, 0),
    name?: string
  ): CelestialBody {
    if (isGasGiant) {
      return new CelestialBody({
        name: name ?? 'Gas Giant',
        category: BodyCategory.PLANET,
        type: BodyType.GAS_GIANT,
        mass: 0.01,           // e.g., Jupiter-scale (~1/100th of solar mass)
        radius: 2.0,          // Visible disk
        position,
        velocity,
        color: '#fcd34d',     // Amber / warm banded atmosphere
        fixed: false,
      });
    }

    return new CelestialBody({
      name: name ?? 'Terrestrial Planet',
      category: BodyCategory.PLANET,
      type: BodyType.TERRESTRIAL_PLANET,
      mass: 0.001,          // e.g., Earth-scale (~1/1000th of solar mass)
      radius: 1.0,          // Small 1-pixel rocky point
      position,
      velocity,
      color: '#94a3b8',     // Slate blue / mineral gray
      fixed: false,
    });
  }

  /**
   * Creates an Asteroid (minor rocky kinetic debris).
   * 
   * @param position 2D coordinates in world space
   * @param velocity Trajectory velocity vector
   * @param name Optional custom label (defaults to "Asteroid")
   */
  public static createAsteroid(
    position: Vector2,
    velocity: Vector2 = new Vector2(0, 0),
    name: string = 'Asteroid'
  ): CelestialBody {
    return new CelestialBody({
      name,
      category: BodyCategory.SMALL_BODY,
      type: BodyType.ASTEROID,
      mass: 0.00001,        // Negligible gravity, but carries momentum
      radius: 0.5,
      position,
      velocity,
      color: '#64748b',     // Dull gray rock
      fixed: false,
    });
  }

  /**
   * Creates a Comet (icy small body that leaves a dynamic trail).
   * 
   * @param position 2D coordinates in world space
   * @param velocity Orbital velocity vector
   * @param name Optional custom label (defaults to "Comet")
   */
  public static createComet(
    position: Vector2,
    velocity: Vector2 = new Vector2(0, 0),
    name: string = 'Comet'
  ): CelestialBody {
    return new CelestialBody({
      name,
      category: BodyCategory.SMALL_BODY,
      type: BodyType.COMET,
      mass: 0.00001,
      radius: 0.5,
      position,
      velocity,
      color: '#e0f2fe',     // Pale ice cyan
      haloColor: '#38bdf8', // Subtle sublimation tail glow
      fixed: false,
    });
  }
}

