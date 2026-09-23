# Plan

Created By: Plan Agent
Date: 2026-09-23
Version: v11.0
Iteration: 9 (Quality Sweep)

---

# Objective

Perform a quality sweep on the completed Iteration 8 codebase:

1. Establish the git baseline (Risk-005) — the repository has zero commits.
2. Clean up accumulated Low-severity findings (CR-IT5-001, CR-IT8-001, CR-IT8-002).
3. Add determinism hardening to the test suite (LIM-021-2 re-scoped per Challenge F-IT9-02).
4. Add an automated dist-output verification script (CR-IT3-002).
5. Split `src/main.ts` (2,903 lines / 463 assertions) into component test files (Debt-010).

This iteration is maintenance: no game logic changes, no new features.

---

# Current Baseline

- Current iteration before this plan: Iteration 8 (Compression System Fix), COMPLETE.
- Current test suite: 463/463 assertions, Failed: 0.
- Current build: `npx tsc` 0 errors; `npm run build` succeeds.
- Git: zero commits; index contains 1,655 staged files (including ~1,560 under `node_modules/` and `dist/`).
- `.gitignore`: contains `.DS_Store` and `opencode.json` only.

---

# Requirements

- The git baseline must exclude `node_modules/` and `dist/` from the initial commit.
- The `pushBlocksRight` single-pass loop must carry a clarifying comment (do NOT change loop semantics — Risk-BE-008).
- The "one column moved per `compress()` call at threshold 1" invariant must be pinned in a test (Test 70).
- `Game` must expose a `protected randomSource(): number` seam; `TestGame` subclass overrides it with a seeded LCG.
- The dist-output verification must run as part of `npm run build` (postbuild) and check both `dist/index.html` content and `dist/entry.js` existence.
- `src/main.ts` must be split into component test files under `src/tests/` while preserving the `npx tsc && node dist/main.js` entry flow.
- All 463 assertions must still pass after the split (count-identity).
- README must be updated to reflect the new test structure and remove the stale variance note.

---

# Scope

## In Scope

- `.gitignore` — extend with `node_modules/`, `dist/`.
- Git index — clear and re-stage for the baseline commit.
- `src/main.ts` — remove dead tolerance (CR-IT5-001), add `TestGame` class, add Test 70, split into component files.
- `src/CompressionSystem.ts` — add clarifying comment to `pushBlocksRight` (CR-IT8-001).
- `src/RightWall.ts` — fix JSDoc indentation (CR-IT8-002).
- `src/Game.ts` — add `protected randomSource(): number` seam.
- `src/tests/` (new directory) — `harness.ts`, `mocks.ts`, 8 component `*.test.ts` files.
- `scripts/check-dist.mjs` (new) — dist-output verification script.
- `package.json` — append check script to `postbuild`.
- `README.md` — update test count note (remove variance note) and structure tree (add `src/tests/`).
- `.workflow_doc/` — this plan, task packets, project state, next actions.

## Out of Scope

- Changing `pushBlocksRight` loop semantics (comment only; Risk-BE-008).
- Adding new piece types, grid sizes, or gameplay features.
- SRS-style rotation (Debt-002 — future iteration).
- Changing the compression threshold or post-compression wall reset behavior.
- External test frameworks (Constraint-001: no external libraries).

---

# Assumptions

- The assertion count is 463 before any changes in this iteration.
- Test 42 is deterministic under current code (Challenge F-IT9-02 verified: spawn collision is universal across all piece-kind pairs).
- The ESM module evaluation order guarantees that `mocks.js` side effects (RAF overrides) execute before any component test body (Challenge F-IT9-07 verified).
- No cross-section shared variables exist beyond the harness counters and mocks (Challenge F-IT9-07 verified by full main.ts read).
- `tsconfig.json` (`rootDir: ./src`, `include: src/**/*`) already covers `src/tests/` without modification.
- `package-lock.json` must be committed (CI runs `npm ci`).
- `opencode.json` is already in `.gitignore` (contains internal provider URLs) — do not commit.

