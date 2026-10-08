import { describe, it, expect } from 'vitest';
import { Vector2 } from '../src/physics/Vector2';

/**
 * Unit Tests for Vector2 Math Library
 * 
 * Verifies that all 2D vector algebra operations adhere to mathematical definitions.
 */
describe('Vector2 Operations', () => {
  it('should initialize with default (0, 0) and custom coordinates', () => {
    const vDefault = new Vector2();
    expect(vDefault.x).toBe(0);
    expect(vDefault.y).toBe(0);

    const vCustom = new Vector2(10, -5);
    expect(vCustom.x).toBe(10);
    expect(vCustom.y).toBe(-5);
  });

  it('should clone a vector without sharing references', () => {
    const original = new Vector2(4, 7);
    const copy = original.clone();

    expect(copy.x).toBe(original.x);
    expect(copy.y).toBe(original.y);

    // Mutating the copy must not affect the original
    copy.x = 99;
    expect(original.x).toBe(4);
  });

  it('should correctly perform vector addition (a + b)', () => {
    const a = new Vector2(2, 3);
    const b = new Vector2(5, 7);
    const result = a.add(b);

    expect(result.x).toBe(7);
    expect(result.y).toBe(10);
    // Ensure originals are not modified (immutability)
    expect(a.x).toBe(2);
    expect(b.x).toBe(5);
  });

  it('should correctly perform vector subtraction (a - b)', () => {
    const a = new Vector2(10, 20);
    const b = new Vector2(3, 8);
    const result = a.sub(b);

    expect(result.x).toBe(7);
    expect(result.y).toBe(12);
  });

  it('should correctly multiply by a scalar', () => {
    const v = new Vector2(3, -4);
    const result = v.scale(2.5);

    expect(result.x).toBe(7.5);
    expect(result.y).toBe(-10);
  });

  it('should compute magnitude and magnitudeSquared (3-4-5 Pythagorean triangle)', () => {
    const v = new Vector2(3, 4);

    // 3^2 + 4^2 = 9 + 16 = 25
    expect(v.magnitudeSquared()).toBe(25);
    // sqrt(25) = 5
    expect(v.magnitude()).toBe(5);
  });

  it('should calculate distance and squared distance between two points', () => {
    const p1 = new Vector2(1, 1);
    const p2 = new Vector2(4, 5);

    // dx = 3, dy = 4 -> distance = 5, distanceSquared = 25
    expect(p1.distanceTo(p2)).toBe(5);
    expect(p1.distanceSquaredTo(p2)).toBe(25);
  });

  it('should normalize a vector into a unit vector of length 1', () => {
    const v = new Vector2(0, 10);
    const unit = v.normalize();

    expect(unit.x).toBe(0);
    expect(unit.y).toBe(1);
    expect(unit.magnitude()).toBe(1);
  });

  it('should handle zero vector normalization gracefully without returning NaN', () => {
    const zero = new Vector2(0, 0);
    const normalized = zero.normalize();

    expect(normalized.x).toBe(0);
    expect(normalized.y).toBe(0);
    expect(Number.isNaN(normalized.x)).toBe(false);
    expect(Number.isNaN(normalized.y)).toBe(false);
  });
});
