import { createHash } from 'node:crypto';
import { DT, round6 } from '../core/constants';
import { createInitialState, stepSimulation } from '../core/engine';
import { InputFrame, ScenarioFile, SimEvent } from '../core/types';

export const CONTRACT_VERSION = '1.0.0';
export const CONTRACT_PHASE = 1;

export interface HeadlessResult {
  contractVersion: string;
  phase: number;
  scenarioId: string;
  levelId: string;
  seed: number;
  status: 'running' | 'won' | 'lost';
  ticksElapsed: number;
  simTimeSec: number;
  player: {
    x: number;
    z: number;
    hp: number;
    carriedFireflies: number;
  };
  lanternsLit: number;
  lanternsTotal: number;
  firefliesCollected: number;
  firefliesTotal: number;
  events: SimEvent[];
  digestSha256: string;
}

export function validateScenario(raw: unknown): ScenarioFile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Scenario must be a JSON object.');
  }
  const s = raw as Partial<ScenarioFile>;
  if (typeof s.scenarioId !== 'string' || s.scenarioId.trim() === '') {
    throw new Error('Scenario requires a non-empty string "scenarioId".');
  }
  if (typeof s.seed !== 'number' || !Number.isInteger(s.seed)) {
    throw new Error('Scenario requires an integer "seed".');
  }
  if (typeof s.maxTicks !== 'number' || !Number.isInteger(s.maxTicks) || s.maxTicks <= 0) {
    throw new Error('Scenario requires a positive integer "maxTicks".');
  }
  if (!Array.isArray(s.inputs)) {
    throw new Error('Scenario requires an "inputs" array.');
  }
  for (const seg of s.inputs) {
    if (
      !seg ||
      typeof seg !== 'object' ||
      !Number.isInteger(seg.fromTick) ||
      !Number.isInteger(seg.toTick) ||
      seg.fromTick < 1 ||
      seg.toTick < seg.fromTick ||
      typeof seg.moveX !== 'number' ||
      typeof seg.moveZ !== 'number'
    ) {
      throw new Error(`Invalid input segment in scenario "${s.scenarioId}".`);
    }
  }
  return s as ScenarioFile;
}

export function expandScenarioInputs(scenario: ScenarioFile): InputFrame[] {
  const frames: InputFrame[] = Array.from({ length: scenario.maxTicks + 1 }, () => ({
    moveX: 0,
    moveZ: 0,
    interact: false,
  }));

  for (const seg of scenario.inputs) {
    const start = Math.max(1, seg.fromTick);
    const end = Math.min(scenario.maxTicks, seg.toTick);
    for (let t = start; t <= end; t += 1) {
      frames[t] = {
        moveX: seg.moveX,
        moveZ: seg.moveZ,
        interact: Boolean(seg.interact),
      };
    }
  }
  return frames;
}

export function runScenario(rawScenario: unknown): HeadlessResult {
  const scenario = validateScenario(rawScenario);
  const levelId = scenario.levelId ?? 'level-1';
  let state = createInitialState(levelId, scenario.seed);
  const frames = expandScenarioInputs(scenario);

  for (let tick = 1; tick <= scenario.maxTicks; tick += 1) {
    if (state.status !== 'running') {
      break;
    }
    state = stepSimulation(state, frames[tick]);
  }

  const payloadWithoutDigest = {
    contractVersion: CONTRACT_VERSION,
    phase: CONTRACT_PHASE,
    scenarioId: scenario.scenarioId,
    levelId: state.levelId,
    seed: state.seed,
    status: state.status,
    ticksElapsed: state.tick,
    simTimeSec: round6(state.tick * DT),
    player: {
      x: state.player.x,
      z: state.player.z,
      hp: state.player.hp,
      carriedFireflies: state.player.carriedFireflies,
    },
    lanternsLit: state.lanterns.filter((l) => l.lit).length,
    lanternsTotal: state.lanterns.length,
    firefliesCollected: state.fireflies.filter((f) => f.collected).length,
    firefliesTotal: state.fireflies.length,
    events: state.events,
  };

  const digestSha256 = createHash('sha256')
    .update(JSON.stringify(payloadWithoutDigest))
    .digest('hex');

  return {
    ...payloadWithoutDigest,
    digestSha256,
  };
}
