/**
 * types.ts
 * 
 * Type definitions and interfaces for preset simulation scenarios.
 * 
 * EDUCATIONAL CONCEPT: "Scenario-Driven Architecture"
 * ----------------------------------------------------
 * In physics engines and educational simulators, hardcoding celestial bodies
 * directly into the main game loop makes it difficult to test different physical
 * phenomena (e.g. comparing a circular orbit against an escape trajectory).
 * 
 * By defining a clean `Scenario` contract:
 * 1. Each scenario encapsulates its own initial state (bodies, masses, orbital velocities).
 * 2. Scenarios can be switched dynamically at runtime without reloading the browser.
 * 3. Scenarios are 100% testable in automated headless test suites (Vitest).
 */

import type { Universe } from '../simulation/Universe';
import type { Camera } from '../renderer/Camera';

export interface Scenario {
  /** Unique machine-readable identifier (e.g. 'keplerian-system') */
  readonly id: string;

  /** Human-readable display title (e.g. 'Keplerian Solar System') */
  readonly name: string;

  /** Educational description explaining the physics principles showcased */
  readonly description: string;

  /**
   * Configures the universe and camera for this scenario.
   * Cleans up prior state and seeds the exact celestial bodies required.
   * 
   * @param universe The active Universe container
   * @param camera The active Camera viewport
   */
  readonly setup: (universe: Universe, camera: Camera) => void;
}
