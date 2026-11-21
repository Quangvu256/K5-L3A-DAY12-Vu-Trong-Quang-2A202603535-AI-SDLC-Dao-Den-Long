import {
  DT,
  FIREFLIES_PER_LANTERN,
  FIREFLY_PICKUP_RADIUS,
  FLARE_COOLDOWN_TICKS,
  FLARE_KNOCKBACK,
  FLARE_RADIUS,
  FLARE_STUN_TICKS,
  LANTERN_CHARGE_MAX,
  LANTERN_DECAY_PER_SEC,
  LANTERN_DECAY_SHADOW_RADIUS,
  LANTERN_INTERACT_RADIUS,
  LANTERN_RESONANCE_MIN_COUNT,
  LANTERN_RESONANCE_RECOVER_PER_SEC,
  LANTERN_SAFE_RADIUS,
  OIL_MAX,
  OIL_MIST_DRAIN_PER_SEC,
  OIL_SANCTUARY_RECHARGE_PER_SEC,
  OIL_SHADOW_HIT_COST,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  SHADOW_ALERT_RADIUS,
  SHADOW_CHASE_EXIT_RADIUS,
  SHADOW_CHASE_SPEED,
  SHADOW_CONTACT_RADIUS,
  SHADOW_INVULN_TICKS,
  SHADOW_SPEED,
  round6,
} from './constants';
import { getLevelDefinition } from './levels';
import { createSeedState } from './rng';
import { GameState, GreatLantern, InkShadow, InputFrame, Obstacle } from './types';

function cloneState(state: GameState): GameState {
  return {
    ...state,
    player: { ...state.player },
    obstacles: state.obstacles.map((o) => ({ ...o })),
    fireflies: state.fireflies.map((f) => ({ ...f })),
    lanterns: state.lanterns.map((l) => ({ ...l })),
    shadows: state.shadows.map((s) => ({
      ...s,
      patrolA: { ...s.patrolA },
      patrolB: { ...s.patrolB },
    })),
    events: state.events.map((e) => ({ ...e })),
  };
}

function resolveCircleCollisions(
  x: number,
  z: number,
  entityRadius: number,
  obstacles: Obstacle[],
  islandRadius: number
): { x: number; z: number } {
  let px = x;
  let pz = z;

  for (const obs of obstacles) {
    const dx = px - obs.x;
    const dz = pz - obs.z;
    const dist = Math.hypot(dx, dz);
    const minDist = obs.radius + entityRadius;
    if (dist < minDist) {
      if (dist > 1e-9) {
        const scale = minDist / dist;
        px = obs.x + dx * scale;
        pz = obs.z + dz * scale;
      } else {
        px = obs.x + minDist;
        pz = obs.z;
      }
    }
  }

  const maxRadius = islandRadius - entityRadius;
  const distFromCenter = Math.hypot(px, pz);
  if (distFromCenter > maxRadius) {
    const clampScale = maxRadius / distFromCenter;
    px *= clampScale;
    pz *= clampScale;
  }

  return { x: round6(px), z: round6(pz) };
}

function pushOutsideLitLanterns(
  x: number,
  z: number,
  lanterns: GreatLantern[]
): { x: number; z: number; pushed: boolean } {
  let sx = x;
  let sz = z;
  let pushed = false;

  for (const lantern of lanterns) {
    if (!lantern.lit) continue;
    const dx = sx - lantern.x;
    const dz = sz - lantern.z;
    const dist = Math.hypot(dx, dz);
    if (dist < LANTERN_SAFE_RADIUS) {
      pushed = true;
      if (dist > 1e-9) {
        const scale = LANTERN_SAFE_RADIUS / dist;
        sx = lantern.x + dx * scale;
        sz = lantern.z + dz * scale;
      } else {
        sx = lantern.x + LANTERN_SAFE_RADIUS;
        sz = lantern.z;
      }
    }
  }

  return { x: round6(sx), z: round6(sz), pushed };
}

function isPointInSanctuary(x: number, z: number, lanterns: GreatLantern[]): boolean {
  for (const lantern of lanterns) {
    if (!lantern.lit) continue;
    if (Math.hypot(x - lantern.x, z - lantern.z) <= LANTERN_SAFE_RADIUS) {
      return true;
    }
  }
  return false;
}

