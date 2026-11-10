/**
 * main.ts
 * 
 * Entry point for the Pixel Galaxy Simulator.
 * 
 * STEP 9: Gravitational Physics in Action (F = G * m1 * m2 / r^2)
 * ---------------------------------------------------------------
 * Features demonstrated:
 * 1. Newtonian Gravitational Attraction: Bodies exert mutual gravitational pull.
 * 2. Keplerian Orbital Velocity:
 *    v_orbit = sqrt(G * M / r)
 *    Planets are launched with the exact tangential velocity required to enter
 *    stable circular orbits around the central Sun!
 * 3. 60 FPS requestAnimationFrame Simulation Loop:
 *    Real-time physical integration with play/pause and gravity toggling.
 * 4. Interactive Camera: Click-and-drag panning and scroll-wheel zooming.
 */

import './style.css';
import { Vector2 } from './physics/Vector2';
import { Camera } from './renderer/Camera';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { Universe } from './simulation/Universe';
import { Starfield } from './renderer/Starfield';
import { ParticleEmitter } from './renderer/ParticleEmitter';
import {
  ALL_SCENARIOS,
  keplerianSystemScenario,
  SCENARIO_G,
} from './scenarios/presetScenarios';
import type { Scenario } from './scenarios/types';

// 1. Locate root container in index.html
const appElement = document.querySelector<HTMLDivElement>('#app');
if (!appElement) {
  throw new Error('Could not find #app element in DOM.');
}

// 2. Build modern, interactive retro simulator layout with controls
appElement.innerHTML = `
  <header style="padding: 10px; text-align: center; color: #f3f4f6;">
    <h2 style="margin: 0; font-size: 1.4rem; letter-spacing: 1px;">Pixel Galaxy Simulator 🌌</h2>
    <div id="hud" style="margin-top: 6px; font-family: ui-monospace, monospace; font-size: 0.8rem; color: #9ca3af;">
      Initializing gravitational field...
    </div>

    <!-- Interactive Examples & Scenarios Selection Bar -->
    <div style="margin-top: 8px; display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap;">
      <span style="font-size: 0.8rem; font-weight: 600; color: #cbd5e1;">Examples:</span>
      <div id="scenario-tabs" style="display: inline-flex; gap: 6px; background: #111827; padding: 3px; border-radius: 6px; border: 1px solid #374151; flex-wrap: wrap;">
        <!-- Injected dynamically from ALL_SCENARIOS -->
      </div>
    </div>
    <div id="scenario-desc" style="margin-top: 5px; font-size: 0.75rem; color: #94a3b8; font-style: italic; min-height: 1.2rem;">
      Loading scenario description...
    </div>

    <div style="margin-top: 8px; display: flex; gap: 6px; justify-content: center; align-items: center; flex-wrap: wrap;">
      <button id="btn-play-pause" style="background: #2563eb; color: #ffffff; border: 1px solid #3b82f6; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-weight: 500;">Pause ⏸</button>
      <button id="btn-gravity" style="background: #059669; color: #ffffff; border: 1px solid #10b981; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-weight: 500;">Gravity: ON</button>
      <button id="btn-stars-mode" style="background: #1f2937; color: #f3f4f6; border: 1px solid #374151; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-weight: 500;" title="Toggle whether background stars move when camera follows a body">Stars on Follow: Static 🔒</button>
      
      <span style="margin: 0 4px; color: #6b7280;">|</span>
      <span style="font-size: 0.8rem; color: #9ca3af;">Time Speed:</span>
      <button class="btn-speed" data-speed="0.25" style="background: #1f2937; color: #f3f4f6; border: 1px solid #374151; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">0.25x</button>
      <button class="btn-speed" data-speed="0.5" style="background: #1f2937; color: #f3f4f6; border: 1px solid #374151; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">0.5x</button>
      <button class="btn-speed active-speed" data-speed="1.0" style="background: #374151; color: #60a5fa; border: 1px solid #60a5fa; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold;">1.0x</button>
      <button class="btn-speed" data-speed="2.0" style="background: #1f2937; color: #f3f4f6; border: 1px solid #374151; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">2.0x</button>
      <button class="btn-speed" data-speed="5.0" style="background: #1f2937; color: #f3f4f6; border: 1px solid #374151; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">5.0x</button>

      <span style="margin: 0 4px; color: #6b7280;">|</span>
      <button id="btn-zoom-in" style="background: #1f2937; color: #f3f4f6; border: 1px solid #374151; padding: 4px 10px; border-radius: 4px; cursor: pointer;">Zoom In (+)</button>
      <button id="btn-zoom-out" style="background: #1f2937; color: #f3f4f6; border: 1px solid #374151; padding: 4px 10px; border-radius: 4px; cursor: pointer;">Zoom Out (-)</button>
      <button id="btn-reset" style="background: #1f2937; color: #f3f4f6; border: 1px solid #374151; padding: 4px 10px; border-radius: 4px; cursor: pointer;">Reset View</button>
    </div>
  </header>
  <div id="galaxy" style="position: relative; width: 80vw; max-width: 960px; aspect-ratio: 16/9; margin: 0 auto; border: 1px solid #27272a; border-radius: 6px; overflow: hidden; background: #08080c;">
  </div>
  <footer style="padding: 6px; font-size: 0.75rem; color: #71717a; text-align: center;">
    Tip: Click any celestial body to follow it • Drag to free-pan • Scroll wheel to zoom • Toggle "Stars on Follow" for static/moving background
  </footer>
`;

