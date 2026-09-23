# Code Review Report

Reviewer: Code Review Agent

Date: 2026-09-18

Task-ID: TASK-036, TASK-037, TASK-038 (Iteration 8 — Compression System Fix)

---

# Review Summary

Overall Status:

Pass

Summary:

Iteration 8 fixes two movement-target bugs (BUG C in `CompressionSystem`, BUG D in `RightWall`) and adds regression coverage. The reviewer independently re-verified all 12 acceptance criteria (TASK-036 × 4, TASK-037 × 4, TASK-038 × 4) against the live codebase: `npx tsc --noEmit` exits 0, `npx tsc` emits 0 errors, and `node dist/main.js` reports `Passed: 463 / Failed: 0 / Total: 463`. Both bugs are fixed exactly as the spec (`compress-mechanism.md`) requires: the compression movement target now seeds at the moving left-wall column and expands RIGHT only (no left-expansion pulling blocks behind the wall), and the right wall moves only blocks in its own column during vertical shifts (no horizontal BFS dragging). The one point the Task Packets did not specify — behavior at the right-wall boundary — was resolved with a well-justified, necessary decision (DEC-036-1) that prevents an out-of-bounds block move and block loss, and is now pinned by a dedicated test (Test 68f–68j). 2 new Low-severity, non-blocking findings (CR-IT8-001, CR-IT8-002). Neither blocks Iteration 8 completion.

---

# Acceptance Criteria Review

## TASK-036 — Fix CompressionSystem Movement Target

### AC 1: Movement target uses the left wall column

Status: Pass

Evidence:

- `src/CompressionSystem.ts` L82: `compress(leftWallX)` calls `this.pushBlocksRight(leftWallX)`; L149 `pushBlocksRight` calls `this.buildMovementSet(leftWallX)`; L176-184 `buildMovementSet` seeds from `this.field.get(leftWallX, y)` for every row.
- No code path seeds from `rightWall.x - 1`: grep for `rightWall.x - 1` / `wallX - 1` / `COLS - 2` / `rightWall.getX() - 1` in `CompressionSystem.ts` returns no matches.
- `this.rightWall.getX()` is still read, but only as the RIGHT boundary of expansion/validation (L171, L195, L218, L224), never as a seed source.

Notes: Matches the spec basis `compress-mechanism.md` L29 ("壁に接触しているブロックを移動対象へ追加する").

### AC 2: Movement target expands only to the right

Status: Pass

Evidence:

- `buildMovementSet` L190-203: for each queued block it inspects only `rightX = current.x + 1`; an occupied right neighbor not already in the set is added and enqueued. Expansion stops at the right-wall column (`rightX > wallX` → `continue`, L195).
- No left-neighbor inspection exists: grep for `x - 1` / `x-1` / `leftX` in `CompressionSystem.ts` returns no matches (the old `wrapX(current.x - 1)` expansion is gone).

### AC 3: Existing compression movement test encodes corrected behavior

Status: Pass

Evidence:

- Test 13 (`src/main.ts` L627-660) rewritten. Independently executed (`node dist/main.js`): blocks at (10..14,4) with the left wall at x=14 → (14,4) moves to (15,4), (10..13,4) all remain, block count stays 5. Output matches the report verbatim (9 assertions, all PASS).

### AC 4: Build and test suite pass

Status: Pass

Evidence:

- `npx tsc --noEmit` → exit status 0.
- `npx tsc` (emit) → 0 errors; `node dist/main.js` → `Passed: 463 / Failed: 0 / Total: 463`.

---

## TASK-037 — Fix RightWall Vertical Block Movement

### AC 1: `moveBlocksVertical` moves only the wall column

Status: Pass

Evidence:

- `src/RightWall.ts` L82-108: `moveBlocksVertical` iterates `y = 0..Field.ROWS - 1` and collects only cells where `this.field.get(this.x, y)` is true (L86-90), then clears and re-sets them with `wrapY(cell.y + dy)`. No BFS/left-expansion: grep for `leftX` / `x - 1` / `x-1` / `inSet` returns only a JSDoc line stating "No BFS expansion into adjacent columns".

### AC 2: A left-adjacent connected block stays in place during a vertical shift

Status: Pass

Evidence:

- Test 67 (`src/main.ts` L2758-2788), 8 assertions, all PASS on independent run: (15,3)→(15,4) with (14,3) left in place (count 2), plus a multi-row wrapping case ((15,0)/(15,7)/(14,0), `shiftVertical(-1)`, (14,0) stays, count 3).

### AC 3: Existing right-wall unit tests remain valid

Status: Pass

Evidence:

- Read and re-ran: Test 9 (wall wrapping, L496-528), Test 10 (wall-column blocks move by `dy`, L534-566), Test 34 (ArrowUp→`shiftVertical(-1)` / ArrowDown→`shiftVertical(1)` through `Game.processInput`, L1355-1375). All PASS unchanged. `Game.processInput` (L370-376) maps WALL_UP→-1 / WALL_DOWN→1, consistent with the direction mapping the tests assert.

### AC 4: Build and test suite pass

Status: Pass

Evidence: `npx tsc --noEmit` exit 0; `node dist/main.js` 463/463, Failed: 0.

---

## TASK-038 — Add Regression Coverage For Corrected Movement Targets

### AC 1: `CompressionSystem` movement-set regression test

Status: Pass

Evidence:

- Test 68 (`src/main.ts` L2802-2838), 11 assertions, all PASS on independent run. Scenario A (L2804-2822) implements the packet verbatim: chain (10..14,4), `compress(14)`, (10..13,4) remain, (14,4) vacated, (15,4) occupied, count 5. The additional Scenario B (L2824-2838) pins the DEV-036-1 right-wall abort (chain (13..15,4) aborts atomically, count stays 3) — this was explicitly requested in the dispatch note.

### AC 2: `RightWall` vertical-shift regression test

Status: Pass

Evidence:

- Test 69 (`src/main.ts` L2849-2887), 10 assertions, all PASS on independent run. Scenario A (L2851-2861) implements the packet verbatim: (15,3)+(14,3), `shiftVertical(1)`, (15,3)→(15,4), (14,3) stays, count 2. The additional vertical-chain-at-wall case (L2863-2887) is additive coverage.

### AC 3: Existing movement tests remain semantically correct

Status: Pass

Evidence:

- Verified by reading the existing movement tests and by the full-suite result. LeftWall chain-push tests (47/50/51) assert wall-column + same-row right-neighbor move together; right-wall tests (9/10/34) assert direct wall-column movement; Test 13 (rewritten in TASK-036) asserts (10..13,4) REMAIN, Test 48 asserts the disconnected block stays, Test 51 asserts the cross-row block stays. No test asserts that blocks left of the moving left wall are dragged during compression. Because the full suite passes (463/463), no stale assertion of the old buggy behavior survives (any such assertion would now fail).

### AC 4: Full suite passes

Status: Pass

Evidence: `npx tsc --noEmit` exit 0; `node dist/main.js` 463/463, Failed: 0. Suite total rose 442 → 463 (+21 = 11 + 10 from Tests 68/69), matching the report.

---

# Design Compliance

Assessed against `compress-mechanism.md` and Plan v10.0 decisions.

## BUG C (CompressionSystem) — COMPLIANT

- Spec "移動対象の構築" (L27-37): movement target starts from blocks contacting the wall and expands to the RIGHT through occupied same-row cells. The implementation seeds at `leftWallX` and expands right only. Compliant.
- Spec "停止条件" (L75-79): compression ends when any block in the target cannot move; the configuration is then finalized. The implementation's `canMoveRight`/abort path and the no-movement finalize branch in `compress()` (L98-104) implement this. Compliant.
- The old left-expansion that pulled blocks behind the wall (the reported deformation) is fully removed.

## BUG D (RightWall) — COMPLIANT

- Spec "縦方向ループ" (L99): "壁に接触しているブロックは壁と一緒に移動する" — only blocks contacting the wall move with it. "Contacting" = at the wall's column (`this.x`). The implementation moves only `this.x` cells. A horizontally connected block at `x = this.x - 1` is not contacting the wall and is correctly left in place. Compliant.

## DEC-036-1 (right-wall boundary) — JUSTIFIED AND NECESSARY

