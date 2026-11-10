/**
 * ParticleEmitter.ts
 * 
 * Manages dynamic pixel emissions and trailing stardust for celestial bodies.
 * 
 * EDUCATIONAL CONCEPT: "Particle Systems in Game & Simulation Engines"
 * --------------------------------------------------------------------
 * A Particle System is a graphics technique where hundreds of tiny, simple visual
 * elements ("particles") are spawned, animated, and destroyed over time to simulate
 * fuzzy, organic phenomena like fire, smoke, sparks, and cosmic dust.
 * 
 * FOR CELESTIAL BODIES:
 * 1. Stationary / Slow Bodies (e.g. Sun):
 *    - Radiates glowing coronal sparks that puff outward and fade, giving the star
 *      a living, pulsating aura.
 * 2. Moving Bodies (e.g. Orbiting Planets):
 *    - As a planet travels along its orbit, the emitted particles linger in space
 *      behind it. This naturally produces a gorgeous curved "trail" or wake that
 *      traces the planet's gravitational trajectory!
 * 3. Retro Palette Aging (Stardust Fading):
 *    - When newly born: High-energy color (e.g. golden yellow or cyan).
 *    - As particle ages (life < 40%): Shifts to a cooler, dimmer ember color.
 *    - When life reaches 0: Particle is recycled.
 */

import { Vector2 } from '../physics/Vector2';
import type { CelestialBody } from '../entities/CelestialBody';
import type { Camera } from './Camera';
import type { CanvasRenderer } from './CanvasRenderer';

export interface TrailParticle {
  /** Current position in continuous 2D world space */
  position: Vector2;

  /** Velocity vector for drift/puff */
  velocity: Vector2;

  /** Bright core birth color */
  coreColor: string;

  /** Dimmer aged color when particle is cooling */
  fadeColor: string;

  /** Remaining lifetime in seconds */
  life: number;

  /** Initial total lifetime in seconds */
  maxLife: number;
}

export interface ParticleEmitterOptions {
  /** Maximum number of simultaneous active particles (default: 300) */
  maxParticles?: number;

  /** Seconds between emissions (default: 0.035s => ~28 spawns per second) */
  emissionInterval?: number;
}

export class ParticleEmitter {
  /** Active particles currently alive in the world */
  public readonly particles: TrailParticle[] = [];

  /** Maximum cap to ensure 60 FPS performance */
  public readonly maxParticles: number;

  /** Interval in seconds between particle spawn batches */
  public readonly emissionInterval: number;

  /** Timer accumulator for spawn intervals */
  private timer: number = 0;

  constructor(options: ParticleEmitterOptions = {}) {
    this.maxParticles = options.maxParticles ?? 300;
    this.emissionInterval = options.emissionInterval ?? 0.035;
  }

  /**
   * Returns a dim, cooling color appropriate for the given primary color.
   * Emulates retro palette cooling without requiring heavy alpha-blending math.
   * 
   * @param color The primary hex color
   */
  private getFadeColor(color: string): string {
    // If it's a gold/orange/yellow star -> dim amber/rust
    if (color.includes('fd') || color.includes('ea') || color.includes('fc')) {
      return '#78350f'; // Dark amber
    }
    // If it's a blue/cyan star -> dim navy/slate
    if (color.includes('67') || color.includes('38') || color.includes('94')) {
      return '#1e293b'; // Dark slate blue
    }
    // If it's red -> deep maroon
    if (color.includes('f8') || color.includes('ef')) {
      return '#450a0a'; // Deep maroon
    }
    // Default faint cosmic dust
    return '#334155';
  }

  /**
   * Advances particle lifetimes and spawns new trail embers from active bodies.
   * 
   * EDUCATIONAL CONCEPT: "Zoom-Adaptive Particle Emission"
   * -----------------------------------------------------
   * When zooming in and out in a physics simulation, graphics elements can easily
   * fall out of visual balance:
   * 1. Screen-Space Clumping (The Zoom-Out Problem):
   *    If particles emit at a fixed rate (e.g. 28/sec) and live for 1 second, zooming out
   *    squeezes that entire 1-second trail into just 2 or 3 screen pixels. Hundreds of particles
   *    overlap into a blazing, dense blob that drowns out the tiny 1-pixel celestial body.
   * 2. Perceptual Clearance:
   *    When a body shrinks on screen, it is clamped to a minimum of 1 pixel. If particles
   *    were placed using fixed world units, they would spawn INSIDE that 1-pixel screen disk!
   *    By converting the body's actual rendered screen radius back to world space, we guarantee
   *    particles always spawn strictly outside the planet disk at any zoom factor.
   * 3. Proportional Lifetimes & Rates:
   *    Scaling emission intervals and lifetimes with `zoom` keeps the particle density on
   *    screen constant, providing a graceful, balanced stardust trail across all magnifications.
   * 
   * @param bodies List of celestial bodies emitting particles
   * @param dt Elapsed delta time in seconds
   * @param zoom Current camera magnification factor (defaults to 1.0)
   */
  public update(bodies: readonly CelestialBody[], dt: number, zoom: number = 1.0): void {
    // 1. Advance and prune existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        // Fast array deletion by swapping with last element
        const last = this.particles.pop()!;
        if (i < this.particles.length) {
          this.particles[i] = last;
        }
        continue;
      }

