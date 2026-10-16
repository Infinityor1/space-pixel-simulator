/**
 * starfield.test.ts
 * 
 * Unit tests for the Starfield aesthetic background generator.
 * 
 * Testing Focus:
 * 1. Default generation count, dimensions, and coordinate bounds.
 * 2. Custom stars array support for deterministic rendering.
 * 3. Parallax offset calculation based on camera position.
 * 4. Toroidal (modulo) wrapping logic across screen boundaries.
 */

import { describe, it, expect, vi } from 'vitest';
import { Starfield } from '../src/renderer/Starfield';
import { Camera } from '../src/renderer/Camera';
import { Vector2 } from '../src/physics/Vector2';
import type { CanvasRenderer } from '../src/renderer/CanvasRenderer';

describe('Starfield Background Generator', () => {
  it('should generate the specified number of random stars within screen dimensions', () => {
    const starfield = new Starfield({ width: 320, height: 180, count: 50 });

    expect(starfield.stars.length).toBe(50);
    expect(starfield.width).toBe(320);
    expect(starfield.height).toBe(180);

    for (const star of starfield.stars) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(320);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(180);
      expect(star.parallaxFactor).toBeGreaterThan(0);
      expect(typeof star.color).toBe('string');
    }
  });

  it('should accept custom deterministic stars for testing', () => {
    const customStars = [
      { x: 10, y: 20, color: '#ffffff', parallaxFactor: 0.1 },
      { x: 100, y: 150, color: '#38bdf8', parallaxFactor: 0.05 },
    ];

    const starfield = new Starfield({ customStars });
    expect(starfield.stars.length).toBe(2);
    expect(starfield.stars[0].x).toBe(10);
    expect(starfield.stars[1].x).toBe(100);
  });

  it('should render stars at base positions when camera is centered at (0, 0)', () => {
    const customStars = [
      { x: 50, y: 70, color: '#ffffff', parallaxFactor: 0.1 },
    ];

    const starfield = new Starfield({ width: 320, height: 180, customStars });
    const camera = new Camera({ position: new Vector2(0, 0) });

    // Mock renderer with drawPixel spy
    const mockRenderer = {
      drawPixel: vi.fn(),
    } as unknown as CanvasRenderer;

    starfield.render(mockRenderer, camera);

    expect(mockRenderer.drawPixel).toHaveBeenCalledWith(50, 70, '#ffffff');
  });

  it('should apply parallax shift when camera moves', () => {
    const customStars = [
      { x: 100, y: 100, color: '#ffffff', parallaxFactor: 0.1 },
    ];

    const starfield = new Starfield({ width: 320, height: 180, customStars });
    // Camera panned to (200, 100).
    // Parallax factor is 0.1:
    // shiftX = 200 * 0.1 = 20 => screenX = 100 - 20 = 80
    // shiftY = 100 * 0.1 = 10 => screenY = 100 - 10 = 90
    const camera = new Camera({ position: new Vector2(200, 100) });

    const mockRenderer = {
      drawPixel: vi.fn(),
    } as unknown as CanvasRenderer;

    starfield.render(mockRenderer, camera);

    expect(mockRenderer.drawPixel).toHaveBeenCalledWith(80, 90, '#ffffff');
  });

  it('should wrap around screen borders cleanly when panned beyond boundaries', () => {
    const customStars = [
      { x: 10, y: 10, color: '#ffffff', parallaxFactor: 0.1 },
    ];

    const starfield = new Starfield({ width: 320, height: 180, customStars });
    // Camera panned to (300, 0).
    // shiftX = 300 * 0.1 = 30.
    // screenX = (10 - 30) = -20.
    // Toroidal wrapping: -20 + 320 = 300!
    const camera = new Camera({ position: new Vector2(300, 0) });

    const mockRenderer = {
      drawPixel: vi.fn(),
    } as unknown as CanvasRenderer;

    starfield.render(mockRenderer, camera);

    expect(mockRenderer.drawPixel).toHaveBeenCalledWith(300, 10, '#ffffff');
  });

  it('should keep background stars stationary when a body is being followed (camera.isFollowing is true)', () => {
    const customStars = [
      { x: 50, y: 50, color: '#ffffff', parallaxFactor: 0.1 },
    ];

    const starfield = new Starfield({ width: 320, height: 180, customStars });
    const camera = new Camera();

    // 1. Manually pan camera to (100, 100) in free-pan mode
    camera.pan(new Vector2(100, 100));
    expect(camera.isFollowing).toBe(false);

    const mockRenderer = {
      drawPixel: vi.fn(),
    } as unknown as CanvasRenderer;

    starfield.render(mockRenderer, camera);

    // Parallax shift: 100 * 0.1 = 10 pixels => screen coordinate: 50 - 10 = 40
    expect(mockRenderer.drawPixel).toHaveBeenLastCalledWith(40, 40, '#ffffff');

    // 2. Lock onto an orbiting planet
    const orbitingPlanet = {
      position: new Vector2(250, 400),
    } as any;

    camera.follow(orbitingPlanet);
    expect(camera.isFollowing).toBe(true);

    // Render while locked: stars should stay frozen at (40, 40), NOT jump or move with (250, 400)
    starfield.render(mockRenderer, camera);
    expect(mockRenderer.drawPixel).toHaveBeenLastCalledWith(40, 40, '#ffffff');

    // 3. Planet moves dynamically in its orbit
    orbitingPlanet.position = new Vector2(800, 1200);
    camera.update();
    expect(camera.position.x).toBe(800);
    expect(camera.position.y).toBe(1200);

    // Render again: background stars MUST remain stationary at (40, 40)
    starfield.render(mockRenderer, camera);
    expect(mockRenderer.drawPixel).toHaveBeenLastCalledWith(40, 40, '#ffffff');

    // 4. When manual panning resumes, parallax tracking resumes
    camera.pan(new Vector2(100, 100)); // unfollows and moves camera to (900, 1300)
    expect(camera.isFollowing).toBe(false);

    starfield.render(mockRenderer, camera);
    // shiftX = 900 * 0.1 = 90 => sx = (50 - 90) = -40 => wrapped: 320 - 40 = 280
    // shiftY = 1300 * 0.1 = 130 => sy = (50 - 130) = -80 => wrapped: 180 - 80 = 100
    expect(mockRenderer.drawPixel).toHaveBeenLastCalledWith(280, 100, '#ffffff');
  });

  it('should reset cached parallax offset when resetOffset is called', () => {
    const starfield = new Starfield();
    starfield.lastParallaxOffset = new Vector2(150, 200);

    starfield.resetOffset();
    expect(starfield.lastParallaxOffset.x).toBe(0);
    expect(starfield.lastParallaxOffset.y).toBe(0);
  });

  it('should allow background stars to move when lockOnFollow is toggled off', () => {
    const customStars = [
      { x: 50, y: 50, color: '#ffffff', parallaxFactor: 0.1 },
    ];

    // Initialize with lockOnFollow: false (user wants stars to move with target)
    const starfield = new Starfield({ width: 320, height: 180, customStars, lockOnFollow: false });
    expect(starfield.lockOnFollow).toBe(false);

    const camera = new Camera();
    const orbitingPlanet = {
      position: new Vector2(200, 300),
    } as any;

    camera.follow(orbitingPlanet);
    expect(camera.isFollowing).toBe(true);

    const mockRenderer = {
      drawPixel: vi.fn(),
    } as unknown as CanvasRenderer;

    starfield.render(mockRenderer, camera);
    // shiftX = 200 * 0.1 = 20 => screenX = 50 - 20 = 30
    // shiftY = 300 * 0.1 = 30 => screenY = 50 - 30 = 20
    expect(mockRenderer.drawPixel).toHaveBeenLastCalledWith(30, 20, '#ffffff');

    // Planet moves in orbit:
    orbitingPlanet.position = new Vector2(400, 500);
    camera.update();

    starfield.render(mockRenderer, camera);
    // shiftX = 400 * 0.1 = 40 => screenX = 50 - 40 = 10
    // shiftY = 500 * 0.1 = 50 => screenY = 50 - 50 = 0
    expect(mockRenderer.drawPixel).toHaveBeenLastCalledWith(10, 0, '#ffffff');

    // Toggle back to static mode:
    const newMode = starfield.toggleLockOnFollow();
    expect(newMode).toBe(true);
    expect(starfield.lockOnFollow).toBe(true);

    // Planet moves again:
    orbitingPlanet.position = new Vector2(600, 700);
    camera.update();

    starfield.render(mockRenderer, camera);
    // Because lockOnFollow is now true, stars remain locked at the last offset (400, 500) => (10, 0)
    expect(mockRenderer.drawPixel).toHaveBeenLastCalledWith(10, 0, '#ffffff');
  });
});