---

# Constraints

- Constraint-001: No external libraries (HTML, CSS, TypeScript, Canvas API only).
- Constraint-002: Logic/Rendering separation (test files may use mocks but must not couple logic to rendering).
- Risk-BE-008: Do NOT change `pushBlocksRight` loop semantics; comment + pin test only.
- TypeScript ES modules with `.js` import extensions.
- No magic numbers in changed logic.
- Comments explain "why", not "what".

---

# Design Decisions

## Decision-042-1: Module-scope execution (verbatim move, NOT function-wrapping)

Priority: Required

Description:

Each component test file is a flat ES module whose body executes top-to-bottom at import time. Tests are NOT wrapped in functions or registered to a central runner. The `section()` and `assert()` calls execute at module evaluation time.

Rationale:

This is the verbatim move of the existing main.ts structure. Wrapping tests in functions would change the execution model, introduce a registration API, and risk subtle timing/ordering differences. The existing pattern (module-scope execution) is proven and simple. ESM guarantees that imported modules evaluate before the importing module body, in import order, so `main.ts` importing `./tests/mocks.js` first guarantees RAF overrides exist before any test body runs.

## Decision-042-2: `main.ts` becomes a thin entry point

Priority: Required

Description:

`src/main.ts` after the split contains only:

```ts
import './tests/mocks.js';
import './tests/game.test.js';
import './tests/activePiece.test.js';
import './tests/compression.test.js';
import './tests/leftWall.test.js';
import './tests/rightWall.test.js';
import './tests/input.test.js';
import './tests/renderer.test.js';
import './tests/effects.test.js';
import { printSummary } from './tests/harness.js';

printSummary();
```

The `printSummary()` call is the last statement. It preserves the exact summary format and throws on failure (so `node dist/main.js` exits non-zero).

Rationale:

This keeps the documented `npx tsc && node dist/main.js` flow unchanged. The import order is explicit: mocks first (RAF overrides, test doubles), then component files (order among components does not matter — no cross-file shared state), then summary.

## Decision-040-1: RNG seam via protected method override

Priority: Required

Description:

Add `protected randomSource(): number { return Math.random(); }` to `Game`. Replace the direct `Math.random()` call at `Game.ts:410` with `this.randomSource()`. In the test harness, `TestGame extends Game` overrides `randomSource()` with a seeded LCG (mirroring the `TestLeftWall.currentTimeMillis()` / `TestEffectSystem.currentTimeMillis()` pattern).

Rationale:

This matches the project's established override-the-test-double pattern (DEV-027-1, DEV-028-1). A constructor parameter would widen the production API surface for a test-only concern. The seam is `protected`, so it does not appear in the public API.

## Decision-041-1: Standalone dist-check script wired to postbuild

Priority: Required

Description:

Create `scripts/check-dist.mjs` (plain Node ESM, no dependencies). Wire it into `package.json` `postbuild`:

```json
"postbuild": "cp index.html dist/ && sed -i 's|src=\"./src/entry.js\"|src=\"entry.js\"|' dist/index.html && node scripts/check-dist.mjs"
```

The script checks:
1. `dist/index.html` exists.
2. `dist/index.html` contains `src="entry.js"` (the sed-rewritten form).
3. `dist/entry.js` exists (F-IT9-05: the sed rewrite is only half the contract; tsc must have emitted `entry.js`).

Paths are resolved from the script's own URL (`new URL('../dist/index.html', import.meta.url)`), not cwd.

Rationale:

The standard verification flow `npx tsc && node dist/main.js` does NOT run postbuild, so a suite-internal dist check would break that flow. Wiring to postbuild means `npm run build` (used by CI deploy) catches dist problems, while the test flow remains unaffected. F-IT9-05 confirmed this wiring is sound and the Vite flows are unaffected.

## Decision-040-2: Test 70 scope (Challenge F-IT9-04 disposition)

Priority: Required

Description:

