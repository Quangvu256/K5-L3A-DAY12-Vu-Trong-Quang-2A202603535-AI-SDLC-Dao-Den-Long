# Changelog

All notable changes to **Đảo Đèn Lồng** are documented per SDLC phase.

## [0.1.0] - 2026-11-21 (CP0 Scaffold)
### Added
- Project scaffold with TypeScript, Three.js, Vite, Vitest, and `tsx`.
- AI Harness v1 (`AGENTS.md`, `.agents/skills/verify-phase/SKILL.md`, `.githooks/pre-commit`, GitHub Actions CI).
- `LICENSE`, `CREDITS.md`, and `.gitignore`.

## [0.1.1] - 2026-11-21 (Phase 1 — Tag `phase-1`)
### Added
- `[ASSUMPTION]` Phase 1 specification and acceptance criteria (`AC-1.1`..`AC-1.7`) in `docs/notes/assumptions.md`.
- Pure deterministic simulation engine (`src/core/`) with Level 1 ("Bến Bắc"), fixed 20 Hz timestep, and Mulberry32 PRNG.
- Headless Test Contract v1.0.0 CLI (`src/headless/cli.ts`, `test-contract.json`) with canonical SHA-256 digest.
- Three.js 3D playable island scene, Mây character, HUD, and fixed-timestep game loop (`src/render/`, `src/main.ts`).
- 3 Phase 1 headless scenarios, 9 unit/contract tests, verification script (`scripts/verify-all.mjs`), and real proof artifacts (`docs/proof/phase-1/`).

## [0.2.0] - 2026-11-21 (Phase 2 — Tag `phase-2`)
### Added
- Light Flare (`Space` / `input.flare`) spending 1 firefly with 80-tick cooldown, 7.0 radius knockback, and 60-tick stun.
- Ink Shadow 4-state AI (`patrol -> alert -> chase -> repelled`) respecting lit lantern sanctuaries.
- Level 2 ("Bến Sương Mù", `islandRadius = 28`, 4 lanterns, 8 fireflies, 3 shadows, 4 rocks).
- AI Harness v2: static `scripts/check-core-purity.mjs`, `.agents/skills/review-diff/SKILL.md`, updated `AGENTS.md`, and CI gate.
- Phase 2 scenarios (`p2_flare_repel_shadow.json`, `p2_level2_win.json`), 14 passing tests, and real proof artifacts (`docs/proof/phase-2/`).
### Fixed
- Aligned `stunTicks` decrement timing with `invulnTicks`/`flareCooldownTicks` at tick start so stun lasts full 60 ticks after cast.

## [0.3.0] - 2026-11-21 (Phase 3 — Tag `phase-3`)
### Changed (Breaking per Ticket-03 ADR)
- Replaced discrete `player.hp` with continuous `player.lanternOil` (`0..100`, mist drain `-1.8/s`, sanctuary recharge `+12/s`, shadow hit `-35`).
- Replaced permanently lit lanterns with `charge (0..100)` decay (`-8/s` near unrepelled shadow when `< 2` lit) and **Resonance Chain** (`>= 2` lit halts decay & recovers `+4/s`), plus free rekindle on `E`.
- Bumped Test Contract to `2.0.0` (`docs/notes/phase-3-change-log.md`) and explicitly migrated Phase 1–2 tests (0 skipped tests).
### Added
- AI Harness v3: `scripts/check-no-skipped-tests.mjs` wired into `verify-all.mjs`, CI, and `AGENTS.md`.
- Phase 3 scenarios (`p3_lantern_decay_and_resonance.json`, `p3_mist_oil_drain_sanctuary.json`), 3D Resonance beam & HUD oil gauge, and real proof artifacts (`docs/proof/phase-3/`).