- The packet pseudocode ("seed leftWallX, expand right") did not define behavior at the right-wall column. Without the boundary rule, a block at `x = rightWall.getX()` (15) would pass `canMoveRight` (its out-of-bounds right neighbor `field.get(16, y)` is `undefined`/falsy, so the "occupied" check fails to trip), and `moveRight` would write `field.set(16, y, true)` — extending the grid row out of bounds and dropping the block from `countBlocks()` (block loss). The boundary check (L195, L224) prevents this and matches the spec stopping condition.
- Independently confirmed by Test 68f–68j (atomic abort, no block loss). This is the correct resolution of the one unspecified point.

## DEC-036-2 (remove `wrapX` from `moveRight`) — CORRECT

- `Field.wrapX` is a clamp, not a wrap (Field.ts L43-45). Removing the misleading call site is safe because `canMoveRight` now guarantees every target is in-bounds. Grep confirms `wrapX` no longer appears in `CompressionSystem.ts`.

## Design Deviations

- DEV-036-1 (right-wall boundary rule): legitimate — a necessary correctness rule for the unspecified boundary, documented with rationale and pinned by a test.
- DEV-038-1 (dedicated regression tests overlap Tests 13/67): legitimate — the packet predates the re-authored Tests 13/67; the packet's Objective calls for a dedicated regression test, and each new test adds a scenario the existing test lacks (right-wall abort; vertical chain at wall). The overlap is intentional regression pinning and is disclosed (LIM-038-1).

---

# Findings

## CR-IT8-001

Severity: Low

Category: Maintainability / Code Clarity

Description:

The `pushBlocksRight` loop (`src/CompressionSystem.ts` L147-157) can execute at most ONE movement per `compress()` call. After `moveRight`, every seeded block has moved to `x+1`; because blocks only move right and no block in the movement set ever sits at `x < leftWallX`, the seed column `leftWallX` is empty on the next `buildMovementSet(leftWallX)` call, so the loop terminates. The multi-iteration structure (which mirrors the spec's "repeat until can't move") is therefore vestigial in practice.

Evidence:

- `buildMovementSet` seeds only from `field.get(leftWallX, y)` (L176-184) and expands to `x+1` only (L194-201).
- `moveRight` maps every cell to `{ x: cell.x + 1, y }` (L245-247) — no cell can return to column `leftWallX`.
- In the default game flow `compress()` is only reached when `shouldCompress` is true (threshold 1 → `leftWallX >= rightWall.x - 1`), i.e. `leftWallX = 14`, where the contact block is already adjacent to the right wall and one step packs it there. So the single-pass behavior produces the correct result.

Impact:

No correctness defect. A future reader could reasonably expect multi-step packing within one `compress()` call (the loop shape suggests it), or attempt a misguided "fix" that changes the seed column to persist — which would reintroduce pulling blocks that are behind the wall. With a non-default `threshold > 1`, a contact block would move only one column instead of packing fully to the wall (not reachable in the default game).

Recommendation:

Add a brief comment in `pushBlocksRight` (or `buildMovementSet`) stating that re-seeding at a fixed `leftWallX` makes the loop single-pass in practice: the seed column is emptied after one move, so "repeat until can't move" terminates after at most one movement. No behavior change required.

---

## CR-IT8-002

Severity: Low

Category: Documentation (cosmetic)

Description:

The `@param` block of `RightWall.shiftVertical` is indented inconsistently within its JSDoc.

Evidence:

- `src/RightWall.ts` L53-65: the surrounding JSDoc lines use a 5-space + `*` prefix, but L61-64 use a 6-space + `*` prefix (`      * @param dy ...` vs `     * ...`). Introduced during the TASK-037 JSDoc rewrite.

Impact:

Cosmetic only. No behavioral or semantic effect; standard JSDoc tooling still parses the `@param` tag.

Recommendation:

Normalize L61-64 to the 5-space JSDoc prefix to match the rest of the block. No behavior change required.

---

# Positive Observations

- Both root-cause fixes are minimal deletions/re-targets of the exact offending code (left-expansion removed in both `CompressionSystem.buildMovementSet` and `RightWall.moveBlocksVertical`); no unrelated logic was touched, keeping the diff reviewable and low-risk.
- DEC-036-1 correctly identified and closed a real out-of-bounds / block-loss hazard that the packet pseudocode left unspecified, and the hazard is pinned by a dedicated atomic-abort test (Test 68f–68j) — good defense-in-depth.
- The regression tests (68/69) are self-contained and additive: each implements its AC scenario verbatim and adds one scenario the pre-existing behavioral test (13/67) does not cover, so coverage grows rather than duplicating silently (LIM-038-1 discloses the intentional overlap).
- JSDoc across the changed classes was updated to describe the corrected algorithm (seed-at-wall + right-only expansion; wall-column-only vertical shift), so the code and its documentation no longer contradict each other.
- The implement report's evidence (test counts 434→442→463, assertion breakdowns, DEC/DEV/LIM IDs) matches the independently observed state exactly, including the per-assertion test output for Tests 13/68/69.

---

# Review Assessment

## Requirement Compliance

Summary: All 12 acceptance criteria across TASK-036/037/038 are met and independently verified. The two confirmed bugs (BUG C, BUG D) are fixed per spec; the full suite passes (463/463) with 0 TypeScript errors.

## Design Compliance

Summary: Implementation conforms to `compress-mechanism.md` (movement-target construction, movement judgment, simultaneous move, stopping condition, vertical-loop wall-slide rule) and to Plan v10.0 decisions 036-1/036-2/037-1. The one unspecified boundary case was resolved soundly and necessarily (DEC-036-1). Deviations DEV-036-1 and DEV-038-1 are legitimate and well-documented.

## Code Quality

Summary: Clean, minimal, single-responsibility changes. Simultaneous-update pattern preserved (compute-then-apply) in both `moveRight` and `moveBlocksVertical`. No magic numbers introduced (boundary uses `rightWall.getX()`; row loops use `Field.ROWS`). Two Low cosmetic/clarity nits (CR-IT8-001, CR-IT8-002); no Critical/High/Medium defects.

## Test Coverage

Summary: Strong. Direct unit coverage for both fixes (Tests 13, 67), dedicated regression coverage pinning the corrected invariants plus the previously-untested right-wall abort (Tests 68, 69), and unchanged Game-level integration tests (35/37/42/64) that still pass. The passing full suite is itself evidence that no stale assertion of the old buggy behavior remains. Residual gap: no test explicitly pins "exactly one column moved per `compress()` call" (see CR-IT8-001); this is implicitly covered by the final-position assertions.

## Maintainability

Summary: Good. Documentation and code agree. The one structural smell is the vestigial multi-iteration push loop (CR-IT8-001), which is correctly behaving but could mislead a future reader; a one-line comment would close the gap.

---

# Review Notes

- Verification was by independent source inspection + a fresh `npx tsc`/`node dist/main.js` run, not by `git diff`: the repository has no commit baseline (all files untracked, `git log` reports no commits), so file-level scope attribution per task (e.g. "TASK-038 touched only `src/main.ts`") could not be diff-verified. The net functional state (fixes in `CompressionSystem.ts`/`RightWall.ts`, tests in `main.ts`) is confirmed correct regardless.
- Continue to treat the right-wall column as the hard horizontal boundary for compression; if the right wall's x ever becomes configurable or the field gains horizontal looping, DEC-036-1's `rightWall.getX()`-based boundary (rather than a `Field.COLS` literal) is the correct thing to keep.
- Test determinism is a standing backlog item (Test 42's random spawns historically made the total vary 276–279); the current fixed 463 total is stable across the reviewer's runs, but this remains a future improvement, not an Iteration 8 concern.

---

# Overall Assessment

Strengths:

- Correct, spec-faithful fixes for both movement-target bugs with minimal, reviewable diffs.
- A real out-of-bounds/block-loss hazard (unspecified in the packet) was caught, fixed, and regression-pinned.
- Comprehensive, additive regression coverage; full suite green (463/463) with 0 TS errors.

Risks:

- CR-IT8-001: the single-pass push loop is vestigial and could mislead a future change (Low, non-blocking).
- No other material risks identified for Iteration 8.

Conclusion:

PASS. All Iteration 8 acceptance criteria are met and independently verified; both bugs are fixed per spec; design decisions are justified. The 2 Low findings are non-blocking and are follow-up candidates. Iteration 8 is complete; per the Bird's Eye Rule (no READY/RUNNING/REVIEW/BLOCKED tasks remain, DONE tasks exist), the Bird's Eye Review Agent may now run.
