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
