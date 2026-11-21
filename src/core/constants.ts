export const DT = 0.05; // 20 Hz fixed simulation timestep (seconds)
export const TICK_RATE_HZ = 20;

export const ISLAND_RADIUS = 24;
export const PLAYER_SPEED = 6.0;
export const PLAYER_RADIUS = 0.6;

export const FIREFLY_PICKUP_RADIUS = 1.3;
export const LANTERN_INTERACT_RADIUS = 2.4;
export const FIREFLIES_PER_LANTERN = 2;
export const LANTERN_SAFE_RADIUS = 5.5;

export const PLAYER_MAX_HP = 3;
export const SHADOW_CONTACT_RADIUS = 1.2;
export const SHADOW_INVULN_TICKS = 20;
export const SHADOW_SPEED = 2.5;

export function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