function findNearestLantern(
  x: number,
  z: number,
  lanterns: GreatLantern[],
  predicate: (l: GreatLantern) => boolean
): GreatLantern | null {
  let closest: GreatLantern | null = null;
  let closestDist = Infinity;
  for (const l of lanterns) {
    if (!predicate(l)) continue;
    const dist = Math.hypot(x - l.x, z - l.z);
    if (dist <= LANTERN_INTERACT_RADIUS && dist < closestDist) {
      closestDist = dist;
      closest = l;
    }
  }
  return closest;
}

function moveShadowAlongPatrol(shadow: InkShadow, stepDist: number): { x: number; z: number } {
  const target = shadow.targetIndex === 0 ? shadow.patrolA : shadow.patrolB;
  const dx = target.x - shadow.x;
  const dz = target.z - shadow.z;
  const dist = Math.hypot(dx, dz);

  if (dist <= stepDist) {
    shadow.targetIndex = shadow.targetIndex === 0 ? 1 : 0;
    return { x: target.x, z: target.z };
  }
  if (dist > 1e-9) {
    return {
      x: shadow.x + (dx / dist) * stepDist,
      z: shadow.z + (dz / dist) * stepDist,
    };
  }
  return { x: shadow.x, z: shadow.z };
}

export function createInitialState(levelId = 'level-1', seed = 42): GameState {
  const level = getLevelDefinition(levelId);
  return {
    levelId: level.id,
    levelName: level.name,
    seed,
    rngState: createSeedState(seed),
    tick: 0,
    islandRadius: level.islandRadius,
    status: 'running',
    lastFlareTick: -999,
    resonanceActive: false,
    player: {
      x: round6(level.playerStart.x),
      z: round6(level.playerStart.z),
      facingX: 0,
      facingZ: 1,
      lanternOil: OIL_MAX,
      invulnTicks: 0,
      carriedFireflies: 0,
      flareCooldownTicks: 0,
      flaresUsed: 0,
    },
    obstacles: level.obstacles.map((o) => ({ ...o })),
    fireflies: level.fireflies.map((f) => ({ ...f, collected: false })),
    lanterns: level.lanterns.map((l) => ({ ...l, lit: false, charge: 0 })),
    shadows: level.shadows.map((s) => ({
      id: s.id,
      x: round6(s.patrolA.x),
      z: round6(s.patrolA.z),
      patrolA: { ...s.patrolA },
      patrolB: { ...s.patrolB },
      targetIndex: 1,
      aiState: 'patrol',
      stunTicks: 0,
    })),
    events: [],
  };
}