Test 70 has two sub-scenarios:
- **(a)** Chain at cols 11..14, `compress(14)` → exactly one column moved (14→15; 11..13 stay). This is a near-duplicate of Test 68's assertions 68b-68e but is kept as an explicit same-call single-step pin (cheap, self-documenting).
- **(b)** Second `compress(14)` with `onLeftWallReset = null` → no movement (empty movement set), field unchanged, returns `true`. This is genuinely new coverage (cross-call idempotency of the no-movement path).

Rationale:

Challenge F-IT9-04 verified both scenarios work as described. (a) is redundant with Test 68 but serves as a focused invariant pin for the CR-IT8-001 comment. (b) is the new coverage: it pins that a second `compress()` call at the same wall position is a safe no-op (field unchanged, returns true, no state corruption).

## Decision-040-3: LIM-021-2 re-scoped as determinism hardening

Priority: Required

Description:

The original premise ("Test 42's random piece spawns cause variable assertion count 276↔279") is **false for current code** (Challenge F-IT9-02: spawn collision is universal — every rotation-0 shape overlaps the fixed piece at x=6..9, y=4..5, so the next spawn always fails → GAME_OVER → the count is already deterministic). The task is re-scoped as **determinism hardening / future-proofing**: add the `randomSource()` seam so that any future change to spawn logic or piece shapes cannot silently reintroduce nondeterminism.

The assertion total will NOT change. The AC is "same total before and after."

Rationale:

The seam is still worth adding: it future-proofs against piece-shape changes, spawn-position changes, or Game logic changes that could make the collision non-universal. The cost is minimal (one method + one subclass override). The AC must not hard-code 463 — the Implement Agent captures the pre-change count at execution time.

## Decision-042-3: Component test file grouping (8 files, F-IT9-06 applied)

Priority: Required

Description:

| File | Tests | Rationale |
|---|---|---|
| `game.test.ts` | 1, 34, 36, 42, 43, 44, 45, 46, 64 | Game state machine, full-flow integration |
| `activePiece.test.ts` | 2, 3, 6, 14, 15, 65 | ActivePiece unit tests; Test 6 merged in (F-IT9-06) |
| `compression.test.ts` | 7, 8, 13, 41, 68, 70 | CompressionSystem behavior |
| `leftWall.test.ts` | 4, 5, 5b, 47-54, 56, 62, 66 | LeftWall + BFS chain push |
| `rightWall.test.ts` | 9, 10, 69 | RightWall vertical shift |
| `input.test.ts` | 17-22 | InputManager (shares `actions` module-scope const) |
| `renderer.test.ts` | 23-30, 60, 61 | Renderer (shares `testField`/`testPiece`/`testLeftWall`/`testRightWall`) |
| `effects.test.ts` | 57-63 | EffectSystem |

Shared infrastructure:
- `harness.ts`: `assert()`, `section()`, counters, `printSummary()`.
- `mocks.ts`: `TestLeftWall`, `TestGame`, `MockCanvas`, `MockRenderContext`, `MockRenderCanvas`, `MockGameCanvas`, RAF overrides, `gameTick`/`gameTicks`.

Rationale:

Grouping is driven by (1) module-scope variable sharing (tests that share a `const` must be in the same file) and (2) component ownership. F-IT9-06: Test 6 (ActivePiece vertical wrapping) is merged into `activePiece.test.ts` rather than a misnamed `field.test.ts`. The `actions` const (Tests 17-22) and the `testField`/`testPiece`/`testLeftWall`/`testRightWall` consts (Tests 23-30, 60, 61) force the input and renderer groupings respectively.

## Decision-042-4: Import rule for component test files

Priority: Required

Description:

Component test files import **only** from `./harness.js` and `./mocks.js`. They never construct mocks directly. Mocks are never imported from component files into other component files.

Rationale:

F-IT9-07: without this rule, the Implement Agent may write a test file that uses a mock without importing it (runtime `ReferenceError` that `tsc` does not catch) or create circular dependencies between component files. The rule makes the dependency graph a strict DAG: `main.ts` → `mocks.js` + component files; component files → `harness.js` + `mocks.js`.

