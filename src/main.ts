import './style.css';
import { CanvasRenderer } from './renderer/CanvasRenderer';

// 1. Locate the container element in index.html
const appElement = document.querySelector<HTMLDivElement>('#app');
if (!appElement) {
  throw new Error('Could not find #app element in DOM.');
}
appElement.innerHTML=`
<div class="header">
  <h2>Space FYP</h2>
</div>
<div id="galaxy">
</div>
`;
const galaxyDiv = document.querySelector<HTMLDivElement>('#galaxy');
if(!galaxyDiv){
  throw new Error('Could not find #galaxy element in DOM.');
}
// 2. Create pixel renderer (internal resolution: 320 pixels wide, 180 pixels high)
const renderer = new CanvasRenderer({ width: 320, height: 180 });

// 3. Clear any existing content and attach the canvas to the webpage
galaxyDiv.innerHTML = '';
galaxyDiv.appendChild(renderer.canvas);

// 4. Fill the background with deep space dark blue/black
renderer.clear('#08080c');

// 5. Define exactly 4 sample static stars with explicit (X, Y) pixel coordinates and colors
// Coordinate system reminder:
// (0, 0) is the top-left corner.
// X increases as you go right (0 to 319).
// Y increases as you go down (0 to 179).
const sampleStars = [
  { name: 'Star Alpha (White)',   x: 60,  y: 45,  color: '#ffffff' }, // Top-left
  { name: 'Star Beta (Cyan)',     x: 250, y: 40,  color: '#67e8f9' }, // Top-right
  { name: 'Star Gamma (Gold)',    x: 100, y: 135, color: '#fde047' }, // Bottom-left
  { name: 'Star Delta (Red-Orange)', x: 230, y: 125, color: '#f87171' }, // Bottom-right
];

// 6. Draw the 4 stars onto the canvas
for (const star of sampleStars) {
  // drawPixel(x, y, color) places a single 1x1 simulation pixel
  renderer.drawPixel(star.x, star.y, star.color);
}
