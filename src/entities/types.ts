/**
 * types.ts
 * 
 * Central type definitions and enumerations for all celestial entities
 * in the Pixel Galaxy Simulator.
 * 
 * "Why use TypeScript String Enums?"
 * ----------------------------------------------------
 * In JavaScript, categories are often represented as raw strings (e.g., "STAR", "PLANET").
 * However, strings are prone to silent typos (e.g., "PLANT" instead of "PLANET").
 * 
 * An `enum` (enumeration) defines a strictly constrained set of named constants.
 * By using string enums (`STAR = 'STAR'`), we gain:
 * 1. Compile-time validation: TypeScript prevents invalid types before code runs.
 * 2. IDE Autocompletion: Editors will suggest valid types automatically.
 * 3. Readable debugging: When logged to the console, the value prints as "STAR"
 *    rather than an opaque integer number (like 0 or 1).
 */

import { Vector2 } from '../physics/Vector2';

/**
 * High-level astrophysical categories.
 * Groups related body types under broad physical domains.
 * 
 * We use an `as const` object paired with a type alias.
 * This provides identical syntax to an enum (e.g., BodyCategory.STAR)
 * while ensuring 100% compatibility with modern ECMAScript type stripping.
 */
export const BodyCategory = {
  /** Luminous plasma spheres undergoing or having undergone nuclear fusion */
  STAR: 'STAR',

  /** Gravitational singularities where escape velocity exceeds the speed of light */
  BLACK_HOLE: 'BLACK_HOLE',

  /** Non-luminous major bodies orbiting a central star */
  PLANET: 'PLANET',

  /** Minor bodies including kinetic asteroids and icy comets */
  SMALL_BODY: 'SMALL_BODY',

  /** Diffuse interstellar medium (nebulae, star-forming regions) */
  GAS_CLOUD: 'GAS_CLOUD',

  /** Non-luminous mass contributing to galactic rotation curves */
  DARK_MATTER: 'DARK_MATTER',
} as const;

export type BodyCategory = typeof BodyCategory[keyof typeof BodyCategory];

/**
 * Specific astrophysical classification for individual bodies.
 * Maps directly to physical properties (mass, radius, color, halo effects).
 */
export const BodyType = {
  // --- STARS ---
  /** G-type main-sequence star, stable host for solar systems (e.g., our Sun) */
  YELLOW_DWARF: 'YELLOW_DWARF',

  /** M-type cool, low-mass star, exceptionally long-lived and abundant */
  RED_DWARF: 'RED_DWARF',

  /** O/B-type massive, hot, luminous star; powerful gravitational presence */
  BLUE_GIANT: 'BLUE_GIANT',

  /** Aging massive star nearing end-of-life supernova stage */
  RED_SUPERGIANT: 'RED_SUPERGIANT',

  /** Dense, hot stellar remnant core left behind by intermediate-mass stars */
  WHITE_DWARF: 'WHITE_DWARF',

  /** Ultra-dense remnant of a collapsed supergiant, rapid rotation */
  NEUTRON_STAR: 'NEUTRON_STAR',

  // --- BLACK HOLES ---
  /** Formed from the gravitational collapse of a single giant star */
  STELLAR_BLACK_HOLE: 'STELLAR_BLACK_HOLE',

  /** Massive singularity sitting at the center of a galaxy (millions of solar masses) */
  SUPERMASSIVE_BLACK_HOLE: 'SUPERMASSIVE_BLACK_HOLE',

  // --- PLANETS ---
  /** Rocky planet with solid surface (e.g., Earth, Mars, Mercury) */
  TERRESTRIAL_PLANET: 'TERRESTRIAL_PLANET',

  /** Massive planet composed primarily of hydrogen and helium (e.g., Jupiter, Saturn) */
  GAS_GIANT: 'GAS_GIANT',

  // --- SMALL BODIES ---
  /** Rocky or metallic debris travelling on kinetic trajectories */
  ASTEROID: 'ASTEROID',

  /** Icy nucleus that develops an active outgassing tail near stars */
  COMET: 'COMET',

  // --- INTERSTELLAR & SCAFFOLDING ---
  /** Gaseous particle contributing to friction and accretion disks */
  GAS_PARTICLE: 'GAS_PARTICLE',

  /** Gravitational anchor simulating galactic rotation halo */
  DARK_MATTER_HALO: 'DARK_MATTER_HALO',
} as const;

export type BodyType = typeof BodyType[keyof typeof BodyType];

/**
 * Configuration options required to instantiate a CelestialBody.
 * 
 * EDUCATIONAL CONCEPT: "Options Pattern (Parameter Object)"
 * ---------------------------------------------------------
 * Instead of creating a constructor with 10 separate arguments:
 * `new CelestialBody(name, category, type, mass, radius, pos, vel, color, ...)`
 * which is easy to scramble by accident, we pass a single typed configuration object:
 * `new CelestialBody(options)`.
 */
export interface CelestialBodyOptions {
  /** Optional unique identifier; if omitted, the body generates an internal ID */
  id?: string;

  /** Human-readable display label (e.g., "Sol", "Sagittarius A*", "Earth") */
  name: string;

  /** Broad classification category */
  category: BodyCategory;

  /** Specific astrophysical type */
  type: BodyType;

  /** Physical mass in simulation units (e.g., solar mass equivalents) */
  mass: number;

  /** Physical and visual radius for collision/rendering in simulation units */
  radius: number;

  /** World coordinate position in 2D space */
  position: Vector2;

  /** Current velocity vector in 2D space (defaults to (0, 0) if omitted) */
  velocity?: Vector2;

  /** Primary core color in CSS hex format (e.g., '#fde047') */
  color: string;

  /** Optional halo or corona color for pixel-cross glowing stars */
  haloColor?: string;

  /** If true, the body is pinned in space and unaffected by external gravity */
  fixed?: boolean;
}
