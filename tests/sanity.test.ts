import { describe, it, expect } from 'vitest';

/**
 * Sanity test to verify Vitest is installed and functioning correctly.
 * 
 * - `describe`: Groups related test cases together (a test suite).
 * - `it`: Defines an individual test case with an expectation.
 * - `expect`: An assertion checking whether a value meets a condition.
 */
describe('Environment Sanity Check', () => {
  it('should correctly evaluate simple arithmetic', () => {
    // 1 + 1 should equal 2
    expect(1 + 1).toBe(2);
  });
});