---

# Challenge Summary

Challenge Agent report: `.workflow_doc/20_challenge.md` (2026-09-23).

## F-IT9-01: Git index already contains node_modules/dist (High)

Summary: The index has 1,560 staged files under `node_modules/`/`dist/`; `.gitignore` will not remove them.

Disposition: **Accepted**

Reason: Verified against the live repo. TASK-039 now explicitly clears the index before the baseline commit.

## F-IT9-02: Test 42 nondeterminism premise is wrong (Medium)

Summary: Test 42 is deterministic under current code (spawn collision is universal). The 276↔279 variance is a stale historical observation.

Disposition: **Accepted**

Reason: Verified by tracing all 7 shapes against all 7. TASK-040.5 re-scoped as determinism hardening; AC is "same total before and after," not a specific count.

## F-IT9-03: TASK-042 ACs stale/ambiguous (Medium)

Summary: "70 sections" becomes 71 after Test 70; count-identity AC needs a baseline capture step.

Disposition: **Accepted**

Reason: TASK-042 ACs now reference "the same set of section headers as the pre-split baseline" and require an explicit count-capture step.

## F-IT9-04: Test 70(a) duplicates Test 68 (Low)

Summary: (a) is a near-duplicate of 68b-68e; (b) is genuinely new.

Disposition: **Accepted**

Reason: Both kept. (a) serves as a focused invariant pin paired with the CR-IT8-001 comment. (b) is the new cross-call idempotency pin.

## F-IT9-05: Dist check — add entry.js, cwd-independent paths (Low)

Summary: Also assert `dist/entry.js` exists; resolve paths from script URL; note CI blast radius.

Disposition: **Accepted**

Reason: All three recommendations incorporated into TASK-041.

## F-IT9-06: field.test.ts misnamed (Low)

Summary: Test 6 tests ActivePiece, not Field. A `field.test.ts` would mislead readers.

Disposition: **Accepted**

Reason: Test 6 merged into `activePiece.test.ts`.

## F-IT9-07: Module-scope execution verified safe; import rule needed (Low)

Summary: ESM ordering is correct; no cross-section shared variables beyond harness/mocks. The import rule must be explicit in the packet.

Disposition: **Accepted**

Reason: Decision-042-4 codifies the import rule. Written into the TASK-042 packet.

## F-IT9-08: TestGame pattern correct; future clock-seam trap noted (Low)

Summary: The override pattern is correct. Future tests driving the wall via `tick()` must also override the clock seam.

Disposition: **Accepted**

Reason: Noted in TASK-040 implementation notes. No action needed now.

---

# Risks

## Risk-IT9-01: Split introduces a subtle ordering or import bug

Description: Moving 2,903 lines across 10 files could introduce a missing import (runtime `ReferenceError`, not caught by `tsc`), a wrong import order (RAF override missing before a test body), or a module-scope variable that was accidentally shared across sections.

Mitigation: F-IT9-07 verified no cross-section shared variables exist. The import rule (Decision-042-4) prevents circular deps. The count-identity AC (same assertion total, same section set) catches missing tests. The Implement Agent must run the suite ≥2× before and after the move.

## Risk-IT9-02: Baseline commit is polluted (node_modules/dist included)

Description: If the index is not cleared before the commit, the baseline permanently includes build artifacts.

Mitigation: TASK-039 ACs require `git ls-files | grep -c '^node_modules/\|^dist/'` = 0 BEFORE the commit. The command sequence is explicit in the packet.

## Risk-IT9-03: Dist check breaks CI deploy

Description: A broken `check-dist.mjs` fails `npm run build`, blocking the GitHub Pages deploy.

Mitigation: The script is simple (3 file/content checks). TASK-041 ACs require a local `npm run build` to pass before the task is DONE. The blast radius is noted in the packet.

## Risk-IT9-04: `randomSource()` seam is unused (no test exercises it yet)

