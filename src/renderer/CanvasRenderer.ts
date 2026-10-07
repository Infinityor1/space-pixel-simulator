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
}
