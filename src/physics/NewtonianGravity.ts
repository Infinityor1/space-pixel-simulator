/**
 * NewtonianGravity.ts
 * 
 * Implementation of Newton's Universal Law of Gravitation.
 * 
 * EDUCATIONAL CONCEPT: "Newton's Law of Universal Gravitation"
 * -------------------------------------------------------------
 * In 1687, Sir Isaac Newton published the Principia Mathematica, establishing that
 * every particle of matter attracts every other particle with a force that is:
 * 1. Directly proportional to the product of their masses (m1 * m2).
 * 2. Inversely proportional to the square of the distance between them (1 / r^2).
 * 
 * MATHEMATICAL FORMULA:
 * F = G * (m1 * m2) / r^2
 * 
 * WHERE:
 * - F: Scalar magnitude of gravitational attraction.
 * - G: Gravitational constant (in simulation units, typically normalized to 1.0 or similar).
 * - m1, m2: Masses of the two interacting celestial bodies.
 * - r: Euclidean distance between their centers (r = sqrt(dx^2 + dy^2)).
 * 
 * VECTOR FORMULATION:
 * Force is not just a number; it has a direction in 2D space.
 * Body A is pulled TOWARDS Body B along the line connecting them:
 * 
 * 1. Displacement vector from A to B:
 *    delta_r = position_B - position_A
 * 2. Distance:
 *    r = magnitude(delta_r)
 * 3. Unit direction vector (normalized direction):
 *    u_hat = delta_r / r
 * 4. Force vector acting on A:
 *    F_vector = (G * m1 * m2 / r^2) * u_hat
 * 
 * NEWTON'S THIRD LAW OF MOTION:
 * "For every action, there is an equal and opposite reaction."
 * The force exerted on Body B by Body A is exactly equal in magnitude and
 * opposite in direction:
 *    F_B = -F_A
 * 
 * This allows an important computational optimization:
 * For N bodies, we only need to calculate N * (N - 1) / 2 pairs instead of N^2!
 */

import { Vector2 } from './Vector2';
import type { CelestialBody } from '../entities/CelestialBody';

/**
 * Standard gravitational constant in simulation units.
 * In astronomical simulations, we normalize G to 1.0 (or a scaled constant)
 * rather than the tiny SI value (6.674e-11) so values fit comfortably within
 * standard 64-bit floating-point precision.
 */
export const DEFAULT_G = 1.0;

/**
 * Calculates the gravitational attraction vector exerted ON bodyA BY bodyB.
 * 
 * @param bodyA The body experiencing the pull
 * @param bodyB The body exerting the pull
 * @param G The gravitational constant (default: 1.0)
 * @returns Vector2 representing the directional force pull on bodyA
 */
export function calculateGravitationalForce(
  bodyA: CelestialBody,
  bodyB: CelestialBody,
  G: number = DEFAULT_G
): Vector2 {
  // If either body has zero mass, there is no gravitational interaction
  if (bodyA.mass <= 0 || bodyB.mass <= 0) {
    return new Vector2(0, 0);
  }

  // 1. Calculate displacement vector from Body A to Body B: delta = B - A
  const delta = bodyB.position.sub(bodyA.position);

  // 2. Compute distance squared (dx^2 + dy^2)
  const distSq = delta.magnitudeSquared();

  // Guard against division by zero (coincident particles at the exact same point)
  if (distSq === 0) {
    return new Vector2(0, 0);
  }

  // 3. Compute Euclidean distance r = sqrt(dx^2 + dy^2)
  const distance = Math.sqrt(distSq);

  // 4. Compute force magnitude: F = G * (m1 * m2) / r^2
  const forceMagnitude = (G * bodyA.mass * bodyB.mass) / distSq;

  // 5. Multiply force magnitude by unit direction vector: F_vec = F * (delta / r)
  const unitDirection = delta.scale(1 / distance);
  return unitDirection.scale(forceMagnitude);
}

/**
 * Computes net gravitational forces for all bodies in an N-body system.
 * 
 * Uses Newton's Third Law (F_ij = -F_ji) to halve the number of required calculations
 * from N^2 to N * (N - 1) / 2.
 * 
 * @param bodies List of all active celestial bodies
 * @param G Gravitational constant (default: 1.0)
 * @returns Map of body ID to its accumulated net force vector
 */
export function computeSystemGravitationalForces(
  bodies: readonly CelestialBody[],
  G: number = DEFAULT_G
): Map<string, Vector2> {
  const forceMap = new Map<string, Vector2>();

  // 1. Initialize all accumulated forces to zero
  for (const body of bodies) {
    forceMap.set(body.id, new Vector2(0, 0));
  }

  const n = bodies.length;

  // 2. Iterate through all unique pairs (i, j) where j > i
  for (let i = 0; i < n; i++) {
    const bodyA = bodies[i];

    for (let j = i + 1; j < n; j++) {
      const bodyB = bodies[j];

      // Calculate gravitational force on bodyA towards bodyB
      const forceOnA = calculateGravitationalForce(bodyA, bodyB, G);

      // Newton's Third Law: Force on B is equal and opposite
      const forceOnB = forceOnA.negate();

      // Accumulate force on A
      const currentForceA = forceMap.get(bodyA.id)!;
      forceMap.set(bodyA.id, currentForceA.add(forceOnA));

      // Accumulate force on B
      const currentForceB = forceMap.get(bodyB.id)!;
      forceMap.set(bodyB.id, currentForceB.add(forceOnB));
    }
  }

  return forceMap;
}

/**
 * Applies gravitational forces to all bodies over a time step dt.
 * 
 * Computes net gravitational forces for each body and updates velocities:
 * a = F / m  =>  delta_v = a * dt
 * 
 * @param bodies List of all active celestial bodies
 * @param dt Time step in seconds
 * @param G Gravitational constant (default: 1.0)
 */
export function applySystemGravity(
  bodies: readonly CelestialBody[],
  dt: number,
  G: number = DEFAULT_G
): void {
  const forces = computeSystemGravitationalForces(bodies, G);

  for (const body of bodies) {
    const force = forces.get(body.id);
    if (force) {
      body.applyForce(force, dt);
    }
  }
}

