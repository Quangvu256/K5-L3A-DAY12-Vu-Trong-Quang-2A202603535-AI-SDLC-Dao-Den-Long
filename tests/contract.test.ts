import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runScenario } from '../src/headless/contract';

function loadScenario(name: string): unknown {
  return JSON.parse(readFileSync(resolve('scenarios', name), 'utf8'));
}

describe('Phase 1 Headless Test Contract', () => {
  it('wins Level 1 on p1_collect_and_win and is bit-deterministic across runs', () => {
    const scenario = loadScenario('p1_collect_and_win.json');
    const r1 = runScenario(scenario);
    const r2 = runScenario(scenario);

    expect(r1.contractVersion).toBe('1.0.0');
    expect(r1.status).toBe('won');
    expect(r1.lanternsLit).toBe(3);
    expect(r1.firefliesCollected).toBe(6);
    expect(r1.digestSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
    expect(r1.digestSha256).toBe(r2.digestSha256);
  });

  it('loses Level 1 on p1_shadow_collision_loss when shadow hits player 3 times', () => {
    const scenario = loadScenario('p1_shadow_collision_loss.json');
    const r1 = runScenario(scenario);
    const r2 = runScenario(scenario);

    expect(r1.status).toBe('lost');
    expect(r1.player.hp).toBe(0);
    expect(r1.digestSha256).toBe(r2.digestSha256);
  });

  it('enforces rock collision and circular island boundary on p1_boundary_and_obstacle', () => {
    const scenario = loadScenario('p1_boundary_and_obstacle.json');
    const r1 = runScenario(scenario);
    const r2 = runScenario(scenario);

    expect(r1.status).toBe('running');
    expect(r1.lanternsLit).toBe(0);
    expect(Math.hypot(r1.player.x, r1.player.z)).toBeLessThanOrEqual(23.4 + 1e-5);
    expect(r1.digestSha256).toBe(r2.digestSha256);
  });
});
