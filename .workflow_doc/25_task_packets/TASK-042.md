# Task Packet

TASK-ID: TASK-042
Title: Split the Monolithic Test Suite into Component Files
Priority: High
Dependencies: TASK-040

---

# Objective

Move all test sections from `src/main.ts` (2,903+ lines after TASK-040) into component test files under `src/tests/`, leaving `main.ts` as a thin entry point. The split is a **verbatim move**: no test logic is changed, no assertions are added or removed, no section is renumbered.

---

# Business Context

`src/main.ts` has crossed the ~400-line split threshold recommended by the 2026-08-21 Bird's Eye Review (Debt-010, Risk-BE-005). A 2,900+ line test file is difficult to navigate, costly in agent context, and makes per-task diff attribution hard. Splitting by component makes each file self-contained, improves readability, and keeps the `npx tsc && node dist/main.js` entry flow unchanged (Constraint: no external test framework).

---

# Scope

## In Scope

### Target

- `src/main.ts` — reduced to a thin entry point (~15 lines).
- `src/tests/harness.ts` (new) — `assert()`, `section()`, counters, `printSummary()`.
- `src/tests/mocks.ts` (new) — all test doubles and RAF overrides.
- `src/tests/game.test.ts` (new)
- `src/tests/activePiece.test.ts` (new)
- `src/tests/compression.test.ts` (new)
- `src/tests/leftWall.test.ts` (new)
- `src/tests/rightWall.test.ts` (new)
- `src/tests/input.test.ts` (new)
- `src/tests/renderer.test.ts` (new)
- `src/tests/effects.test.ts` (new)
- `README.md` — structure tree update (add `src/tests/`).

## Out of Scope

- Changing any test logic, assertions, or section names.
- Adding or removing test sections.
- Renumbering tests.
- Changing the harness API (`assert`, `section`, `printSummary`).
- Changing production source files (`src/Game.ts`, `src/Field.ts`, etc.).
- Changing `tsconfig.json` (already covers `src/tests/` via `include: src/**/*`).
- The dist check script (TASK-041).

---

# Constraints

## DEC-042-1: Module-scope execution (verbatim move)

Priority: Required

Description:

Each component test file is a flat ES module. Its body executes top-to-bottom at import time. Tests are NOT wrapped in functions, NOT registered to a central runner, NOT in a class. The `section()` and `assert()` calls execute at module evaluation time, exactly as they do in the current monolithic `main.ts`.

Rationale: This is a verbatim move. Wrapping tests in functions would change the execution model and risk subtle timing/ordering differences.

## DEC-042-2: `main.ts` is a thin entry point

Priority: Required

Description:

After the split, `src/main.ts` contains ONLY:

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

The `printSummary()` call is the last statement. It preserves the exact summary format and throws on failure (so `node dist/main.js` exits non-zero on any failure).

Rationale: Keeps the documented `npx tsc && node dist/main.js` flow unchanged. Import order: mocks first (RAF overrides must exist before any test body), then component files (order among components does not matter — no cross-file shared state), then summary.

## DEC-042-3: Import rule for component test files

Priority: Required

Description:

Component test files import **only** from `./harness.js` and `./mocks.js`. They never:
- Import from another component test file.
- Construct mocks directly (mocks are imported from `./mocks.js`).
- Import production source files directly (production files are imported by `mocks.js` or by the test file only for type imports).

Wait, actually component test files DO need to import production source files (Game, Field, ActivePiece, etc.) to construct test objects. Let me re-state:

Component test files may import:
- `./harness.js` — for `assert`, `section`.
- `./mocks.js` — for test doubles (`TestLeftWall`, `TestGame`, `MockCanvas`, etc.).
- Production source files (`../Game.js`, `../Field.js`, etc.) — for the classes under test.

They must NOT import:
- Another component test file.
- `./harness.js`'s internal state directly (use the exported functions only).

Rationale: F-IT9-07 — without this rule, the Implement Agent may create circular dependencies between component files or miss an import (runtime `ReferenceError` not caught by `tsc`).

## DEC-042-4: `harness.ts` exports

Priority: Required

Description:

`src/tests/harness.ts` exports:
- `assert(condition: boolean, message: string): void` — increments the pass/fail counter, prints on failure.
- `section(name: string): void` — increments the section counter, prints the section header.
- `printSummary(): void` — prints the final summary (total assertions, passed, failed, sections) and throws if failed > 0.
- Internal counters are module-private (not exported).

The harness is a verbatim move of the existing harness code from `main.ts` (the `assert`, `section`, and `printSummary` functions plus their counter variables).

Rationale: The harness is the only shared infrastructure. Keeping it in one file prevents counter duplication.

## DEC-042-5: `mocks.ts` exports

Priority: Required

Description:

`src/tests/mocks.ts` exports all test doubles and side-effectful setup:
- `TestLeftWall` (with `currentTimeMillis()` override and `advanceMockTime()`).
- `TestGame` (with `randomSource()` override, added in TASK-040).
- `MockCanvas`, `MockRenderContext`, `MockRenderCanvas`, `MockGameCanvas`.
- RAF override side effects: `requestAnimationFrame` / `cancelAnimationFrame` global overrides (the code currently at `main.ts:1222-1237`).
- `gameTick`, `gameTicks` (the RAF frame counter used by some tests).

The RAF overrides are **module-scope side effects**: they execute at `mocks.js` evaluation time (before any component test body runs). This is guaranteed by the import order in `main.ts` (mocks imported first).

Rationale: F-IT9-07 verified that the RAF override is a module-scope side effect that must execute before any test body. ESM guarantees imported modules evaluate before the importing module body, in import order.

## DEC-042-6: Component file grouping (8 files, F-IT9-06 applied)

Priority: Required

Description:

| File | Tests | Rationale |
|---|---|---|
| `game.test.ts` | 1, 34, 36, 42, 43, 44, 45, 46, 64 | Game state machine, full-flow integration, restart, wall contact |
| `activePiece.test.ts` | 2, 3, 6, 14, 15, 65 | ActivePiece unit tests; Test 6 merged in (F-IT9-06: tests `ActivePiece.getOccupiedCells()`, not `Field`) |
| `compression.test.ts` | 7, 8, 13, 41, 68, 70 | CompressionSystem behavior, movement target, no-movement path |
| `leftWall.test.ts` | 4, 5, 5b, 47-54, 56, 62, 66 | LeftWall, BFS chain push, dynamic speed, wall advancement |
| `rightWall.test.ts` | 9, 10, 69 | RightWall vertical shift |
| `input.test.ts` | 17-22 | InputManager (shares the `actions` module-scope const) |
| `renderer.test.ts` | 23-30, 60, 61 | Renderer (shares `testField`/`testPiece`/`testLeftWall`/`testRightWall` consts) |
| `effects.test.ts` | 57-63 | EffectSystem |

Rationale: Grouping is driven by (1) module-scope variable sharing (tests that share a `const` must be in the same file) and (2) component ownership. F-IT9-06: Test 6 is merged into `activePiece.test.ts` (it tests `ActivePiece.getOccupiedCells()`; `Field` appears only as a constructor argument).

## DEC-042-7: Within-file module-scope variables stay with their tests

Priority: Required

Description:

Module-scope `const`/`let` variables that are shared by multiple tests within a group must be declared at the top of the component file (before the tests that use them), exactly as they are in the current `main.ts`. Examples:

- `input.test.ts`: the `actions` const (used by Tests 17-22, 45) is declared at the top of the file.
- `renderer.test.ts`: the `testField`, `testPiece`, `testLeftWall`, `testRightWall` consts (used by Tests 23-30, 60, 61) are declared at the top.
- `game.test.ts`: the `runBrowserFrame` function (used by Test 46) is declared at the top.
- `activePiece.test.ts`: the `field`/`piece` consts (used by Tests 2-3) are declared at the top.

These are verbatim moves — the variable declarations are moved to the top of the component file, and the tests that reference them are in the same file.

Rationale: F-IT9-07 verified these are the only cross-test shared variables within a component group. Moving them to file scope preserves the execution semantics.

---

# Implementation Notes

### Step 1: Capture the pre-split baseline

