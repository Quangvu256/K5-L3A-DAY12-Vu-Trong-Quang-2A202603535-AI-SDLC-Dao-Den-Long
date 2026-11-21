# AGENTS.md — Đảo Đèn Lồng (AI Harness v3)

## Project Goal
3D third-person game (**Đảo Đèn Lồng**) built across 4 SDLC phases with a strictly decoupled, deterministic headless simulation core matching the Test Contract (`test-contract.json`).

## Essential Commands
- Install deps: `npm ci`
- Typecheck: `npm run typecheck`
- Core Purity Guard: `node scripts/check-core-purity.mjs`
- No-Skipped-Tests Guard: `node scripts/check-no-skipped-tests.mjs`
- Unit & Contract Tests: `npm test`
- Headless Runner: `npm run headless -- --scenario <path> [--out <path>] [--pretty]`
- Full Verification Gate: `npm run verify`
- Production Build: `npm run build`

## Architecture Boundaries (STRICT)
1. **`src/core/` MUST pass `scripts/check-core-purity.mjs` (0 violations).**
   - ZERO imports from `three`, `window`, `document`, DOM APIs, or `node:*`.
   - ZERO non-deterministic calls (`Math.random()`, `Date.now()`, `performance.now()`). Always use `src/core/rng.ts`.
   - Fixed timestep (`DT = 0.05`s, 20 Hz). Identical seed + inputs MUST produce bit-identical JSON and SHA-256 digest.
2. **Phase 3 Invariants (Lantern Oil, Decay & Resonance Chain):**
   - `player.lanternOil` (`0..100`) replaces discrete `hp`. Mist drains `-1.8/s`, sanctuary recharges `+12/s`, shadow hit costs `35`.
   - Lit lanterns decay (`-8/s`) when an unrepelled shadow is within `9.0` units and `litCount < 2`; `litCount >= 2` activates `resonanceActive` (`+4/s` recovery).
3. **`src/render/` and `src/audio/` are presentation-only.** They read `GameState` snapshots and NEVER mutate simulation rules or alter headless outputs.
4. **`src/headless/` is the single Test Contract adapter** declared by `test-contract.json`.

## Rule-Change & Test-Migration Policy (STRICT)
- **Zero Silent Skips:** `scripts/check-no-skipped-tests.mjs` blocks `.skip`, `xit`, `xtest`, `xdescribe`.
- **ADR First:** When a ticket replaces an existing rule, record exact impacts in `docs/notes/phase-N-change-log.md` and migrate tests explicitly.
- **Independent Review & Proof:** Follow `.agents/skills/review-diff/SKILL.md` and capture real outputs via `scripts/capture-proof.mjs`.
- **Protect Upstream Docs:** Never edit `GUIDE.md`, `CHECKPOINTS.md`, `RUBRIC.md`, `RULES.md`, or `SUBMISSION.md`. Never commit `.env` or secrets.
