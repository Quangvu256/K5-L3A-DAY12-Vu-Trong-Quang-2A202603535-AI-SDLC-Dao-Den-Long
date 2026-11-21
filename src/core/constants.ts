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

// Phase 2 constants (Ticket-02)
export const SHADOW_ALERT_RADIUS = 7.5;
export const SHADOW_CHASE_SPEED = 3.4;
export const SHADOW_CHASE_EXIT_RADIUS = 10.5;

export const FLARE_RADIUS = 7.0;
export const FLARE_STUN_TICKS = 60;
export const FLARE_COOLDOWN_TICKS = 80;
export const FLARE_KNOCKBACK = 4.0;

export function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
