import { describe, expect, it } from 'vitest';
import {
  DT,
  FIREFLIES_PER_LANTERN,
  ISLAND_RADIUS,
  LANTERN_SAFE_RADIUS,
  PLAYER_MAX_HP,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  SHADOW_INVULN_TICKS,
} from '../src/core/constants';
import { createInitialState, stepSimulation } from '../src/core/engine';
import { createSeedState, nextRandom } from '../src/core/rng';

describe('Phase 1 Core Simulation', () => {
  it('generates deterministic PRNG sequences for identical seeds', () => {
    let a = createSeedState(12345);
    let b = createSeedState(12345);
    const seqA: number[] = [];
    const seqB: number[] = [];
    for (let i = 0; i < 10; i += 1) {
      const [nextA, valA] = nextRandom(a);
      const [nextB, valB] = nextRandom(b);
      a = nextA;
      b = nextB;
      seqA.push(valA);
      seqB.push(valB);
    }
    expect(seqA).toEqual(seqB);
  });

  it('normalizes diagonal movement so speed never exceeds PLAYER_SPEED', () => {
    let state = createInitialState('level-1', 42);
    state = stepSimulation(state, { moveX: 1, moveZ: 1, interact: false });
    const dist = Math.hypot(state.player.x, state.player.z);
    expect(dist).toBeCloseTo(PLAYER_SPEED * DT, 5);
  });

  it('pushes player outside circular rock obstacles and clamps to island boundary', () => {
    let state = createInitialState('level-1', 42);
    for (let i = 0; i < 60; i += 1) {
      state = stepSimulation(state, { moveX: -1, moveZ: -1, interact: false });
      const r1 = state.obstacles[0];
      const distToR1 = Math.hypot(state.player.x - r1.x, state.player.z - r1.z);
      expect(distToR1).toBeGreaterThanOrEqual(r1.radius + PLAYER_RADIUS - 1e-5);
    }

    for (let i = 0; i < 100; i += 1) {
      state = stepSimulation(state, { moveX: -1, moveZ: 0, interact: false });
      const distCenter = Math.hypot(state.player.x, state.player.z);
      expect(distCenter).toBeLessThanOrEqual(ISLAND_RADIUS - PLAYER_RADIUS + 1e-5);
    }
  });

  it('collects fireflies automatically and requires >= FIREFLIES_PER_LANTERN to light a lantern', () => {
    let state = createInitialState('level-1', 42);
    // Walk East to pick up F1 (3,0) only, then go to L1 (9,0) without F2? Wait: F2 is on the line at (6,0).
    // Test failing to light when carrying 0 fireflies by walking North-East around F1/F2.
    for (let i = 0; i < 30; i += 1) {
      state = stepSimulation(state, { moveX: 0, moveZ: 1, interact: false });
    }
    // Walk to (9,0) via z=4 (avoiding F1/F2 at z=0)
    for (let i = 0; i < 30; i += 1) {
      state = stepSimulation(state, { moveX: 1, moveZ: 0, interact: false });
    }
    for (let i = 0; i < 25; i += 1) {
      state = stepSimulation(state, { moveX: 0, moveZ: -1, interact: false });
    }
    state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: true });
    expect(state.player.carriedFireflies).toBe(0);
    expect(state.lanterns[0].lit).toBe(false);

    // Fresh state: walk directly East collecting F1 & F2 then interact at L1
    let winPath = createInitialState('level-1', 42);
    for (let i = 0; i < 28; i += 1) {
      winPath = stepSimulation(winPath, { moveX: 1, moveZ: 0, interact: false });
    }
    expect(winPath.player.carriedFireflies).toBe(FIREFLIES_PER_LANTERN);
    winPath = stepSimulation(winPath, { moveX: 0, moveZ: 0, interact: true });
    expect(winPath.lanterns[0].lit).toBe(true);
    expect(winPath.player.carriedFireflies).toBe(0);
  });

  it('keeps Ink Shadows patrolling and outside lit lantern sanctuaries', () => {
    let state = createInitialState('level-1', 42);
    // Light L1 manually via normal gameplay first
    for (let i = 0; i < 28; i += 1) {
      state = stepSimulation(state, { moveX: 1, moveZ: 0, interact: false });
    }
    state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: true });
    expect(state.lanterns[0].lit).toBe(true);

    // Step 120 ticks and verify every shadow stays outside lit L1 safe radius
    for (let i = 0; i < 120; i += 1) {
      state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: false });
      for (const s of state.shadows) {
        const dist = Math.hypot(s.x - state.lanterns[0].x, s.z - state.lanterns[0].z);
        expect(dist).toBeGreaterThanOrEqual(LANTERN_SAFE_RADIUS - 1e-5);
      }
    }
  });

  it('applies invulnerability frames on shadow hit and ends in lost when HP hits 0', () => {
    let state = createInitialState('level-1', 42);
    expect(state.player.hp).toBe(PLAYER_MAX_HP);
    let sawInvuln = false;

    for (let i = 0; i < 38; i += 1) {
      state = stepSimulation(state, { moveX: 0, moveZ: 1, interact: false });
    }
    for (let i = 0; i < 142; i += 1) {
      state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: false });
      if (state.player.invulnTicks === SHADOW_INVULN_TICKS) {
        sawInvuln = true;
      }
      if (state.status !== 'running') break;
    }

    expect(sawInvuln).toBe(true);
    expect(state.player.hp).toBe(0);
    expect(state.status).toBe('lost');
  });
});
