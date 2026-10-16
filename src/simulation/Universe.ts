/**
 * Universe.ts
 * 
 * Scene container and state manager for celestial bodies in the simulation.
 * 
 * EDUCATIONAL CONCEPT: "The Scene Graph / World Container"
 * --------------------------------------------------------
 * In game engines (like Unity or Unreal), there is always a central container
 * that represents the "World" or "Scene".
 * 
 * The Universe acts as that container:
 * 1. Encapsulation: It owns the collection of all active celestial bodies.
 * 2. Pure Model: It contains ZERO graphics or DOM code, meaning it can be
 *    instantiated and tested entirely in Vitest/Node.js or inside background Web Workers.
 * 3. Lifecycle Management: Handles adding, removing, clearing, and querying bodies.
 * 4. Physics Stepping: Coordinates position updates and prepares the stage for
 *    gravitational N-body integration.
 */

import { Vector2 } from '../physics/Vector2';
import { CelestialBody } from '../entities/CelestialBody';
import { DEFAULT_G, applySystemGravity } from '../physics/NewtonianGravity';

export interface UniverseOptions {
  /** Whether gravitational attraction is active during step(dt) (default: false) */
  gravityEnabled?: boolean;

  /** Gravitational constant G in simulation units (default: DEFAULT_G) */
  G?: number;

  /** Time speed multiplier (default: 1.0 = normal, 2.0 = 2x speed) */
  timeScale?: number;
}

export class Universe {
  /** Array of active celestial bodies for fast sequential iteration */
  private bodies: CelestialBody[] = [];

  /** Map by entity ID for fast O(1) lookups */
  private bodyMap: Map<string, CelestialBody> = new Map();

  /** Whether gravitational force integration is active */
  public gravityEnabled: boolean;

  /** Gravitational constant G */
  public G: number;

  /** Time speed multiplier applied to dt during step() */
  public timeScale: number;

  /**
   * Constructs a new Universe container.
   * 
   * @param options Configuration options for gravity and physics
   */
  constructor(options: UniverseOptions = {}) {
    this.gravityEnabled = options.gravityEnabled ?? false;
    this.G = options.G ?? DEFAULT_G;
    this.timeScale = options.timeScale ?? 1.0;
  }

  /**
   * Adds a single celestial body to the universe.
   * If a body with the same ID already exists, it is replaced.
   * 
   * @param body The CelestialBody instance to add
   */
  public addBody(body: CelestialBody): void {
    if (this.bodyMap.has(body.id)) {
      this.removeBody(body.id);
    }
    this.bodies.push(body);
    this.bodyMap.set(body.id, body);
  }

  /**
   * Adds multiple celestial bodies to the universe in batch.
   * 
   * @param bodies Array of CelestialBody instances
   */
  public addBodies(bodies: CelestialBody[]): void {
    for (const body of bodies) {
      this.addBody(body);
    }
  }

  /**
   * Removes a celestial body from the universe by its unique identifier.
   * 
   * @param id The unique string ID of the body
   * @returns True if a body was found and removed, false otherwise
   */
  public removeBody(id: string): boolean {
    if (!this.bodyMap.has(id)) {
      return false;
    }
    this.bodyMap.delete(id);
    this.bodies = this.bodies.filter((b) => b.id !== id);
    return true;
  }

  /**
   * Clears all celestial bodies from the universe.
   */
  public clear(): void {
    this.bodies = [];
    this.bodyMap.clear();
  }

  /**
   * Returns a read-only view of all active celestial bodies.
   */
  public getBodies(): readonly CelestialBody[] {
    return this.bodies;
  }

  /**
   * Retrieves a specific celestial body by its unique ID.
   * 
   * @param id The body ID to look up
   * @returns The CelestialBody if found, or undefined
   */
  public getBodyById(id: string): CelestialBody | undefined {
    return this.bodyMap.get(id);
  }

  /**
   * Returns the total count of celestial bodies currently in the universe.
   */
  public get bodyCount(): number {
    return this.bodies.length;
  }