export function stepSimulation(prevState: GameState, input: InputFrame): GameState {
  if (prevState.status !== 'running') {
    return prevState;
  }

  const state = cloneState(prevState);
  state.tick += 1;

  if (state.player.invulnTicks > 0) {
    state.player.invulnTicks -= 1;
  }
  if (state.player.flareCooldownTicks > 0) {
    state.player.flareCooldownTicks -= 1;
  }
  for (const shadow of state.shadows) {
    if (shadow.stunTicks > 0) {
      shadow.stunTicks -= 1;
      if (shadow.stunTicks === 0) {
        shadow.aiState = 'patrol';
      }
    }
  }

  // 1. Player movement
  const rawMag = Math.hypot(input.moveX, input.moveZ);
  if (rawMag > 1e-9) {
    const moveScale = rawMag > 1 ? 1 / rawMag : 1;
    const vx = input.moveX * moveScale * PLAYER_SPEED;
    const vz = input.moveZ * moveScale * PLAYER_SPEED;
    state.player.facingX = round6(input.moveX / rawMag);
    state.player.facingZ = round6(input.moveZ / rawMag);
    state.player.x += vx * DT;
    state.player.z += vz * DT;
  }

  const resolvedPlayer = resolveCircleCollisions(
    state.player.x,
    state.player.z,
    PLAYER_RADIUS,
    state.obstacles,
    state.islandRadius
  );
  state.player.x = resolvedPlayer.x;
  state.player.z = resolvedPlayer.z;

  // 2. Automatic firefly pickup
  for (const firefly of state.fireflies) {
    if (firefly.collected) continue;
    const dist = Math.hypot(state.player.x - firefly.x, state.player.z - firefly.z);
    if (dist <= FIREFLY_PICKUP_RADIUS) {
      firefly.collected = true;
      state.player.carriedFireflies += 1;
      state.events.push({
        tick: state.tick,
        type: 'firefly_collected',
        entityId: firefly.id,
      });
    }
  }

  // 3. Great Lantern ignition or free rekindle (Phase 3)
  if (input.interact) {
    const unlit =
      state.player.carriedFireflies >= FIREFLIES_PER_LANTERN
        ? findNearestLantern(state.player.x, state.player.z, state.lanterns, (l) => !l.lit)
        : null;

    if (unlit) {
      unlit.lit = true;
      unlit.charge = LANTERN_CHARGE_MAX;
      state.player.carriedFireflies -= FIREFLIES_PER_LANTERN;
      state.events.push({
        tick: state.tick,
        type: 'lantern_lit',
        entityId: unlit.id,
      });
    } else {
      const dimmingLit = findNearestLantern(
        state.player.x,
        state.player.z,
        state.lanterns,
        (l) => l.lit && l.charge < LANTERN_CHARGE_MAX
      );
      if (dimmingLit) {
        dimmingLit.charge = LANTERN_CHARGE_MAX;
        state.events.push({
          tick: state.tick,
          type: 'lantern_rekindled',
          entityId: dimmingLit.id,
        });
      }
    }
  }

  // 4. Light Flare ability (Phase 2)
  if (input.flare && state.player.flareCooldownTicks === 0 && state.player.carriedFireflies >= 1) {
    state.player.carriedFireflies -= 1;
    state.player.flareCooldownTicks = FLARE_COOLDOWN_TICKS;
    state.player.flaresUsed += 1;
    state.lastFlareTick = state.tick;
    state.events.push({ tick: state.tick, type: 'flare_cast' });

    for (const shadow of state.shadows) {
      const dx = shadow.x - state.player.x;
      const dz = shadow.z - state.player.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= FLARE_RADIUS) {
        const dirX = dist > 1e-9 ? dx / dist : 0;
        const dirZ = dist > 1e-9 ? dz / dist : 1;
        let pushedX = shadow.x + dirX * FLARE_KNOCKBACK;
        let pushedZ = shadow.z + dirZ * FLARE_KNOCKBACK;

        const maxR = state.islandRadius - PLAYER_RADIUS;
        const r = Math.hypot(pushedX, pushedZ);
        if (r > maxR) {
          pushedX *= maxR / r;
          pushedZ *= maxR / r;
        }
        const safePos = pushOutsideLitLanterns(pushedX, pushedZ, state.lanterns);
        shadow.x = safePos.x;
        shadow.z = safePos.z;
        shadow.stunTicks = FLARE_STUN_TICKS;
        shadow.aiState = 'repelled';
        state.events.push({
          tick: state.tick,
          type: 'shadow_repelled',
          entityId: shadow.id,
        });
      }
    }
  }

  // 5. Ink Shadow AI state machine & movement
  const playerInSanctuaryBeforeMove = isPointInSanctuary(state.player.x, state.player.z, state.lanterns);
  const patrolStep = SHADOW_SPEED * DT;
  const chaseStep = SHADOW_CHASE_SPEED * DT;

  for (const shadow of state.shadows) {
    if (shadow.stunTicks > 0) {
      shadow.aiState = 'repelled';
      continue;
    }

    const distToPlayer = Math.hypot(state.player.x - shadow.x, state.player.z - shadow.z);

    if (playerInSanctuaryBeforeMove) {
      shadow.aiState = 'patrol';
    } else if (shadow.aiState === 'patrol' && distToPlayer <= SHADOW_ALERT_RADIUS) {
      shadow.aiState = 'alert';
    } else if (shadow.aiState === 'alert') {
      if (distToPlayer <= SHADOW_CHASE_EXIT_RADIUS) {
        shadow.aiState = 'chase';
      } else {
        shadow.aiState = 'patrol';
      }
    } else if (shadow.aiState === 'chase' && distToPlayer > SHADOW_CHASE_EXIT_RADIUS) {
      shadow.aiState = 'patrol';
    }

    let nextPos: { x: number; z: number };
    if (shadow.aiState === 'chase') {
      const dx = state.player.x - shadow.x;
      const dz = state.player.z - shadow.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= chaseStep || dist <= 1e-9) {
        nextPos = { x: state.player.x, z: state.player.z };
      } else {
        nextPos = {
          x: shadow.x + (dx / dist) * chaseStep,
          z: shadow.z + (dz / dist) * chaseStep,
        };
      }
    } else {
      nextPos = moveShadowAlongPatrol(shadow, patrolStep);
    }

    const safePos = pushOutsideLitLanterns(nextPos.x, nextPos.z, state.lanterns);
    shadow.x = safePos.x;
    shadow.z = safePos.z;
    if (safePos.pushed && shadow.aiState === 'patrol') {
      shadow.targetIndex = shadow.targetIndex === 0 ? 1 : 0;
    }
  }

  // 6. Lantern Charge Decay & Resonance Chain (Phase 3)
  const litCount = state.lanterns.filter((l) => l.lit).length;
  const prevResonance = state.resonanceActive;
  state.resonanceActive = litCount >= LANTERN_RESONANCE_MIN_COUNT;
  if (!prevResonance && state.resonanceActive) {
    state.events.push({ tick: state.tick, type: 'resonance_activated' });
  }

  for (const lantern of state.lanterns) {
    if (!lantern.lit) continue;
    if (state.resonanceActive) {
      lantern.charge = round6(
        Math.min(LANTERN_CHARGE_MAX, lantern.charge + LANTERN_RESONANCE_RECOVER_PER_SEC * DT)
      );
    } else {
      const shadowNear = state.shadows.some(
        (s) =>
          s.aiState !== 'repelled' &&
          Math.hypot(s.x - lantern.x, s.z - lantern.z) <= LANTERN_DECAY_SHADOW_RADIUS
      );
      if (shadowNear) {
        const prevCharge = lantern.charge;
        lantern.charge = round6(Math.max(0, lantern.charge - LANTERN_DECAY_PER_SEC * DT));
        if (prevCharge === LANTERN_CHARGE_MAX && lantern.charge < LANTERN_CHARGE_MAX) {
          state.events.push({
            tick: state.tick,
            type: 'lantern_dimming',
            entityId: lantern.id,
          });
        }
        if (lantern.charge <= 0) {
          lantern.charge = 0;
          lantern.lit = false;
          state.events.push({
            tick: state.tick,
            type: 'lantern_extinguished',
            entityId: lantern.id,
          });
        }
      }
    }
  }

  // Re-evaluate resonance if a lantern just extinguished
  state.resonanceActive = state.lanterns.filter((l) => l.lit).length >= LANTERN_RESONANCE_MIN_COUNT;

  // 7. Player Lantern Oil (mist drain vs sanctuary recharge) & Shadow contact cost
  const inSanctuary = isPointInSanctuary(state.player.x, state.player.z, state.lanterns);
  if (inSanctuary) {
    state.player.lanternOil = round6(
      Math.min(OIL_MAX, state.player.lanternOil + OIL_SANCTUARY_RECHARGE_PER_SEC * DT)
    );
  } else {
    state.player.lanternOil = round6(
      Math.max(0, state.player.lanternOil - OIL_MIST_DRAIN_PER_SEC * DT)
    );
  }

  if (state.player.invulnTicks === 0) {
    for (const shadow of state.shadows) {
      if (shadow.aiState === 'repelled') continue;
      const dist = Math.hypot(state.player.x - shadow.x, state.player.z - shadow.z);
      if (dist <= SHADOW_CONTACT_RADIUS) {
        state.player.lanternOil = round6(Math.max(0, state.player.lanternOil - OIL_SHADOW_HIT_COST));
        state.player.invulnTicks = SHADOW_INVULN_TICKS;
        state.events.push({
          tick: state.tick,
          type: 'shadow_hit',
          entityId: shadow.id,
        });
        break;
      }
    }
  }

  // 8. Terminal win/loss checks
  if (state.lanterns.every((l) => l.lit)) {
    state.status = 'won';
    state.events.push({ tick: state.tick, type: 'game_won' });
  } else if (state.player.lanternOil <= 0) {
    state.status = 'lost';
    state.events.push({ tick: state.tick, type: 'game_lost' });
  }

  return state;
}
