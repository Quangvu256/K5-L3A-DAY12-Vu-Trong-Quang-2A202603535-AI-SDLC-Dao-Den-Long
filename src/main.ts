import { DT } from './core/constants';
import { createInitialState, stepSimulation } from './core/engine';
import { GameState } from './core/types';
import { GameHud } from './render/hud';
import { IslandScene3D } from './render/scene';

const app = document.getElementById('app');
if (!app) {
  throw new Error('Missing #app mount container.');
}

let currentLevelId = 'level-1';
let state: GameState = createInitialState(currentLevelId, 42);
let paused = false;
let interactQueued = false;
let flareQueued = false;
const pressedKeys = new Set<string>();

function resetLevel(levelId = currentLevelId): void {
  currentLevelId = levelId;
  state = createInitialState(currentLevelId, 42);
  paused = false;
  interactQueued = false;
  flareQueued = false;
}

const scene3d = new IslandScene3D(app);
const hud = new GameHud(app, {
  onRestart: () => resetLevel(currentLevelId),
  onTogglePause: () => {
    paused = !paused;
  },
  onSelectLevel: (levelId) => resetLevel(levelId),
});

window.addEventListener('keydown', (e) => {
  const code = e.code;
  pressedKeys.add(code);
  if (code === 'KeyE' && !e.repeat) {
    interactQueued = true;
  } else if (code === 'Space' && !e.repeat) {
    e.preventDefault();
    flareQueued = true;
  } else if (code === 'KeyP' && !e.repeat) {
    paused = !paused;
  } else if (code === 'KeyR' && !e.repeat) {
    resetLevel(currentLevelId);
  } else if (code === 'Digit1' && !e.repeat) {
    resetLevel('level-1');
  } else if (code === 'Digit2' && !e.repeat) {
    resetLevel('level-2');
  }
});

window.addEventListener('keyup', (e) => {
  pressedKeys.delete(e.code);
});

let lastTimeMs = performance.now();
let accumulatorSec = 0;

function readMoveInput(): { moveX: number; moveZ: number } {
  let moveX = 0;
  let moveZ = 0;
  if (pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft')) moveX -= 1;
  if (pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) moveX += 1;
  if (pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp')) moveZ -= 1;
  if (pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown')) moveZ += 1;
  return { moveX, moveZ };
}

function animate(nowMs: number): void {
  requestAnimationFrame(animate);
  const deltaSec = Math.min((nowMs - lastTimeMs) / 1000, 0.25);
  lastTimeMs = nowMs;

  if (!paused && state.status === 'running') {
    accumulatorSec += deltaSec;
    while (accumulatorSec >= DT) {
      const { moveX, moveZ } = readMoveInput();
      state = stepSimulation(state, {
        moveX,
        moveZ,
        interact: interactQueued,
        flare: flareQueued,
      });
      interactQueued = false;
      flareQueued = false;
      accumulatorSec -= DT;
    }
  } else {
    interactQueued = false;
    flareQueued = false;
  }

  scene3d.syncAndRender(state, nowMs / 1000);
  hud.update(state, paused);
}

requestAnimationFrame(animate);
