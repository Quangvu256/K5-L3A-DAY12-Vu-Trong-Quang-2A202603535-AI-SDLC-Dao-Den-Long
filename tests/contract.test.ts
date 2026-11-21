import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runScenario } from '../src/headless/contract';

function loadScenario(name: string): unknown {
  return JSON.parse(readFileSync(resolve('scenarios', name), 'utf8'));
}

describe('Phase 1-2 Regression via Headless Test Contract v2.0.0', () => {
  it('wins Level 1 on p1_collect_and_win and stays deterministic across runs', () => {
    const scenario = loadScenario('p1_collect_and_win.json');
    const r1 = runScenario(scenario);
    const r2 = runScenario(scenario);

    // Migrated per ADR docs/notes/phase-3-change-log.md (1.1.0 -> 2.0.0)
    expect(r1.contractVersion).toBe('2.0.0');
    expect(r1.status).toBe('won');
    expect(r1.lanternsLit).toBe(3);
    expect(r1.resonanceActive).toBe(true);
    expect(r1.firefliesCollected).toBe(6);
    expect(r1.digestSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  // Migrated per ADR docs/notes/phase-3-change-log.md: discrete hp replaced by continuous lanternOil
  it('loses Level 1 on p1_shadow_collision_loss when lanternOil reaches 0', () => {
    const scenario = loadScenario('p1_shadow_collision_loss.json');
    const r1 = runScenario(scenario);
    const r2 = runScenario(scenario);

    expect(r1.status).toBe('lost');
    expect(r1.player.lanternOil).toBe(0);
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

  it('repels chasing shadow via Light Flare on p2_flare_repel_shadow', () => {
    const scenario = loadScenario('p2_flare_repel_shadow.json');
    const r1 = runScenario(scenario);
    const r2 = runScenario(scenario);

    expect(r1.status).toBe('running');
    expect(r1.player.flaresUsed).toBe(1);
    expect(r1.shadows[0].aiState).toBe('repelled');
    expect(r1.digestSha256).toBe(r2.digestSha256);
  });

  it('wins Level 2 ("Bến Sương Mù") lighting all 4 lanterns on p2_level2_win', () => {
    const scenario = loadScenario('p2_level2_win.json');
    const r1 = runScenario(scenario);
    const r2 = runScenario(scenario);

    expect(r1.levelId).toBe('level-2');
    expect(r1.status).toBe('won');
    expect(r1.lanternsLit).toBe(4);
    expect(r1.resonanceActive).toBe(true);
    expect(r1.firefliesCollected).toBe(8);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

describe('Phase 3 Headless Test Contract', () => {
  it('shows single-lantern shadow dimming then Resonance recovery on p3_lantern_decay_and_resonance', () => {
    const scenario = loadScenario('p3_lantern_decay_and_resonance.json');
    const r1 = runScenario(scenario);
    const r2 = runScenario(scenario);

    expect(r1.status).toBe('running');
    expect(r1.lanternsLit).toBe(2);
    expect(r1.resonanceActive).toBe(true);
    expect(r1.events.some((e) => e.type === 'lantern_dimming')).toBe(true);
    expect(r1.events.some((e) => e.type === 'resonance_activated')).toBe(true);
    expect(r1.digestSha256).toBe(r2.digestSha256);
  });

  it('drains oil in dark mist and recharges to 100 in sanctuary on p3_mist_oil_drain_sanctuary', () => {
    const scenario = loadScenario('p3_mist_oil_drain_sanctuary.json');
    const r1 = runScenario(scenario);
    const r2 = runScenario(scenario);

    expect(r1.status).toBe('running');
    expect(r1.lanternsLit).toBe(1);
    expect(r1.player.lanternOil).toBe(100);
    expect(r1.digestSha256).toBe(r2.digestSha256);
  });
});