const galaxyDiv = document.querySelector<HTMLDivElement>('#galaxy');
const hudDiv = document.querySelector<HTMLDivElement>('#hud');
const btnPlayPause = document.querySelector<HTMLButtonElement>('#btn-play-pause');
const btnGravity = document.querySelector<HTMLButtonElement>('#btn-gravity');
const btnStarsMode = document.querySelector<HTMLButtonElement>('#btn-stars-mode');

if (!galaxyDiv || !hudDiv || !btnPlayPause || !btnGravity || !btnStarsMode) {
  throw new Error('Could not find UI elements in DOM.');
}

// 3. Initialize low-resolution retro buffer (320x180)
const renderer = new CanvasRenderer({ width: 320, height: 180 });
galaxyDiv.appendChild(renderer.canvas);

// 4. Initialize Camera (centered at world 0, 0)
const camera = new Camera({
  viewportWidth: 320,
  viewportHeight: 180,
  zoom: 1.0,
});

// 5. Initialize aesthetic background starfield (non-interactive distant stars)
const starfield = new Starfield({
  width: 320,
  height: 180,
  count: 75,
  baseParallax: 0.04,
});

// 6. Initialize dynamic particle emitter (stardust aura and orbital trails)
const particleEmitter = new ParticleEmitter({
  maxParticles: 350,
  emissionInterval: 0.035,
});

// ---------------------------------------------------------------------------
// 7. Universe & Scenario Management
// ---------------------------------------------------------------------------
const universe = new Universe({
  gravityEnabled: true,
  G: SCENARIO_G,
});

let currentScenario: Scenario = keplerianSystemScenario;

// Switches simulation scenarios dynamically without browser reloads
function loadScenario(scenario: Scenario): void {
  currentScenario = scenario;
  // Clear lingering particles and camera follow lock when switching systems
  particleEmitter.clear();
  starfield.resetOffset();
  camera.unfollow();
  scenario.setup(universe, camera);

  // Update button active states
  document.querySelectorAll<HTMLButtonElement>('.scenario-tab-btn').forEach((btn) => {
    const isCurrent = btn.dataset.scenarioId === scenario.id;
    btn.classList.toggle('active', isCurrent);
  });

  // Update description header
  const descEl = document.querySelector<HTMLDivElement>('#scenario-desc');
  if (descEl) {
    descEl.textContent = scenario.description;
  }

  updateHUD();
}

// Build Scenario Navigation Tabs
const scenarioTabsContainer = document.querySelector<HTMLDivElement>('#scenario-tabs');
if (scenarioTabsContainer) {
  for (const scenario of ALL_SCENARIOS) {
    const tabBtn = document.createElement('button');
    tabBtn.className = `scenario-tab-btn ${scenario.id === currentScenario.id ? 'active' : ''}`;
    tabBtn.dataset.scenarioId = scenario.id;
    tabBtn.textContent = scenario.name;
    tabBtn.title = scenario.description;
    tabBtn.addEventListener('click', () => {
      loadScenario(scenario);
    });
    scenarioTabsContainer.appendChild(tabBtn);
  }
}