Before making any changes:
1. Run `npx tsc && node dist/main.js` twice.
2. Record:
   - The total assertion count (should be the same both times — determinism check).
   - The number of `section(` calls in `src/main.ts` (should be 71 after TASK-040 added Test 70).
   - The list of section names (for the "same set of sections" AC).
3. Record this baseline in the implement report.

### Step 2: Create `src/tests/` directory and `harness.ts`

1. Create the `src/tests/` directory.
2. Create `src/tests/harness.ts`:
   - Move the `assert()`, `section()`, and `printSummary()` functions from `main.ts` verbatim.
   - Move the counter variables (`totalAssertions`, `failedAssertions`, `sectionCount`, etc.) verbatim.
   - Export `assert`, `section`, `printSummary`.
   - The counters are module-private (not exported).
3. Verify: `npx tsc --noEmit` still passes (the new file is valid TypeScript).

### Step 3: Create `src/tests/mocks.ts`

1. Create `src/tests/mocks.ts`:
   - Move `TestLeftWall` class verbatim.
   - Move `TestGame` class verbatim (added in TASK-040).
   - Move `MockCanvas`, `MockRenderContext`, `MockRenderCanvas`, `MockGameCanvas` classes verbatim.
   - Move the RAF override code (the `requestAnimationFrame`/`cancelAnimationFrame` global overrides) verbatim. These are module-scope side effects.
   - Move `gameTick`, `gameTicks` variables verbatim.
   - Export all test doubles.
   - The RAF overrides execute at module evaluation time (side effect).
2. Verify: `npx tsc --noEmit` still passes.

### Step 4: Create component test files

For each component file, follow this pattern:

1. Create the file.
2. Add the imports:
   ```ts
   import { assert, section } from './harness.js';
   import { TestLeftWall, MockCanvas, ... } from './mocks.js';
   import { Game, Field, ... } from '../Game.js'; // production imports as needed
   ```
3. Move the module-scope variables (if any) to the top of the file.
4. Move the test sections verbatim (the `section(...)` calls and all `assert(...)` calls within each section).
5. Verify: `npx tsc --noEmit` still passes.

**Order of component files** (does not matter for correctness, but follow this for consistency):
1. `game.test.ts`
2. `activePiece.test.ts`
3. `compression.test.ts`
4. `leftWall.test.ts`
5. `rightWall.test.ts`
6. `input.test.ts`
7. `renderer.test.ts`
8. `effects.test.ts`

### Step 5: Reduce `main.ts` to the thin entry

1. Replace the entire content of `src/main.ts` with the thin entry (DEC-042-2).
2. Remove all test code, harness code, and mock code from `main.ts`.
3. The file should be approximately 15 lines.

### Step 6: Verify count-identity

1. Run `npx tsc && node dist/main.js` twice.
2. Verify:
   - The total assertion count is IDENTICAL to the pre-split baseline.
   - The number of sections is IDENTICAL to the pre-split baseline (71).
   - `Failed: 0`.
   - The output is stable across both runs.
3. If the count differs, the move is NOT a verbatim move — investigate and fix.

### Step 7: Update README structure tree

1. In `README.md`, update the project structure tree (lines 249-267) to include `src/tests/`:
   ```
   ├── src/                        # TypeScript source (game logic + tests)
   │   ├── entry.ts                # Browser entry point
   │   ├── main.ts                 # Test entry point (thin, imports from tests/)
   │   ├── tests/                  # Component test files
   │   │   ├── harness.ts          # Assert-based test harness
   │   │   ├── mocks.ts            # Test doubles & RAF overrides
   │   │   ├── game.test.ts
   │   │   ├── activePiece.test.ts
   │   │   ├── compression.test.ts
   │   │   ├── leftWall.test.ts
   │   │   ├── rightWall.test.ts
   │   │   ├── input.test.ts
   │   │   ├── renderer.test.ts
   │   │   └── effects.test.ts
   │   ├── Game.ts                 # State machine & component coordination
   │   ├── Field.ts                # Grid management with vertical looping
   │   ├── ActivePiece.ts          # Tetrimino shapes, rotation, collision
   │   ├── LeftWall.ts             # Automatic compression wall
   │   ├── RightWall.ts            # Player-controlled vertical boundary
   │   ├── CompressionSystem.ts    # Block packing algorithm (BFS)
   │   ├── InputManager.ts         # Keyboard input handling
   │   ├── Renderer.ts             # Canvas rendering
   │   ├── EffectSystem.ts         # Push/connection effect timing
   │   └── styles.css              # Game UI styles
   ```

