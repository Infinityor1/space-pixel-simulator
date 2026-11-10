/**
 * CanvasRenderer.ts
 * 
 * Manages the low-resolution HTML5 Canvas for retro pixel-art rendering.
 * 
 * CORE CONCEPT: "Internal Resolution vs. Display Resolution"
 * - In retro pixel games and simulations, we don't draw directly at 1080p or 4K.
 * - Instead, we draw onto a small internal buffer (e.g., 320x180 or 480x270).
 * - Then, we stretch the canvas across the screen using CSS with `image-rendering: pixelated`.
 * - This creates large, crisp, authentic "crunchy" pixels without needing to simulate
 *   millions of individual screen pixels.
 */

import type { Camera } from './Camera';
import type { Universe } from '../simulation/Universe';
import type { CelestialBody } from '../entities/CelestialBody';

export interface RendererOptions {
  /** Internal logical width in simulation pixels (default: 320) */
  width?: number;
  /** Internal logical height in simulation pixels (default: 180) */
  height?: number;
}

export class CanvasRenderer {
  // The actual HTML <canvas> element
  public readonly canvas: HTMLCanvasElement;
  
  // The 2D rendering context used for drawing commands
  private readonly ctx: CanvasRenderingContext2D;

  // The internal simulation resolution
  public readonly width: number;
  public readonly height: number;

  constructor(options: RendererOptions = {}) {
    // Default to a 16:9 widescreen retro resolution (320 x 180)
    this.width = options.width ?? 320;
    this.height = options.height ?? 180;

    // 1. Create the canvas element programmatically
    this.canvas = document.createElement('canvas');

    // 2. Set the INTERNAL canvas buffer size (logical simulation pixels)
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // 3. Add a CSS class for styling and pixel scaling
    this.canvas.className = 'pixel-canvas';

    // 4. Obtain the 2D drawing context
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to acquire 2D rendering context from canvas.');
    }
    this.ctx = context;

