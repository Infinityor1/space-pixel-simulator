/**
 * Vector2.ts
 * 
 * Represents a 2-dimensional mathematical vector (x, y).
 * 
 * In physics simulations, vectors represent:
 * - Position: where an object is located in space (pixels or meters)
 * - Velocity: speed and direction of movement (pixels per second)
 * - Acceleration / Force: gravitational attraction pulling objects together
 */

export class Vector2 {
  public x: number;
  public y: number;

  /**
   * Constructs a new 2D vector.
   * 
   * @param x The horizontal component (default: 0)
   * @param y The vertical component (default: 0)
   */
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Creates an exact duplicate of this vector.
   * Useful when you want to copy coordinates without mutating the original.
   */
  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /**
   * Adds another vector to this one and returns a new Vector2.
   * Formula: (x1 + x2, y1 + y2)
   * 
   * Example in physics: newPosition = currentPosition + velocity
   */
  public add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /**
   * Subtracts another vector from this one and returns a new Vector2.
   * Formula: (x1 - x2, y1 - y2)
   * 
   * Example in physics: displacement = targetPosition - currentPosition
   */
  public sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /**
   * Multiplies the vector components by a scalar (a single number).
   * Formula: (x * scalar, y * scalar)
   * 
   * Example in physics: scaledVelocity = velocity * deltaTime
   */
  public scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  /**
   * Calculates the squared length (magnitude squared) of the vector: x^2 + y^2.
   * 
   * PERFORMANCE TIP (Important for Final Year Project):
   * Calculating square roots (Math.sqrt) is computationally expensive.
   * In Newton's law of gravity (F = G * m1 * m2 / r^2), we need distance squared (r^2).
   * Using magnitudeSquared avoids the unnecessary square root operation!
   */
  public magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Calculates the Euclidean length (magnitude) using the Pythagorean theorem:
   * sqrt(x^2 + y^2)
   */
  public magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  /**
   * Calculates the Euclidean distance between this vector and another vector.
   * Formula: sqrt((x2 - x1)^2 + (y2 - y1)^2)
   */
  public distanceTo(v: Vector2): number {
    return this.sub(v).magnitude();
  }

  /**
   * Calculates the squared distance between this vector and another vector.
   * Formula: (x2 - x1)^2 + (y2 - y1)^2
   */
  public distanceSquaredTo(v: Vector2): number {
    return this.sub(v).magnitudeSquared();
  }

  /**
   * Normalizes the vector into a "unit vector" with length 1, preserving its direction.
   * Formula: (x / magnitude, y / magnitude)
   * 
   * If the vector has zero length, returns (0, 0) to avoid division-by-zero errors (NaN).
   */
  public normalize(): Vector2 {
    const mag = this.magnitude();
    if (mag === 0) {
      return new Vector2(0, 0);
    }
    return new Vector2(this.x / mag, this.y / mag);
  }
}