  /**
   * Advances the physical state of all non-fixed bodies by time step dt (scaled by timeScale).
   * If gravity is enabled, first applies gravitational acceleration to update velocities,
   * then updates positions.
   * 
   * @param dt Elapsed base simulation time in seconds
   */
  public step(dt: number): void {
    const effectiveDt = dt * this.timeScale;
    if (effectiveDt <= 0) {
      return;
    }

    // 1. Calculate and apply gravitational forces if enabled
    if (this.gravityEnabled && this.G !== 0) {
      applySystemGravity(this.bodies, effectiveDt, this.G);
    }

    // 2. Advance body positions based on updated velocities
    for (const body of this.bodies) {
      body.updatePosition(effectiveDt);
    }
  }

  /**
   * Adjusts the speed of time progression in the simulation.
   * 
   * @param scale Speed multiplier (e.g., 1.0 = normal, 2.0 = double speed, 0.5 = half speed)
   */
  public setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, scale);
  }

  /**
   * Enables gravitational forces between bodies.
   * 
   * @param G Optional new gravitational constant
   */
  public enableGravity(G?: number): void {
    this.gravityEnabled = true;
    if (G !== undefined) {
      this.G = G;
    }
  }

  /**
   * Disables gravitational forces, switching to pure linear kinematics.
   */
  public disableGravity(): void {
    this.gravityEnabled = false;
  }

  /**
   * Calculates the Center of Mass (Barycenter) of the entire universe.
   * 
   * EDUCATIONAL CONCEPT: "Center of Mass (Barycenter)"
   * -------------------------------------------------
   * In astrophysics, celestial bodies don't orbit around empty space; they orbit
   * around the collective center of mass of the system:
   * 
   * R_cm = (Sum of m_i * r_i) / (Sum of m_i)
   * 
   * If total mass is zero, returns (0, 0).
   * 
   * @returns Vector2 representing the collective center of mass
   */
  public getCenterOfMass(): Vector2 {
    let totalMass = 0;
    let weightedX = 0;
    let weightedY = 0;

    for (const body of this.bodies) {
      totalMass += body.mass;
      weightedX += body.position.x * body.mass;
      weightedY += body.position.y * body.mass;
    }

    if (totalMass === 0) {
      return new Vector2(0, 0);
    }

    return new Vector2(weightedX / totalMass, weightedY / totalMass);
  }

  /**
   * Calculates the total combined mass of all bodies in the universe.
   */
  public getTotalMass(): number {
    let total = 0;
    for (const body of this.bodies) {
      total += body.mass;
    }
    return total;
  }

  /**
   * Finds the closest celestial body to a given world coordinate.
   * Highly useful for mouse selection and user inspection tools!
   * 
   * @param worldPos Query position in world coordinates
   * @param maxDistance Optional maximum search radius
   * @returns The nearest CelestialBody, or null if none found within range
   */
  public findNearest(worldPos: Vector2, maxDistance: number = Infinity): CelestialBody | null {
    let nearest: CelestialBody | null = null;
    let minDistance = maxDistance;

    for (const body of this.bodies) {
      const dist = body.position.distanceTo(worldPos);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = body;
      }
    }

    return nearest;
  }

  /**
   * Computes the axis-aligned bounding box enclosing all active bodies.
   * Useful for auto-framing the camera to view the whole galaxy!
   * 
   * @returns Bounding box with min and max coordinates, or null if empty
   */
  public getBoundingBox(): { min: Vector2; max: Vector2 } | null {
    if (this.bodies.length === 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const body of this.bodies) {
      if (body.position.x < minX) minX = body.position.x;
      if (body.position.y < minY) minY = body.position.y;
      if (body.position.x > maxX) maxX = body.position.x;
      if (body.position.y > maxY) maxY = body.position.y;
    }

    return {
      min: new Vector2(minX, minY),
      max: new Vector2(maxX, maxY),
    };
  }
}