    // 5. CRITICAL FOR PIXEL ART: Disable bilinear interpolation (smoothing).
    // By default, browsers blur scaled images. Setting this to false preserves sharp square pixels.
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * Clears the entire canvas buffer with a background color.
   * 
   * @param color The CSS color string (default is deep space black #08080c)
   */
  public clear(color: string = '#08080c'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draws a single pixel at the given simulation coordinates.
   * In Canvas 2D, a "pixel" is drawn as a 1x1 rectangle.
   * 
   * @param x X coordinate (0 to width - 1)
   * @param y Y coordinate (0 to height - 1)
   * @param color CSS color string (e.g., '#ffffff')
   */
  public drawPixel(x: number, y: number, color: string): void {
    // Math.floor ensures we land exactly on integer pixel coordinates
    const px = Math.floor(x);
    const py = Math.floor(y);

    // Skip drawing if the pixel is outside the visible screen buffer
    if (px < 0 || px >= this.width || py < 0 || py >= this.height) {
      return;
    }

    this.ctx.fillStyle = color;
    this.ctx.fillRect(px, py, 1, 1);
  }

  /**
   * Draws a small pixel cluster (e.g., a glowing 3x3 or plus-shaped star).
   * 
   * @param x Center X coordinate
   * @param y Center Y coordinate
   * @param coreColor Bright center color
   * @param haloColor Dimmer outer halo color
   */
  public drawStarPoint(x: number, y: number, coreColor: string, haloColor?: string): void {
    const px = Math.floor(x);
    const py = Math.floor(y);

    // If an outer halo color is provided, draw a subtle 1-pixel cross around the core
    if (haloColor) {
      this.drawPixel(px - 1, py, haloColor);
      this.drawPixel(px + 1, py, haloColor);
      this.drawPixel(px, py - 1, haloColor);
      this.drawPixel(px, py + 1, haloColor);
    }

    // Draw the bright center core
    this.drawPixel(px, py, coreColor);
  }

  /**
   * Draws a filled rasterized pixel disk/circle on the low-resolution buffer.
   * 
   * @param x Center X coordinate
   * @param y Center Y coordinate
   * @param radius Radius in screen pixels
   * @param color CSS color string
   */
  public drawCircle(x: number, y: number, radius: number, color: string): void {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    const r = Math.round(radius);

    if (r <= 0) {
      this.drawPixel(cx, cy, color);
      return;
    }

    const rSquared = r * r;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= rSquared) {
          this.drawPixel(cx + dx, cy + dy, color);
        }
      }
    }
  }

  /**
   * Draws a 4-point star spike halo around a celestial body.
   * 
   * @param x Center X coordinate
   * @param y Center Y coordinate
   * @param offset Distance from center in screen pixels
   * @param color Corona or halo color string
   */
  public drawCrossHalo(x: number, y: number, offset: number, color: string): void {
    const px = Math.floor(x);
    const py = Math.floor(y);
    const d = Math.max(1, Math.round(offset));

    this.drawPixel(px - d, py, color);
    this.drawPixel(px + d, py, color);
    this.drawPixel(px, py - d, color);
    this.drawPixel(px, py + d, color);
  }

  /**
   * Renders a single CelestialBody by projecting it through the Camera.
   * 
   * EDUCATIONAL CONCEPT: "Perceptual Zoom Scaling & Screen-Space Clamping"
   * ----------------------------------------------------------------------
   * In a retro 2D pixel space simulation, drawing celestial bodies under camera zoom
   * presents a classic graphics dilemma:
   * 1. Pure Linear Scaling (r * zoom):
   *    When zooming out (e.g. zoom = 0.25x), realistic planetary radii (1 to 2 world units)
   *    shrink to fractional pixels (0.25 to 0.5px). Clamping with Math.max(1, ...)
   *    causes every single star and planet to immediately collapse into identical
   *    1-pixel dots, losing all sense of scale and hierarchy!
   * 2. Sub-Linear Zoom Scaling (r * zoom^0.8):
   *    By raising zoom to a power slightly less than 1.0 (0.8), celestial bodies
   *    shrink smoothly when zooming out without instantly flattening into 1-pixel specks,
   *    and enlarge elegantly when zooming in without ballooning uncontrollably.
   * 
   * @param body The celestial body to draw
   * @param camera The active Camera transforming world space to screen buffer
   */
  public renderBody(body: CelestialBody, camera: Camera): void {
    const screenPos = camera.worldToScreen(body.position);

    // Apply sub-linear zoom scaling so bodies remain distinct and visible across zoom levels
    const zoomScale = Math.pow(camera.zoom, 0.8);
    const screenRadius = Math.max(1, Math.round(body.radius * zoomScale));

    // 1. Draw outer halo / corona spikes if specified
    if (body.haloColor) {
      if (screenRadius <= 1) {
        this.drawStarPoint(screenPos.x, screenPos.y, body.color, body.haloColor);
        return;
      }
      // Offset halo cross dynamically based on the rendered screen disk radius
      const haloOffset = Math.max(2, screenRadius + 1);
      this.drawCrossHalo(screenPos.x, screenPos.y, haloOffset, body.haloColor);
    }

    // 2. Draw core physical disk
    if (screenRadius <= 1) {
      this.drawPixel(screenPos.x, screenPos.y, body.color);
    } else {
      this.drawCircle(screenPos.x, screenPos.y, screenRadius, body.color);
    }
  }

  /**
   * Renders the entire Universe through the Camera onto the canvas.
   * Automatically executes viewport culling to prune invisible off-screen bodies.
   * 
   * @param universe The universe container holding active celestial bodies
   * @param camera The active Camera managing viewport offset and zoom
   */
  public renderUniverse(universe: Universe, camera: Camera): void {
    for (const body of universe.getBodies()) {
      // Viewport Culling: Skip bodies that lie completely outside the screen
      if (!camera.isVisible(body.position, body.radius, 3)) {
        continue;
      }
      this.renderBody(body, camera);
    }
  }
}
