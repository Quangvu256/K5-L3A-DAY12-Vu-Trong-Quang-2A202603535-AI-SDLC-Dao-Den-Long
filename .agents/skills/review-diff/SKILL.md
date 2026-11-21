---
name: review-diff
description: Independent pre-tag code and contract review checklist to catch regressions, purity leaks, or weak tests before releasing a phase.
---

# Skill: Review Diff & Invariants

## When to Use
Run before tagging each phase (`phase-2`..`phase-4`) with fresh eyes separate from the implementation step.

## Review Checklist
1. **Core Purity Boundary:**
   - Run `node scripts/check-core-purity.mjs` and confirm zero violations in `src/core/`.
   - Confirm `src/render/` and `src/audio/` only read `GameState` and never alter deterministic state transitions.
2. **Contract Backward Compatibility / ADR:**
   - Compare `test-contract.json` against `src/headless/contract.ts`.
   - Confirm previous-phase scenarios still pass OR breaking changes are explicitly documented in an ADR (`docs/notes/phase-N-change-log.md`) and tests are migrated rather than skipped.
3. **Test Strength Audit:**
   - Check that every Acceptance Criterion (`AC-*`) has both negative/boundary and positive assertions (e.g., Flare fails without fireflies, cooldown prevents double-cast, safe zone blocks chase).
4. **Proof Integrity:**
   - Confirm `docs/proof/phase-N/` files were generated after the final code edit and match `git diff` cleanly.
