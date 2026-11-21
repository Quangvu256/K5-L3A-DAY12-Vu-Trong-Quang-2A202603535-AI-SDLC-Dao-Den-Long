/**
 * Pure deterministic Mulberry32 PRNG step.
 * Mutates nothing; takes a 32-bit uint state and returns [nextState, floatIn01).
 */
export function nextRandom(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) | 0;
  const nextState = t >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [nextState, value];
}

export function createSeedState(seed: number): number {
  return (seed >>> 0) || 1;
}