      // Kinematic drift: r_new = r_old + v * dt
      p.position = p.position.add(p.velocity.scale(dt));
    }

    // 2. Zoom-dependent emission rate scaling:
    // When zoomed out (zoom < 1.0), increase interval (emit less frequently)
    // to prevent dozens of particles from clumping into a tiny screen area.
    const clampedZoom = Math.max(0.05, Math.min(5.0, zoom));
    const intervalScaling = Math.pow(clampedZoom, 0.7);
    const effectiveInterval = this.emissionInterval / intervalScaling;

    this.timer += dt;
    if (this.timer < effectiveInterval) {
      return;
    }
    this.timer = 0;

    // 3. Emit particles strictly outside each celestial body's perimeter,
    // taking into account the camera zoom and rendered screen radius.
    for (const body of bodies) {
      if (this.particles.length >= this.maxParticles) {
        break;
      }

      const speed = body.velocity.magnitude();
      let angle: number;

      // Calculate the rendered visual radius in world units at current zoom.
      // Since screenRadius = Math.max(1, Math.round(body.radius * zoom^0.8)),
      // the visual radius in world units is screenRadius / zoom.
      const zoomScale = Math.pow(clampedZoom, 0.8);
      const screenRadius = Math.max(1, Math.round(body.radius * zoomScale));
      const visualRadiusWorld = screenRadius / clampedZoom;

      // Clearance in world units: guaranteed at least 1.0 screen pixel outside the body disk
      const clearancePixels = 1.0 + Math.random() * 0.8;
      const clearanceWorld = clearancePixels / clampedZoom;
      const spawnDistance = visualRadiusWorld + clearanceWorld;

      if (speed < 0.1) {
        // Stationary body (e.g. Sun): Radiate outward in all 360 degrees
        angle = Math.random() * 2 * Math.PI;
      } else {
        // Moving body (e.g. Planet): Emit from the trailing rear hemisphere
        // Opposite to velocity vector (-v direction) with a 120-degree rear cone
        const velocityAngle = Math.atan2(body.velocity.y, body.velocity.x);
        const rearAngle = velocityAngle + Math.PI;
        const spread = (Math.random() - 0.5) * (Math.PI * 0.65); // ~117 degree spread
        angle = rearAngle + spread;
      }

      // Unit vector pointing from body center towards spawn location
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      // Spawn location strictly outside the physical/visual radius
      const spawnOffset = new Vector2(dirX * spawnDistance, dirY * spawnDistance);
      const spawnPosition = body.position.add(spawnOffset);

      // Radial outward puff velocity (scaled so particles visibly drift away in screen space)
      const puffSpeed = (1.0 + Math.random() * 2.0) / Math.sqrt(clampedZoom);
      const outwardPuff = new Vector2(dirX * puffSpeed, dirY * puffSpeed);

      // Trailing inertia: particles inherit slight backward drift relative to body motion
      const trailDrift = speed >= 0.1 ? body.velocity.scale(-0.1) : new Vector2(0, 0);
      const particleVelocity = outwardPuff.add(trailDrift);

      const color = body.haloColor ?? body.color;
      const fadeColor = this.getFadeColor(color);

      // Scale lifetime with zoom so trails don't stretch across the entire zoomed-out system
      const lifeScale = Math.min(1.0, Math.max(0.35, Math.pow(clampedZoom, 0.6)));
      const lifetime = (0.5 + Math.random() * 0.5) * lifeScale;

      this.particles.push({
        position: spawnPosition,
        velocity: particleVelocity,
        coreColor: color,
        fadeColor,
        life: lifetime,
        maxLife: lifetime,
      });
    }
  }

  /**
   * Renders active particles onto the canvas buffer through the camera.
   * When zoomed in significantly (zoom >= 3.0), draws slightly larger 2x2 embers
   * so particles remain visible relative to enlarged celestial bodies.
   * 
   * @param renderer The target CanvasRenderer
   * @param camera The active Camera transforming world space to screen buffer
   */
  public render(renderer: CanvasRenderer, camera: Camera): void {
    const drawSize = camera.zoom >= 3.0 ? 2 : 1;

    for (const p of this.particles) {
      // Viewport Culling: Skip particles off-screen
      if (!camera.isVisible(p.position, 0, 1)) {
        continue;
      }

      const screenPos = camera.worldToScreen(p.position);
      // Color aging: shift to dimmer fadeColor when particle has less than 35% life remaining
      const color = (p.life / p.maxLife > 0.35) ? p.coreColor : p.fadeColor;

      if (drawSize > 1) {
        renderer.drawCircle(screenPos.x, screenPos.y, 1, color);
      } else {
        renderer.drawPixel(Math.floor(screenPos.x), Math.floor(screenPos.y), color);
      }
    }
  }

  /**
   * Clears all active particles.
   */
  public clear(): void {
    this.particles.length = 0;
  }
}

