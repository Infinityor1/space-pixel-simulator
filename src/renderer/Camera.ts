/**
 * Camera.ts
 * 
 * Viewport and coordinate transformation manager for the Pixel Galaxy Simulator.
 * 
 * EDUCATIONAL CONCEPT: "World Space vs. Screen Space"
 * ---------------------------------------------------
 * In physics simulations and games, we work with two distinct coordinate systems:
 * 
 * 1. World Space (Continuous Physics Units):
 *    - An infinite 2D plane where Newton's laws operate.
 *    - The center of the galaxy (e.g. Sagittarius A*) naturally sits at (0, 0).
 *    - Positions are floating-point numbers: (x: -142.85, y: 76.12).
 * 
 * 2. Screen Space (Discrete Pixels):
 *    - The physical drawing buffer of the HTML5 Canvas (e.g. 320 x 180).
 *    - The origin (0, 0) is the TOP-LEFT corner of the screen.
 *    - Coordinates are positive integers: (x: 160, y: 90) is the center of the screen.
 * 
 * THE CAMERA'S ROLE:
 * The Camera acts as the bridge between these two spaces:
 * - It projects world coordinates onto the screen buffer.
 * - It supports panning (moving the camera focus) and zooming.
 * - It performs "Viewport Culling": ignoring any stars positioned outside
 *   the visible screen boundaries, saving precious rendering cycles.
 */

import { Vector2 } from '../physics/Vector2';
import type { CelestialBody } from '../entities/CelestialBody';

export interface CameraOptions {
  /** Initial camera focus position in world space (default: (0, 0)) */
  position?: Vector2;

  /** Initial magnification factor (default: 1.0) */
  zoom?: number;

  /** Internal simulation buffer width in pixels (default: 320) */
  viewportWidth?: number;

  /** Internal simulation buffer height in pixels (default: 180) */
  viewportHeight?: number;

  /** Optional target body to track immediately */
  target?: CelestialBody | null;
}

export class Camera {
  /** The point in world space that the camera is currently looking at */
  public position: Vector2;

  /** Zoom magnification level (1.0 = standard 1:1 scale, 2.0 = 2x zoomed in, 0.5 = 2x zoomed out) */
  public zoom: number;

  /** Width of the target render buffer in logical pixels */
  public viewportWidth: number;

  /** Height of the target render buffer in logical pixels */
  public viewportHeight: number;

  /** Optional celestial body being followed continuously */
  public target: CelestialBody | null = null;

  /** Minimum allowable zoom to prevent dividing by zero or inversion */
  public static readonly MIN_ZOOM = 0.05;

  /** Maximum allowable zoom */
  public static readonly MAX_ZOOM = 50.0;

  /**
   * Constructs a new Camera instance.
   * 
   * NOTE: We declare class fields explicitly to adhere to `"erasableSyntaxOnly": true`.
   */
  constructor(options: CameraOptions = {}) {
    this.position = options.position ?? new Vector2(0, 0);
    this.zoom = options.zoom ?? 1.0;
    this.viewportWidth = options.viewportWidth ?? 320;
    this.viewportHeight = options.viewportHeight ?? 180;
    this.target = options.target ?? null;
  }

  /**
   * Transforms a continuous world space coordinate into screen buffer pixel space.
   * 
   * MATHEMATICAL FORMULA:
   * ScreenX = (WorldX - CameraX) * Zoom + (ViewportWidth / 2)
   * ScreenY = (WorldY - CameraY) * Zoom + (ViewportHeight / 2)
   * 
   * When World == Camera, Screen lands exactly at the center: (width/2, height/2).
   * 
   * @param worldPos 2D coordinates in continuous world space
   * @returns 2D pixel coordinates on the canvas screen buffer
   */
  public worldToScreen(worldPos: Vector2): Vector2 {
    const screenX = (worldPos.x - this.position.x) * this.zoom + this.viewportWidth / 2;
    const screenY = (worldPos.y - this.position.y) * this.zoom + this.viewportHeight / 2;
    return new Vector2(screenX, screenY);
  }