Description: The `TestGame` override is added but no existing test uses it to drive a different piece sequence. The seam is dormant until a future test needs it.

Mitigation: Accepted. The seam is future-proofing (Decision-040-3). Test 42 uses `TestGame` with the default LCG seed, which produces a deterministic sequence. The seam is exercised (the override is called), even if the sequence happens to produce the same result as the current universal-collision behavior.

---

# Task Breakdown

## TASK-039: Git Baseline

Title: Establish the git baseline commit

Objective: Clear the polluted index, extend `.gitignore`, and make the initial baseline commit.

Dependencies: none

Priority: High

Details: see `.workflow_doc/25_task_packets/TASK-039.md`

## TASK-040: Low Cleanup Bundle + Determinism Hardening

Title: Clean up Low findings and add the RNG seam

Objective: Remove the dead Test 42 tolerance, add the CR-IT8-001 comment + Test 70 pin, fix the CR-IT8-002 JSDoc, add the `randomSource()` seam + `TestGame`, and update the README test note.

Dependencies: TASK-039

Priority: High

Details: see `.workflow_doc/25_task_packets/TASK-040.md`

## TASK-041: Dist Output Verification

Title: Add automated dist-output check to the build pipeline

Objective: Create `scripts/check-dist.mjs` and wire it into `postbuild` so `npm run build` verifies the dist output.

Dependencies: TASK-039

Priority: Medium

Details: see `.workflow_doc/25_task_packets/TASK-041.md`

## TASK-042: main.ts Split by Component

Title: Split the monolithic test suite into component files

Objective: Move all test sections from `src/main.ts` into `src/tests/` component files, leaving `main.ts` as a thin entry point.

Dependencies: TASK-040

Priority: High

Details: see `.workflow_doc/25_task_packets/TASK-042.md`

---

# Execution Order

```
TASK-039 (git baseline)
    ├── TASK-040 (Low cleanup + determinism)
    │       └── TASK-042 (main.ts split)
    └── TASK-041 (dist check) [independent of 040/042]
```

TASK-039 must complete first (all other tasks depend on a clean baseline for `git diff` attribution).
TASK-040 before TASK-042 (the split is a verbatim move of the post-cleanup file; cleanup changes are small and localized, keeping the split diff reviewable as a pure move).
TASK-041 is independent of TASK-040/042 (it touches only `scripts/` and `package.json`).

---

# Deliverables

- This plan (`10_plan.md`, v11.0).
- Task packets: `TASK-039.md`, `TASK-040.md`, `TASK-041.md`, `TASK-042.md`.
- Source changes (from the Implement Agent):
  - `.gitignore` (extended)
  - Git baseline commit
  - `src/main.ts` (reduced to thin entry)
  - `src/tests/` (new: harness, mocks, 8 component test files)
  - `src/CompressionSystem.ts` (comment)
  - `src/RightWall.ts` (JSDoc fix)
  - `src/Game.ts` (randomSource seam)
  - `scripts/check-dist.mjs` (new)
  - `package.json` (postbuild updated)
  - `README.md` (test note + structure tree)
- Updated shared-memory documents (`00_project_state.md`, `90_next_actions.md`).

---

# Open Questions

- None. All Challenge findings have been dispositioned.

---

# Planning Notes

- The 276↔279 variance claim in the README (lines 205-209) and in `00_project_state.md` Workflow Knowledge is **stale** (predates TASK-023's removal of the no-movement/no-reset path). TASK-040 removes it from the README; the Project State entry is corrected in this plan's update.
- If a future iteration changes piece shapes or spawn positions such that the collision is no longer universal, the `TestGame` seeded LCG makes the test sequence reproducible (determinism hardening pays off).
- The `opencode.json` file is in `.gitignore` (contains internal LLM provider URLs). Do not remove it from `.gitignore` or force-commit it.
- `.devcontainer/` and `.github/` are shareable infra — fine to commit in the baseline.
- `package-lock.json` MUST be committed (CI runs `npm ci`).
