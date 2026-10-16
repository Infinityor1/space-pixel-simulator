/**
 * Starfield.ts
 * 
 * Manages aesthetic background stars that do not participate in gravitational physics.
 * 
 * EDUCATIONAL CONCEPT: "Parallax Scrolling & Aesthetic Separation"
 * -----------------------------------------------------------------
 * In astrophysics, distant stars are millions of light-years away from our solar system.
 * While our local planets and sun move dynamically under gravity, distant stars
 * appear virtually stationary or exhibit subtle "Parallax" (shifting much slower
 * than foreground objects when the observer's camera moves).
 * 
 * In game and simulation architecture, we keep these completely separate from the physics model:
 * 1. Zero Physics Overhead: These stars have no mass, no velocity, and do not
 *    slow down our N-body gravitational calculations (O(N^2)).
 * 2. Visual Immersion: Subtle parallax movement provides an authentic feeling
 *    of infinite depth in retro 2D pixel space.
 * 3. Screen Wrap: Using modular arithmetic, stars wrap seamlessly around the
 *    screen edges so the user can pan infinitely without running out of stars.
 */

import { Vector2 } from '../physics/Vector2';
import type { Camera } from './Camera';
import type { CanvasRenderer } from './CanvasRenderer';

export interface BackgroundStar {
  /** Screen buffer X coordinate (0 to width) */
  x: number;

  /** Screen buffer Y coordinate (0 to height) */
  y: number;

  /** Subtle palette color (e.g. dim gray, faint cyan, soft amber) */
  color: string;

  /** Parallax depth multiplier (e.g. 0.05 = moves at 5% of camera speed) */
  parallaxFactor: number;
}

export interface StarfieldOptions {
  /** Width of the screen buffer (default: 320) */
  width?: number;

  /** Height of the screen buffer (default: 180) */
  height?: number;

  /** Total number of random background stars to generate (default: 65) */
  count?: number;

  /** Base parallax rate (default: 0.05) */
  baseParallax?: number;

  /** Optional explicit list of stars (ideal for deterministic unit tests) */
  customStars?: BackgroundStar[];

  /**
   * Whether background stars should remain stationary when following an orbiting body.
   * - true: stars freeze on screen when a body is tracked (realistic cosmic background).
   * - false: stars exhibit parallax drift along with the target's movement.
   * Default: true
   */
  lockOnFollow?: boolean;
}

export class Starfield {
  /** List of background stars */
  public readonly stars: BackgroundStar[] = [];

  /** Buffer width in pixels */
  public readonly width: number;

  /** Buffer height in pixels */
  public readonly height: number;

  /**
   * Whether background stars stay stationary when following a target body.
   * Toggleable at runtime by the user!
   */
  public lockOnFollow: boolean;

  /**
   * Cached parallax offset to freeze background stars when a body is being followed.
   * 
   * EDUCATIONAL CONCEPT: "Stationary Sky from an Orbiting Frame of Reference"
   * --------------------------------------------------------------------------
   * When an observer tracks an orbiting planet, the camera moves rapidly through
   * world coordinates. If background stars shifted with that rapid camera movement,
   * the entire starry night sky would dizzyingly spin or drift across the screen!
   * 
   * In reality, stars are trillions of kilometers away (virtually infinite distance).
   * By caching the last parallax offset and freezing it while `camera.isFollowing && this.lockOnFollow`
   * is true, the stars stay firmly pinned on the screen while the tracked body orbits smoothly.
   */
  public lastParallaxOffset: Vector2 = new Vector2(0, 0);

  constructor(options: StarfieldOptions = {}) {
    this.width = options.width ?? 320;
    this.height = options.height ?? 180;
    this.lockOnFollow = options.lockOnFollow ?? true;

    // If custom stars were provided (e.g. in unit tests), use them directly
    if (options.customStars) {
      this.stars = [...options.customStars];
      return;
    }

    const count = options.count ?? 65;
    const baseParallax = options.baseParallax ?? 0.05;

    // Authentic retro palette of faint, distant celestial points
    const starPalette = [
      '#1e293b', // Deep dim slate (distant backdrop)
      '#334155', // Muted slate gray
      '#475569', // Medium cool slate
      '#64748b', // Soft silver-gray
      '#94a3b8', // Subtle bright white point
      '#38bdf8', // Distant blue point
      '#fef08a', // Distant warm yellow point
    ];

    for (let i = 0; i < count; i++) {
      // Randomize parallax depth (0.02 = very far away, 0.08 = slightly nearer background)
      const depth = baseParallax * (0.5 + Math.random() * 0.8);
      const color = starPalette[Math.floor(Math.random() * starPalette.length)];

      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        color,
        parallaxFactor: depth,
      });
    }
  }

  /**
   * Resets the cached parallax offset back to world origin (0, 0).
   */
  public resetOffset(): void {
    this.lastParallaxOffset = new Vector2(0, 0);
  }

  /**
   * Toggles the stationary star lock behavior on/off when following a target body.
   * If true: stars remain frozen on screen when tracking an orbiting planet.
   * If false: stars exhibit parallax motion along with the target.
   * 
   * @returns The updated boolean state of lockOnFollow
   */
  public toggleLockOnFollow(): boolean {
    this.lockOnFollow = !this.lockOnFollow;
    return this.lockOnFollow;
  }

  /**
   * Renders the background stars onto the low-resolution pixel buffer.
   * Implements seamless toroidal wrapping (modulo arithmetic) so stars wrap
   * infinitely as the camera pans in any direction.
   * 
   * When the camera is locked onto a target celestial body and `lockOnFollow` is true,
   * the background stars stay locked at their last position, preventing unwanted orbital drift.
   * If `lockOnFollow` is false, background stars drift according to the target body's motion.
   * 
   * @param renderer The active CanvasRenderer
   * @param camera The active Camera providing pan offset
   */
  public render(renderer: CanvasRenderer, camera?: Camera): void {
    let camX = 0;
    let camY = 0;

    if (camera) {
      if (camera.isFollowing && this.lockOnFollow) {
        // Locked onto an orbiting body with lockOnFollow enabled:
        // Freeze parallax displacement so background stars remain stationary!
        camX = this.lastParallaxOffset.x;
        camY = this.lastParallaxOffset.y;
      } else {
        // Free panning mode OR user wants background stars to move during follow:
        camX = camera.position.x;
        camY = camera.position.y;
        this.lastParallaxOffset = new Vector2(camX, camY);
      }
    }

    for (const star of this.stars) {
      // 1. Calculate parallax displacement
      const shiftX = camX * star.parallaxFactor;
      const shiftY = camY * star.parallaxFactor;

      // 2. Modulo wrapping ensures stars wrap around screen bounds seamlessly
      let sx = (star.x - shiftX) % this.width;
      let sy = (star.y - shiftY) % this.height;

      // Handle negative modulo results in JavaScript
      if (sx < 0) sx += this.width;
      if (sy < 0) sy += this.height;

      // 3. Draw single 1x1 background pixel
      renderer.drawPixel(Math.floor(sx), Math.floor(sy), star.color);
    }
  }
}

