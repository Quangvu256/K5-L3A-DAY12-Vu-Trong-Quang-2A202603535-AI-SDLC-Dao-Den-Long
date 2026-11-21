import { ISLAND_RADIUS } from './constants';
import { LevelDefinition } from './types';

export const LEVEL_1: LevelDefinition = {
  id: 'level-1',
  name: 'Bến Bắc',
  islandRadius: ISLAND_RADIUS,
  playerStart: { x: 0, z: 0 },
  obstacles: [
    { id: 'R1', x: -8, z: -8, radius: 1.8 },
    { id: 'R2', x: 8, z: 8, radius: 1.8 },
  ],
  fireflies: [
    { id: 'F1', x: 3, z: 0 },
    { id: 'F2', x: 6, z: 0 },
    { id: 'F3', x: 0, z: -3 },
    { id: 'F4', x: 0, z: -6 },
    { id: 'F5', x: -3, z: 0 },
    { id: 'F6', x: -6, z: 0 },
  ],
  lanterns: [
    { id: 'L1', x: 9, z: 0 },
    { id: 'L2', x: 0, z: -9 },
    { id: 'L3', x: -9, z: 0 },
  ],
  shadows: [
    { id: 'S1', patrolA: { x: 0, z: 9 }, patrolB: { x: 0, z: 14 } },
    { id: 'S2', patrolA: { x: 10, z: 10 }, patrolB: { x: 14, z: 6 } },
  ],
};

export const LEVELS: Record<string, LevelDefinition> = {
  [LEVEL_1.id]: LEVEL_1,
};

export function getLevelDefinition(levelId: string): LevelDefinition {
  const level = LEVELS[levelId];
  if (!level) {
    throw new Error(`Unknown levelId: ${levelId}`);
  }
  return level;
}