// ---------------------------------------------------------------------------
// 6. HUD and Render Pipeline
// ---------------------------------------------------------------------------

let isRunning = true;
let currentEffectiveDt = 0;

function updateHUD(): void {
  if (!hudDiv) return;
  const effectiveMs = (currentEffectiveDt * 1000).toFixed(1);
  const targetLabel = camera.target ? `${camera.target.name} 🎯` : 'Free Pan 🔭';
  const starsLabel = starfield.lockOnFollow ? 'Static 🔒' : 'Moving 🌌';

  hudDiv.innerHTML = `
    <span>Status: <strong>${isRunning ? 'Active 🟢' : 'Paused ⏸'}</strong></span> | 
    <span>Bodies: <strong>${universe.bodyCount}</strong></span> | 
    <span>Tracking: <strong>${targetLabel}</strong></span> | 
    <span>Stars on Follow: <strong>${starsLabel}</strong></span> | 
    <span>Speed: <strong>${universe.timeScale.toFixed(2)}x (Δt ≈ ${effectiveMs}ms)</strong></span> | 
    <span>Gravity: <strong>${universe.gravityEnabled ? 'ON' : 'OFF'}</strong></span> | 
    <span>Zoom: <strong>${camera.zoom.toFixed(2)}x</strong></span>
  `;
}

// Seed initial default scenario (safe to call after updateHUD & state variables are defined)
loadScenario(keplerianSystemScenario);


function render(): void {
  // 1. Clear buffer with deep space black
  renderer.clear('#08080c');

  // 2. Render distant non-interactive background stars (with subtle camera parallax)
  starfield.render(renderer, camera);

  // 3. Render dynamic pixel trails and stardust aura (behind main body disks)
  particleEmitter.render(renderer, camera);

  // 4. Render dynamic celestial bodies (foreground disks and halos)
  renderer.renderUniverse(universe, camera);

  // 5. Update HUD telemetry
  updateHUD();
}

// ---------------------------------------------------------------------------
// 8. Real-Time 60 FPS Physics Simulation Loop
// ---------------------------------------------------------------------------
let lastTimestamp = performance.now();

function simulationLoop(currentTimestamp: number): void {
  // Delta time in seconds, clamped to maximum 0.05s (prevents teleportation when switching tabs)
  const rawDt = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = currentTimestamp;
  currentEffectiveDt = isRunning ? rawDt * universe.timeScale : 0;

  if (isRunning) {
    universe.step(rawDt);
  }

  // Update camera position if tracking an active body
  camera.update();

  // Update stardust particles and trails with active camera zoom scaling
  particleEmitter.update(universe.getBodies(), isRunning ? rawDt * universe.timeScale : 0, camera.zoom);

  render();
  requestAnimationFrame(simulationLoop);
}

// Start the animation loop
requestAnimationFrame(simulationLoop);

// ---------------------------------------------------------------------------
// 8. Interactive Viewport & Simulation Controls
// ---------------------------------------------------------------------------

// Time Speed Multipliers (Customizing dt)
document.querySelectorAll<HTMLButtonElement>('.btn-speed').forEach((btn) => {
  btn.addEventListener('click', () => {
    const speed = parseFloat(btn.dataset.speed ?? '1.0');
    universe.setTimeScale(speed);

    // Update active highlight style
    document.querySelectorAll<HTMLButtonElement>('.btn-speed').forEach((b) => {
      b.style.background = '#1f2937';
      b.style.borderColor = '#374151';
      b.style.color = '#f3f4f6';
      b.style.fontWeight = 'normal';
    });
    btn.style.background = '#374151';
    btn.style.borderColor = '#60a5fa';
    btn.style.color = '#60a5fa';
    btn.style.fontWeight = 'bold';
  });
});

// Play / Pause Toggle
btnPlayPause.addEventListener('click', () => {
  isRunning = !isRunning;
  btnPlayPause.textContent = isRunning ? 'Pause ⏸' : 'Play ▶';
  btnPlayPause.style.background = isRunning ? '#2563eb' : '#16a34a';
  btnPlayPause.style.borderColor = isRunning ? '#3b82f6' : '#22c55e';
});

