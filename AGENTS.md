# AGENTS.md — Đảo Đèn Lồng (AI Harness v1)

## Project Goal
3D third-person game (**Đảo Đèn Lồng**) built across 4 SDLC phases with a strictly decoupled, deterministic headless simulation core matching the Test Contract (`test-contract.json`).

## Essential Commands
- Install deps: `npm ci` (or `npm install` locally)
- Typecheck: `npm run typecheck`
- Unit & Contract Tests: `npm test`
- Headless Runner: `npm run headless -- --scenario <path> [--out <path>]`
- Full Verification Gate: `npm run verify`
- Production Build: `npm run build`

## Architecture Boundaries (STRICT)
1. **`src/core/` MUST stay pure deterministic simulation logic.**
   - ZERO imports from `three`, `window`, `document`, DOM APIs, or `node:*`.
   - ZERO non-deterministic calls (`Math.random()`, `Date.now()`, `performance.now()`). Always use `src/core/rng.ts`.
   - Fixed timestep (`DT = 0.05`s, 20 Hz). Identical seed + inputs MUST produce bit-identical JSON and SHA-256 digest.
2. **`src/render/` and `src/audio/` are presentation-only.** They read `GameState` snapshots and NEVER mutate simulation rules or alter headless outputs.
3. **`src/headless/` is the single Test Contract adapter** declared by `test-contract.json`.

## Workflow & Honesty Rules
- **Spec-First:** Update `docs/notes/assumptions.md` with `[ASSUMPTION]` tags and testable Acceptance Criteria before writing phase code.
- **Verify Before Claiming:** Never claim a task passes without running `npm run verify` after the final edit.
- **Real Proof Only:** Proof files in `docs/proof/phase-N/` must come from real script output; never hand-edit or fabricate logs, digests, or tests.
- **Protect Upstream Docs:** Never edit `GUIDE.md`, `CHECKPOINTS.md`, `RUBRIC.md`, `RULES.md`, or `SUBMISSION.md`. Never commit `.env` or secrets.
