/**
 * CelestialBody.ts
 * 
 * Domain Entity representing a physical object in space (Star, Planet, Black Hole, etc.).
 * 
 * CORE PRINCIPLE: "Separation of Concerns" (Model vs View)
 * --------------------------------------------------------
 * A CelestialBody has ZERO knowledge of HTML5 Canvas, pixels, screens, or rendering.
 * It is a pure mathematical and astrophysics data container:
 * - It lives in continuous 2D "World Space" (Vector2 coordinates).
 * - It obeys Newtonian mechanics (mass, position, velocity, force, acceleration).
 * - Because it contains no browser DOM dependencies, it can be unit-tested
 *   100% headlessly in Vitest/Node.js or executed inside background Web Workers.
 */

import { Vector2 } from '../physics/Vector2';
import { BodyCategory, BodyType, type CelestialBodyOptions } from './types';

// Simple sequential ID counter for human-readable debugging IDs (e.g., "body_1", "body_2")
let idSequence = 1;

export class CelestialBody {
  /** Unique entity identifier */
  public readonly id: string;

  /** Display name (e.g., "Sun", "Alpha Centauri") */
  public name: string;

  /** Broad astrophysical classification */
  public readonly category: BodyCategory;

  /** Specific physical type */
  public readonly type: BodyType;

  /** Mass in simulation units (typically solar mass multiples) */
  public mass: number;

  /** Collision and physical radius in simulation units */
  public radius: number;

  /** Current position in continuous 2D world space */
  public position: Vector2;

  /** Current velocity vector (rate of change of position) */
  public velocity: Vector2;

  /** Primary core color for visual representation (hex or CSS color) */
  public color: string;

  /** Optional corona/halo color for glowing bodies like stars or accretion disks */
  public haloColor?: string;

  /** If true, this body is fixed (pinned in space, immune to gravitational pull) */
  public fixed: boolean;

  /**
   * Constructs a new CelestialBody using the Options Pattern.
   * 
   * NOTE ON TYPESCRIPT: We explicitly declare class fields above and assign them
   * inside the constructor body, rather than using parameter properties (e.g., `constructor(public name: string)`).
   * This is required by `"erasableSyntaxOnly": true`, keeping our TypeScript 100% compliant
   * with modern standard ECMAScript type stripping.
   * 
   * @param options Configuration object defining initial physical and visual properties
   */
  constructor(options: CelestialBodyOptions) {
    this.id = options.id ?? `body_${idSequence++}`;
    this.name = options.name;
    this.category = options.category;
    this.type = options.type;
    this.mass = options.mass;
    this.radius = options.radius;
    this.position = options.position;
    this.velocity = options.velocity ?? new Vector2(0, 0);
    this.color = options.color;
    this.haloColor = options.haloColor;
    this.fixed = options.fixed ?? false;
  }

  /**
   * Advances the body's position based on its current velocity over time step dt.
   * 
   * EDUCATIONAL CONCEPT: "Numerical Integration (Euler Step)"
   * ---------------------------------------------------------
   * In continuous calculus: velocity is the derivative of position: v = dr / dt.
   * In discrete computer simulations: new position = current position + (velocity * dt).
   * 
   * @param dt Elapsed time in simulation seconds
   */
  public updatePosition(dt: number): void {
    if (this.fixed) {
      return; // Fixed bodies (e.g. anchors) do not drift
    }
    // r_new = r_old + v * dt
    this.position = this.position.add(this.velocity.scale(dt));
  }

  /**
   * Applies a gravitational or external force vector F over time step dt.
   * 
   * EDUCATIONAL CONCEPT: "Newton's Second Law of Motion"
   * -----------------------------------------------------
   * F = m * a   =>   a = F / m
   * Acceleration is force divided by mass.
   * 
   * Then, change in velocity (delta_v) = a * dt = (F / m) * dt.
   * 
   * @param force Force vector in simulation units
   * @param dt Elapsed time in simulation seconds
   */
  public applyForce(force: Vector2, dt: number): void {
    if (this.fixed || this.mass <= 0) {
      return;
    }
    const acceleration = force.scale(1 / this.mass);
    this.velocity = this.velocity.add(acceleration.scale(dt));
  }

  /**
   * Directly adjusts the body's velocity by an instantaneous change (delta-V).
   * Useful for rocket thrusters, collisions, or initial impulse orbital kicks.
   * 
   * @param deltaV Velocity change vector
   */
  public applyImpulse(deltaV: Vector2): void {
    if (this.fixed) {
      return;
    }
    this.velocity = this.velocity.add(deltaV);
  }

  /**
   * Calculates Euclidean distance to another celestial body.
   * 
   * @param other The target celestial body
   * @returns Distance in simulation world units
   */
  public distanceTo(other: CelestialBody): number {
    return this.position.distanceTo(other.position);
  }

  /**
   * Creates an exact clone/snapshot of this body's current state.
   * Helpful for rolling back simulations, parallel prediction paths, and testing.
   */
  public clone(): CelestialBody {
    return new CelestialBody({
      id: `${this.id}_copy`,
      name: `${this.name} (Clone)`,
      category: this.category,
      type: this.type,
      mass: this.mass,
      radius: this.radius,
      position: this.position,
      velocity: this.velocity,
      color: this.color,
      haloColor: this.haloColor,
      fixed: this.fixed,
    });
  }
}