// Gravity Toggle
btnGravity.addEventListener('click', () => {
  if (universe.gravityEnabled) {
    universe.disableGravity();
    btnGravity.textContent = 'Gravity: OFF';
    btnGravity.style.background = '#dc2626';
    btnGravity.style.borderColor = '#ef4444';
  } else {
    universe.enableGravity(SCENARIO_G);
    btnGravity.textContent = 'Gravity: ON';
    btnGravity.style.background = '#059669';
    btnGravity.style.borderColor = '#10b981';
  }
});

// Toggle Background Stars Motion during Tracking
btnStarsMode.addEventListener('click', () => {
  const isLocked = starfield.toggleLockOnFollow();
  if (isLocked) {
    btnStarsMode.textContent = 'Stars on Follow: Static 🔒';
    btnStarsMode.style.borderColor = '#374151';
    btnStarsMode.style.color = '#f3f4f6';
  } else {
    btnStarsMode.textContent = 'Stars on Follow: Moving 🌌';
    btnStarsMode.style.borderColor = '#8b5cf6';
    btnStarsMode.style.color = '#c084fc';
  }
  updateHUD();
});

// Zoom In / Out / Reset
document.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
  camera.zoomBy(1.2);
});

document.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
  camera.zoomBy(0.8);
});

document.querySelector('#btn-reset')?.addEventListener('click', () => {
  camera.reset();
});

// Scroll Wheel Zoom
renderer.canvas.addEventListener('wheel', (event: WheelEvent) => {
  event.preventDefault();
  const zoomFactor = event.deltaY < 0 ? 1.15 : 0.85;
  camera.zoomBy(zoomFactor);
});

// ---------------------------------------------------------------------------
// 9. Interactive Drag to Pan & Click to Follow
// ---------------------------------------------------------------------------
let isMouseDown = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let mouseDownTime = 0;
let totalDragDistance = 0;

renderer.canvas.addEventListener('mousedown', (event: MouseEvent) => {
  isMouseDown = true;
  isDragging = false;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  mouseDownTime = performance.now();
  totalDragDistance = 0;
});

window.addEventListener('mousemove', (event: MouseEvent) => {
  if (!isMouseDown) return;

  const deltaX = event.clientX - dragStartX;
  const deltaY = event.clientY - dragStartY;
  totalDragDistance += Math.hypot(deltaX, deltaY);

  // Disambiguate between click and drag: threshold of 4 screen pixels
  if (totalDragDistance > 4) {
    isDragging = true;
  }

  dragStartX = event.clientX;
  dragStartY = event.clientY;

  if (isDragging) {
    // Convert canvas screen pixel delta to world space displacement
    const rect = renderer.canvas.getBoundingClientRect();
    const scaleX = renderer.width / rect.width;
    const scaleY = renderer.height / rect.height;

    const worldDeltaX = -(deltaX * scaleX) / camera.zoom;
    const worldDeltaY = -(deltaY * scaleY) / camera.zoom;

    // Panning automatically disengages active target tracking
    camera.pan(new Vector2(worldDeltaX, worldDeltaY));
  }
});

window.addEventListener('mouseup', (event: MouseEvent) => {
  if (!isMouseDown) return;
  isMouseDown = false;

  const elapsedMs = performance.now() - mouseDownTime;

  // If the user clicked without dragging, select and follow the clicked body!
  if (!isDragging && totalDragDistance <= 4 && elapsedMs < 400) {
    const rect = renderer.canvas.getBoundingClientRect();
    const bufferX = (event.clientX - rect.left) * (renderer.width / rect.width);
    const bufferY = (event.clientY - rect.top) * (renderer.height / rect.height);

    // Convert screen click position into continuous world coordinates
    const worldClick = camera.screenToWorld(new Vector2(bufferX, bufferY));

    // Generous hit-test threshold (14 screen pixels) so clicking small planets is easy
    const screenTolerancePixels = 14;
    const worldTolerance = screenTolerancePixels / camera.zoom;

    let clickedBody: any = null;
    let closestDist = Infinity;

    for (const body of universe.getBodies()) {
      const dist = body.position.distanceTo(worldClick);
      const hitRadius = Math.max(body.radius, worldTolerance);
      if (dist <= hitRadius && dist < closestDist) {
        closestDist = dist;
        clickedBody = body;
      }
    }

    if (clickedBody) {
      camera.follow(clickedBody);
    } else {
      camera.unfollow();
    }
  }

  isDragging = false;
});
