import { describe, expect, it } from 'vitest';
import {
  DT,
  FIREFLIES_PER_LANTERN,
  FLARE_COOLDOWN_TICKS,
  FLARE_STUN_TICKS,
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
    for (let i = 0; i < 30; i += 1) {
      state = stepSimulation(state, { moveX: 0, moveZ: 1, interact: false });
    }
    for (let i = 0; i < 30; i += 1) {
      state = stepSimulation(state, { moveX: 1, moveZ: 0, interact: false });
    }
    for (let i = 0; i < 25; i += 1) {
      state = stepSimulation(state, { moveX: 0, moveZ: -1, interact: false });
    }
    state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: true });
    expect(state.player.carriedFireflies).toBe(0);
    expect(state.lanterns[0].lit).toBe(false);

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
    for (let i = 0; i < 28; i += 1) {
      state = stepSimulation(state, { moveX: 1, moveZ: 0, interact: false });
    }
    state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: true });
    expect(state.lanterns[0].lit).toBe(true);

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

describe('Phase 2 Core Features: Light Flare, Shadow AI & Level 2', () => {
  it('transitions shadow AI patrol -> alert -> chase -> patrol when entering sanctuary', () => {
    let state = createInitialState('level-1', 42);
    // Light L1 first so a sanctuary exists at (9,0)
    for (let i = 0; i < 28; i += 1) {
      state = stepSimulation(state, { moveX: 1, moveZ: 0, interact: false });
    }
    state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: true });
    expect(state.lanterns[0].lit).toBe(true);

    // Walk back to (0,0), then South toward S1
    for (let i = 0; i < 28; i += 1) {
      state = stepSimulation(state, { moveX: -1, moveZ: 0, interact: false });
    }
    const observedStates = new Set<string>();
    for (let i = 0; i < 40; i += 1) {
      state = stepSimulation(state, { moveX: 0, moveZ: 1, interact: false });
      observedStates.add(state.shadows[0].aiState);
      if (state.shadows[0].aiState === 'chase') break;
    }

    expect(observedStates.has('patrol')).toBe(true);
    expect(observedStates.has('alert')).toBe(true);
    expect(observedStates.has('chase')).toBe(true);

    // Run North-East into L1 sanctuary (9,0) -> shadow must return to patrol
    for (let i = 0; i < 50; i += 1) {
      const dx = 9 - state.player.x;
      const dz = 0 - state.player.z;
      state = stepSimulation(state, { moveX: dx, moveZ: dz, interact: false });
      if (Math.hypot(dx, dz) <= 1.0) break;
    }
    expect(state.shadows[0].aiState).toBe('patrol');
  });

  it('requires firefly & respects cooldown for Light Flare, repels shadows, and prevents stunned contact damage', () => {
    let state = createInitialState('level-1', 42);
    // Attempt flare with 0 fireflies -> does nothing
    state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: false, flare: true });
    expect(state.player.flaresUsed).toBe(0);
    expect(state.player.flareCooldownTicks).toBe(0);

    // Collect F1 & F2 (2 fireflies), go South to S1, cast flare
    for (let i = 0; i < 20; i += 1) {
      state = stepSimulation(state, { moveX: 1, moveZ: 0, interact: false });
    }
    for (let i = 0; i < 20; i += 1) {
      state = stepSimulation(state, { moveX: -1, moveZ: 0, interact: false });
    }
    for (let i = 0; i < 20; i += 1) {
      state = stepSimulation(state, { moveX: 0, moveZ: 1, interact: false });
    }
    for (let i = 0; i < 20; i += 1) {
      state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: false });
      if (Math.hypot(state.shadows[0].x - state.player.x, state.shadows[0].z - state.player.z) <= 6.5) {
        break;
      }
    }

    const hpBefore = state.player.hp;
    const distBefore = Math.hypot(state.shadows[0].x - state.player.x, state.shadows[0].z - state.player.z);
    state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: false, flare: true });

    expect(state.player.flaresUsed).toBe(1);
    expect(state.player.carriedFireflies).toBe(1);
    expect(state.player.flareCooldownTicks).toBe(FLARE_COOLDOWN_TICKS);
    expect(state.shadows[0].aiState).toBe('repelled');
    expect(state.shadows[0].stunTicks).toBe(FLARE_STUN_TICKS);
    const distAfter = Math.hypot(state.shadows[0].x - state.player.x, state.shadows[0].z - state.player.z);
    expect(distAfter).toBeGreaterThan(distBefore);

    // Immediate second flare attempt during cooldown must be rejected
    state = stepSimulation(state, { moveX: 0, moveZ: 0, interact: false, flare: true });
    expect(state.player.flaresUsed).toBe(1);

    // Walk directly on top of repelled shadow -> zero damage while stunned
    for (let i = 0; i < 15; i += 1) {
      const dx = state.shadows[0].x - state.player.x;
      const dz = state.shadows[0].z - state.player.z;
      state = stepSimulation(state, { moveX: dx, moveZ: dz, interact: false });
    }
    expect(state.player.hp).toBe(hpBefore);
  });

  it('initializes Level 2 with 4 lanterns, 8 fireflies, 3 shadows, and radius 28', () => {
    const l2 = createInitialState('level-2', 7);
    expect(l2.islandRadius).toBe(28);
    expect(l2.lanterns).toHaveLength(4);
    expect(l2.fireflies).toHaveLength(8);
    expect(l2.shadows).toHaveLength(3);
    expect(l2.obstacles).toHaveLength(4);
  });
});