### Common pitfalls

- **Missing import**: A test file uses `TestLeftWall` without importing it from `./mocks.js`. `tsc` will NOT catch this (it's a runtime `ReferenceError`). The count-identity check (Step 6) catches missing sections, but a missing mock import within a section would cause a runtime error. Run `node dist/main.js` and check for `ReferenceError`.
- **Wrong import path**: Component files are in `src/tests/`, so production imports use `../Game.js` (one level up), not `./Game.js`.
- **Forgetting the RAF override side effect**: The RAF overrides in `mocks.ts` are module-scope side effects. If `mocks.js` is not imported first in `main.ts`, the overrides don't exist when test bodies run. The import order in DEC-042-2 is critical.
- **Moving a variable to the wrong file**: If a module-scope const is used by tests in two different component files, it CANNOT be moved (it would need to be in both files, duplicating state). F-IT9-07 verified this does not happen — all shared variables are within a single component group.
- **The `section()` function prints a header**: If a section is missing from a component file, the section count drops and the count-identity check fails.

### `tsconfig.json` — no change needed

The current `tsconfig.json` has:
- `rootDir: ./src`
- `outDir: ./dist`
- `include: src/**/*`
- `module: ES2020`

This already covers `src/tests/`. The compiled output will be `dist/tests/*.js`. No `tsconfig.json` change is needed.

### `index.html` / Vite — no change needed

The Vite build uses `src/entry.ts` as the entry point (not `src/main.ts`). The test suite (`main.ts`) is a Node-only artifact. No Vite or `index.html` changes are needed.

---

# Acceptance Criteria

- [ ] `src/main.ts` is approximately 15 lines (the thin entry from DEC-042-2).
- [ ] `src/tests/` contains: `harness.ts`, `mocks.ts`, and 8 component `*.test.ts` files.
- [ ] The same set of section headers as the pre-split baseline (71 sections after TASK-040); each appears exactly once across all component files.
- [ ] The total assertion count is IDENTICAL to the pre-split baseline captured in Step 1 (run ≥2× before and after the move; the count must be stable and unchanged).
- [ ] `npx tsc --noEmit` exits with status 0.
- [ ] `node dist/main.js` reports `Failed: 0`.
- [ ] `node dist/main.js` does not produce any `ReferenceError` or `TypeError` (run ≥2×).
- [ ] No component test file imports from another component test file (verify by inspection: grep for cross-component imports).
- [ ] All component test files import only from `./harness.js`, `./mocks.js`, and production source files (`../`).
- [ ] `npm run build` succeeds.
- [ ] README structure tree includes `src/tests/` with all 10 files listed.

---

# Deliverables

- Updated `src/main.ts` (thin entry point).
- New `src/tests/` directory with 10 files: `harness.ts`, `mocks.ts`, 8 component `*.test.ts` files.
- Updated `README.md` (structure tree).
- Verification output: pre-split and post-split assertion counts, section counts, `npx tsc` and `node dist/main.js` output (≥2 runs each).

---

# References

- `.workflow_doc/20_challenge.md` — F-IT9-03 (AC fixes), F-IT9-06 (Test 6 merge), F-IT9-07 (import rule, ESM ordering verified safe).
- `.workflow_doc/50_birds_eye_review.md` — Debt-010, Risk-BE-005.
- `src/main.ts` — the current monolithic test suite (2,903+ lines).
- `tsconfig.json` — confirms `src/tests/` is already covered.
- `package.json` — `build` script (`tsc`); `postbuild` (unaffected).

---

# Validation Checklist

- [x] TASK-ID exists
- [x] Objective is clear
- [x] Business Context is documented
- [x] Scope is defined
- [x] Constraints are documented
- [x] Acceptance Criteria are measurable
- [x] Deliverables are defined
- [x] All information needed for implementation is present
- [x] Implementable without reading the full Plan
