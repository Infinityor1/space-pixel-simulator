/**
 * camera.test.ts
 * 
 * Unit tests for the Camera viewport and coordinate transformer.
 * 
 * Testing Focus:
 * 1. Default initialization and center-aligned projection.
 * 2. World-to-Screen forward transformation with zoom and pan.
 * 3. Screen-to-World inverse transformation (roundtrip accuracy).
 * 4. Panning and zoom clamping limits (MIN_ZOOM and MAX_ZOOM).
 * 5. Viewport culling (identifying visible vs. off-screen bodies).
 */

import { describe, it, expect } from 'vitest';
import { Camera } from '../src/renderer/Camera';
import { Vector2 } from '../src/physics/Vector2';

describe('Camera Viewport & Coordinate Transformer', () => {
  it('should initialize with standard defaults (center (0, 0), zoom 1.0, 320x180)', () => {
    const camera = new Camera();

    expect(camera.position.x).toBe(0);
    expect(camera.position.y).toBe(0);
    expect(camera.zoom).toBe(1.0);
    expect(camera.viewportWidth).toBe(320);
    expect(camera.viewportHeight).toBe(180);
  });

  it('should project world origin (0, 0) directly to the screen center (160, 90)', () => {
    const camera = new Camera({ viewportWidth: 320, viewportHeight: 180 });
    const screenCenter = camera.worldToScreen(new Vector2(0, 0));

    expect(screenCenter.x).toBe(160);
    expect(screenCenter.y).toBe(90);
  });

  it('should apply zoom scaling during world-to-screen projection', () => {
    const camera = new Camera({ viewportWidth: 320, viewportHeight: 180, zoom: 2.0 });
    
    // In world space, delta is +10 on X and +20 on Y.
    // At zoom 2.0, delta on screen should be +20 on X and +40 on Y.
    const screenPos = camera.worldToScreen(new Vector2(10, 20));

    expect(screenPos.x).toBe(160 + 20); // 180
    expect(screenPos.y).toBe(90 + 40);  // 130
  });

  it('should apply camera pan offset during world-to-screen projection', () => {
    const camera = new Camera({ viewportWidth: 320, viewportHeight: 180 });

    // Move camera to (50, 50). A point at (50, 50) should now appear in the center of the screen!
    camera.pan(new Vector2(50, 50));
    const screenPos = camera.worldToScreen(new Vector2(50, 50));

    expect(screenPos.x).toBe(160);
    expect(screenPos.y).toBe(90);
  });

  it('should accurately invert screen coordinates back to world coordinates (roundtrip test)', () => {
    const camera = new Camera({
      position: new Vector2(25, -40),
      zoom: 1.5,
      viewportWidth: 320,
      viewportHeight: 180,
    });

    const originalWorld = new Vector2(85.4, -12.6);
    const screenPos = camera.worldToScreen(originalWorld);
    const reconstructedWorld = camera.screenToWorld(screenPos);

    expect(reconstructedWorld.x).toBeCloseTo(originalWorld.x, 5);
    expect(reconstructedWorld.y).toBeCloseTo(originalWorld.y, 5);
  });

  it('should clamp zoom levels to safe minimum and maximum limits', () => {
    const camera = new Camera();

    // Attempt to set a negative or near-zero zoom
    camera.setZoom(-5);
    expect(camera.zoom).toBe(Camera.MIN_ZOOM);

    // Attempt to zoom out beyond minimum
    camera.setZoom(0.001);
    expect(camera.zoom).toBe(Camera.MIN_ZOOM);

    // Attempt to zoom in beyond maximum
    camera.setZoom(1000);
    expect(camera.zoom).toBe(Camera.MAX_ZOOM);

    // zoomBy multiplier
    camera.setZoom(1.0);
    camera.zoomBy(2.0);
    expect(camera.zoom).toBe(2.0);
  });

  it('should reset position and zoom to defaults', () => {
    const camera = new Camera({ position: new Vector2(100, 200), zoom: 3.5 });

    camera.reset();
    expect(camera.position.x).toBe(0);
    expect(camera.position.y).toBe(0);
    expect(camera.zoom).toBe(1.0);
  });

  it('should perform viewport culling correctly (isVisible)', () => {
    const camera = new Camera({ viewportWidth: 320, viewportHeight: 180 });

    // 1. Center of world is visible
    expect(camera.isVisible(new Vector2(0, 0))).toBe(true);

    // 2. Far outside world boundary is not visible
    expect(camera.isVisible(new Vector2(1000, 1000))).toBe(false);
    expect(camera.isVisible(new Vector2(-500, 0))).toBe(false);

    // 3. Just outside the right edge:
    // Half width is 160. A point at world X = 165 has screen X = 325.
    // Screen buffer is [0, 320]. With radius 0 and margin 2, screen X + 2 = 327 > 320, so not visible.
    expect(camera.isVisible(new Vector2(165, 0), 0, 2)).toBe(false);

    // But if the body has a radius of 10 units, its left edge (325 - 10 = 315) overlaps the screen!
    expect(camera.isVisible(new Vector2(165, 0), 10, 2)).toBe(true);
  });

  it('should track a target body and follow its position across frames', () => {
    const camera = new Camera();
    const planet = {
      position: new Vector2(40, -20),
    } as any;

    camera.follow(planet);
    expect(camera.isFollowing).toBe(true);
    expect(camera.target).toBe(planet);
    expect(camera.position.x).toBe(40);
    expect(camera.position.y).toBe(-20);

    // Planet moves to new position
    planet.position = new Vector2(55, -15);
    camera.update();

    expect(camera.position.x).toBe(55);
    expect(camera.position.y).toBe(-15);

    // Unfollow
    camera.unfollow();
    expect(camera.isFollowing).toBe(false);
    expect(camera.target).toBeNull();
  });

  it('should automatically disengage target tracking when manually panned or reset', () => {
    const camera = new Camera();
    const body = { position: new Vector2(10, 10) } as any;

    camera.follow(body);
    expect(camera.isFollowing).toBe(true);

    // Manual pan disengages follow lock
    camera.pan(new Vector2(5, 5));
    expect(camera.isFollowing).toBe(false);
    expect(camera.target).toBeNull();

    // Following again and resetting
    camera.follow(body);
    expect(camera.isFollowing).toBe(true);
    camera.reset();
    expect(camera.isFollowing).toBe(false);
    expect(camera.target).toBeNull();
  });
});

