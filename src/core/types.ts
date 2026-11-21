export interface Vec2 {
  x: number;
  z: number;
}

export interface Obstacle {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface Firefly {
  id: string;
  x: number;
  z: number;
  collected: boolean;
}

export interface GreatLantern {
  id: string;
  x: number;
  z: number;
  lit: boolean;
}

export interface InkShadow {
  id: string;
  x: number;
  z: number;
  patrolA: Vec2;
  patrolB: Vec2;
  targetIndex: 0 | 1;
}

export interface PlayerState {
  x: number;
  z: number;
  facingX: number;
  facingZ: number;
  hp: number;
  invulnTicks: number;
  carriedFireflies: number;
}

export interface LevelDefinition {
  id: string;
  name: string;
  islandRadius: number;
  playerStart: Vec2;
  obstacles: Obstacle[];
  fireflies: Array<{ id: string; x: number; z: number }>;
  lanterns: Array<{ id: string; x: number; z: number }>;
  shadows: Array<{ id: string; patrolA: Vec2; patrolB: Vec2 }>;
}

export interface InputFrame {
  moveX: number;
  moveZ: number;
  interact: boolean;
}

export interface SimEvent {
  tick: number;
  type: 'firefly_collected' | 'lantern_lit' | 'shadow_hit' | 'game_won' | 'game_lost';
  entityId?: string;
}

export type GameStatus = 'running' | 'won' | 'lost';

export interface GameState {
  levelId: string;
  levelName: string;
  seed: number;
  rngState: number;
  tick: number;
  islandRadius: number;
  status: GameStatus;
  player: PlayerState;
  obstacles: Obstacle[];
  fireflies: Firefly[];
  lanterns: GreatLantern[];
  shadows: InkShadow[];
  events: SimEvent[];
}

export interface ScenarioInputSegment {
  fromTick: number;
  toTick: number;
  moveX: number;
  moveZ: number;
  interact?: boolean;
}

export interface ScenarioFile {
  scenarioId: string;
  levelId?: string;
  seed: number;
  maxTicks: number;
  inputs: ScenarioInputSegment[];
  expected?: {
    status?: GameStatus;
    lanternsLit?: number;
    firefliesCollected?: number;
    playerHp?: number;
  };
}
