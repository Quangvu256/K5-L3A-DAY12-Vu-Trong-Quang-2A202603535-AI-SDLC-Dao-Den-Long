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
  charge: number;
}

export type ShadowAiState = 'patrol' | 'alert' | 'chase' | 'repelled';

export interface InkShadow {
  id: string;
  x: number;
  z: number;
  patrolA: Vec2;
  patrolB: Vec2;
  targetIndex: 0 | 1;
  aiState: ShadowAiState;
  stunTicks: number;
}

export interface PlayerState {
  x: number;
  z: number;
  facingX: number;
  facingZ: number;
  lanternOil: number;
  invulnTicks: number;
  carriedFireflies: number;
  flareCooldownTicks: number;
  flaresUsed: number;
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
  flare?: boolean;
}

export interface SimEvent {
  tick: number;
  type:
    | 'firefly_collected'
    | 'lantern_lit'
    | 'lantern_dimming'
    | 'lantern_extinguished'
    | 'lantern_rekindled'
    | 'resonance_activated'
    | 'shadow_hit'
    | 'flare_cast'
    | 'shadow_repelled'
    | 'game_won'
    | 'game_lost';
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
  lastFlareTick: number;
  resonanceActive: boolean;
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
  flare?: boolean;
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
    lanternOil?: number;
    flaresUsed?: number;
    resonanceActive?: boolean;
  };
}
