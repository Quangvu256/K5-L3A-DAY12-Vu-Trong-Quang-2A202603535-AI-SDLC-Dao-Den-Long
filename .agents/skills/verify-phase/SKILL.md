---
name: verify-phase
description: Repeatable verification checklist and proof-capture workflow before tagging any SDLC phase (phase-1 through phase-4).
---

# Skill: Verify Phase & Capture Proof

## When to Use
Run this workflow at the end of every phase (CP1–CP4) BEFORE creating the phase tag (`phase-N`).

## Steps
1. **Check Clean Spec & Assumptions**
   - Verify `docs/notes/assumptions.md` documents all `[ASSUMPTION]` items and Acceptance Criteria (`AC-N.*`) for the current phase.
   - Verify `test-contract.json` matches `src/core/constants.ts` and `src/headless/contract.ts`.
2. **Run Full Verification Gate**
   ```bash
   npm run verify
   ```
   Confirm exit code `0` (`typecheck`, `vitest run`, all `scenarios/*.json` headless runs, and determinism double-run hash match).
3. **Run Production Build**
   ```bash
   npm run build
   ```
   Confirm `dist/index.html` and static JS/CSS assets compile cleanly.
4. **Capture Real Proof Artifacts**
   ```bash
   node scripts/capture-proof.mjs <phase-number>
   ```
   Confirm `docs/proof/phase-<N>/verify-output.txt`, `determinism.txt`, and `scenario-*.out.json` are generated directly by the tool.
5. **Write Traceability & Evaluation**
   - Update `docs/proof/phase-<N>/README.md` mapping every `AC-N.*` to its test/scenario and real proof file (honestly marking any uncompleted item).
   - Update `docs/notes/ai-log.md` with phase evaluation, AI errors caught, harness updates, and token estimate.
6. **Commit & Tag**
   - Confirm `git status` is clean of `.env` or stray artifacts, commit, and tag `phase-<N>`.