  /**
   * Transforms a screen buffer pixel coordinate back into continuous world space.
   * Essential for mouse clicks, dragging, or selecting celestial bodies.
   * 
   * MATHEMATICAL INVERSE FORMULA:
   * WorldX = (ScreenX - ViewportWidth / 2) / Zoom + CameraX
   * WorldY = (ScreenY - ViewportHeight / 2) / Zoom + CameraY
   * 
   * @param screenPos 2D pixel coordinates on the canvas screen buffer
   * @returns 2D coordinates in continuous world space
   */
  public screenToWorld(screenPos: Vector2): Vector2 {
    const worldX = (screenPos.x - this.viewportWidth / 2) / this.zoom + this.position.x;
    const worldY = (screenPos.y - this.viewportHeight / 2) / this.zoom + this.position.y;
    return new Vector2(worldX, worldY);
  }

  /**
   * Tests whether a celestial body is within the visible screen buffer.
   * 
   * EDUCATIONAL CONCEPT: "Viewport Culling (Bounding Box Check)"
   * -------------------------------------------------------------
   * Drawing pixels is one of the most expensive operations in graphics.
   * If a galaxy has 5,000 stars, but only 200 are currently visible on screen,
   * drawing all 5,000 would cause severe lag.
   * 
   * This method checks if the body's boundary touches the viewport. If not,
   * we skip rendering it entirely!
   * 
   * @param worldPos Position of the body in world space
   * @param radius Physical/visual radius of the body (in world units)
   * @param margin Extra margin in pixels (useful to account for glowing halos)
   * @returns True if any part of the body is visible on screen
   */
  public isVisible(worldPos: Vector2, radius: number = 0, margin: number = 2): boolean {
    const screenPos = this.worldToScreen(worldPos);
    const screenRadius = radius * this.zoom;
    const totalPadding = screenRadius + margin;

    // Reject if completely to the left, right, top, or bottom of screen
    if (screenPos.x + totalPadding < 0) return false;
    if (screenPos.x - totalPadding > this.viewportWidth) return false;
    if (screenPos.y + totalPadding < 0) return false;
    if (screenPos.y - totalPadding > this.viewportHeight) return false;

    return true;
  }

  /**
   * Targets a celestial body to track continuously.
   * As the body orbits or moves, the camera automatically tracks its position.
   * 
   * @param target The CelestialBody to follow
   */
  public follow(target: CelestialBody): void {
    this.target = target;
    this.position = target.position.clone();
  }

  /**
   * Releases the tracked target, returning the camera to manual free-pan mode.
   */
  public unfollow(): void {
    this.target = null;
  }

  /**
   * Returns true if the camera is currently locked onto an active target.
   */
  public get isFollowing(): boolean {
    return this.target !== null;
  }

  /**
   * Updates the camera position to match the tracked target's position.
   * Called once per frame in the main animation loop.
   */
  public update(): void {
    if (this.target) {
      this.position = this.target.position.clone();
    }
  }

  /**
   * Shifts the camera's focus in world space.
   * Manually panning immediately disengages any active target lock.
   * 
   * @param delta Offset vector to add to camera position
   */
  public pan(delta: Vector2): void {
    this.unfollow();
    this.position = this.position.add(delta);
  }

  /**
   * Sets the camera zoom level, clamped between safe minimum and maximum bounds.
   * 
   * @param newZoom Desired magnification factor
   */
  public setZoom(newZoom: number): void {
    this.zoom = Math.max(Camera.MIN_ZOOM, Math.min(Camera.MAX_ZOOM, newZoom));
  }

  /**
   * Multiplies current zoom by a scaling factor (e.g. 1.1 to zoom in, 0.9 to zoom out).
   * 
   * @param factor Multiplier applied to current zoom
   */
  public zoomBy(factor: number): void {
    this.setZoom(this.zoom * factor);
  }

  /**
   * Resets the camera back to world origin (0, 0), default 1.0 zoom, and clears target lock.
   */
  public reset(): void {
    this.unfollow();
    this.position = new Vector2(0, 0);
    this.zoom = 1.0;
  }
}

