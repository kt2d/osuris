# Implementation Report

Author: Implement Agent

Date: 2026-09-01

Task-ID: TASK-035

---

# Task Summary

Title: Doc-Sync — game-design.md Push Speed Wording

Objective: Correct the stale "一定速度" (constant speed) wording in `game-design.md` to reflect that the left wall now uses a dynamic push speed (400ms/tick ramping to 200ms/tick over 10 seconds), as implemented in TASK-027.

Summary: Single-line documentation edit in `game-design.md` (line 53, under the "# 壁" section). The bullet "* 左端から右方向へ一定速度で移動する" was replaced with "* 左端から右方向へ動的速度で移動する（ゲーム開始時 400ms/tick から 10 秒かけて 200ms/tick へ線形加速する）". A full-file read and a repo-wide grep confirmed the constant-speed wording occurred exactly once in `game-design.md` (line 53); the other two passages that mention the wall's movement (line 25 "左側から自動で移動してくる壁が…", line 80 "壁はフィールドブロックを押し込みながら右方向へ移動する") describe direction only, not speed, and were left unchanged. No source or test files were modified. Verified: `npx tsc` 0 errors, `node dist/main.js` 434/434 pass (Failed: 0).

---

# Acceptance Criteria

## Criterion 1

Status: Pass

Pass | Partial | Fail

Evidence: `grep -n "一定速度" game-design.md` returns no matches (exit code 1). The only constant-speed statement in the doc (line 53) has been replaced.

Notes: A repo-wide grep shows remaining "一定速度" occurrences only in `.workflow_doc/` artifacts (10_plan.md, 20_spec_review.md, task packets), which are historical records, not spec, and are outside the packet's scope.

---

## Criterion 2

Status: Pass

Pass | Partial | Fail

Evidence: `game-design.md` line 53 now reads: "* 左端から右方向へ動的速度で移動する（ゲーム開始時 400ms/tick から 10 秒かけて 200ms/tick へ線形加速する）". This matches the implemented behavior: `LeftWall.getTickInterval(elapsedMs)` (TASK-027) ramps linearly from `INITIAL_TICK_INTERVAL_MS = 400` to `MINIMUM_TICK_INTERVAL_MS = 200` over `TICK_RAMP_DURATION_MS = 10000` (10 s), gated from `LeftWall.tick(elapsedMs)` with elapsed time supplied by `Game.updatePlaying()`.

Notes: Wording kept in Japanese and in the doc's concise bullet style, per the packet's instruction to match the surrounding sentence structure.

---

## Criterion 3

Status: Pass

Pass | Partial | Fail

Evidence: The only file modified is `game-design.md` (one-line replacement via the edit tool). No file under `src/`, no test file, and no build configuration were touched. Post-change verification: `npx tsc` 0 errors and `node dist/main.js` 434/434 (Failed: 0), confirming the compiled test suite is byte-identical in behavior to the TASK-034 baseline.

Notes: The repository has no committed baseline (all files untracked), so verification is by edit-tool scope plus the test run rather than `git diff`.

---

# Completed Work

実施内容

- Located the constant-speed passage in `game-design.md` (line 53, "# 壁" section) and confirmed via full-file read + repo-wide grep that it is the only speed description in the doc (packet Edge Case 1).
- Replaced the bullet with the dynamic-speed wording: "動的速度で移動する（ゲーム開始時 400ms/tick から 10 秒かけて 200ms/tick へ線形加速する）", matching the doc's existing bullet style and Japanese language.
- Verified the new wording against the actual implementation (`LeftWall.getTickInterval`: 400ms → 200ms linear ramp over 10 s, per TASK-027 / Decision-026-3).
- Ran the completion-rule verification: `npx tsc` (0 errors) and `node dist/main.js` (434/434, Failed: 0).

---

# Modified Files

## File 1

Path: `game-design.md`

Purpose: Game design spec (primary source of truth for gameplay rules).

Summary of Changes:
- Line 53: "* 左端から右方向へ一定速度で移動する" → "* 左端から右方向へ動的速度で移動する（ゲーム開始時 400ms/tick から 10 秒かけて 200ms/tick へ線形加速する）".
- No other lines changed.

---

# Implementation Decisions

実装時に行った重要な判断

## DEC-035-1

Type: Task Decision

Description: The replacement wording keeps the doc's existing bullet structure ("* 左端から右方向へ…移動する") and appends the dynamic-interval detail in parentheses, rather than using the packet's full-sentence example ("左壁は一定速度ではなく、…").

Reason: The packet explicitly allows "Adjust to match the surrounding sentence structure; keep it in Japanese to be consistent with the rest of the doc." The "# Wall" section is a concise bullet list (4 items, all short single-clause statements); a full sentence would break the section's visual rhythm. The parenthetical carries the complete dynamic-interval information (400ms → 200ms over 10 s) required by AC #2.

Impact: None — all acceptance criteria are met; only surface form differs from the packet's illustrative example.

---

# Design Deviations

Task Packet の設計から変更した内容

None. The change follows the task packet (documentation-only, single passage, dynamic-speed wording in Japanese). DEC-035-1 is a style adjustment sanctioned by the packet itself, not a deviation.

---

# Testing

## Executed Tests

- `npx tsc` — TypeScript compilation check
- `node dist/main.js` — Full test suite (434 assertions)

## Results

Pass

Summary:

- Pre-change baseline: 434/434 pass, Failed: 0 (TASK-034 close-out state).
- Post-change: 434/434 pass, Failed: 0. No assertion count or behavior change (documentation-only edit).
- `npx tsc` 0 errors.

---

# Known Limitations

None introduced by this task.

---

# Deliverables

作成・更新した成果物

- Documentation: `game-design.md` — left-wall speed wording corrected to the dynamic interval (line 53).
- Documentation: This implementation report (`.workflow_doc/30_implement.md`).
- Source Code: none (documentation-only task).
- Tests: none modified (verified 434/434 unchanged).

---

# Review Notes

Code Review Agent に伝えるべき事項

- Single-line edit to `game-design.md` (line 53); no source or test files touched.
- The new wording states the implemented behavior exactly: linear ramp 400ms/tick → 200ms/tick over 10 s (`LeftWall.getTickInterval`, constants from TASK-027).
- AC #1 evidence is greppable: "一定速度" no longer appears anywhere in `game-design.md`.
- Other wall-movement passages (lines 25, 80) describe direction only and were intentionally left unchanged (they contain no speed claim to correct).
- Note: `.workflow_doc/20_spec_review.md` line 45 still contains a stale "一定速度" row in its spec-mapping table. This file is a historical review artifact, not the spec, and is outside TASK-035's scope ("Files NOT Modified: All other files"); flagged here in case a future doc-cleanup task wishes to refresh it.
- This is the sixth and final Iteration 7 task; with it DONE, all six Iteration 7 tasks (TASK-030 through TASK-035) are complete.

---

# Recommended Next Actions

次工程への提案

- [ ] Code Review for Iteration 7 (all 6 tasks now DONE)
- [ ] Bird's Eye Review at the end of Iteration 7 (per the Bird's Eye Rule: no READY/RUNNING/REVIEW/BLOCKED tasks remain)

---
---

# Implementation Report — TASK-036

Author: Implement Agent

Date: 2026-09-08 (dispatch date per Task Packet: 2026-09-03)

Task-ID: TASK-036

---

# Task Summary

Title: Fix CompressionSystem Movement Target

Objective: Fix the movement-target construction in `CompressionSystem` so it follows the compression spec (`compress-mechanism.md`): seed at the moving left wall's column and expand only to the right.

Summary: Fixed BUG C. `compress(leftWallX)` now passes `leftWallX` into `pushBlocksRight(leftWallX)` → `buildMovementSet(leftWallX)`. The movement target seeds at occupied cells in column `leftWallX` and expands RIGHT only (same-row right neighbor). The old code seeded at `rightWall.x - 1` and expanded LEFT, which pulled blocks behind the moving wall into the movement target (the reported left-wall compression/deformation behavior). `canMoveRight()` now rejects a movement set whose rightmost block sits at the right wall's column (the wall is the boundary; such a block cannot move, so compression ends and the configuration is finalized in place per the spec's stopping condition). `moveRight()` no longer routes targets through `field.wrapX()` (horizontal direction does not loop; targets are validated before moving). Test 13 in `src/main.ts` was rewritten to encode the corrected behavior. Verification: `npx tsc --noEmit` exit 0; `npx tsc` 0 errors; `node dist/main.js` 434/434 (Failed: 0, stable over 2 runs); `npm run build` succeeds.

---

# Acceptance Criteria

## Criterion 1: Movement target uses the left wall column

Status: Pass

Evidence:

- `src/CompressionSystem.ts` — `compress(leftWallX)` calls `this.pushBlocksRight(leftWallX)`; `pushBlocksRight(leftWallX)` calls `this.buildMovementSet(leftWallX)`; `buildMovementSet(leftWallX)` seeds from `this.field.get(leftWallX, y)` for all rows.
- The old seed `const seedX = this.field.wrapX(wallX - 1)` (right-wall adjacent column) is removed; no code path seeds from `rightWall.x - 1`.

Notes: The right wall's x (`this.rightWall.getX()`) is still read — but only as the RIGHT boundary of expansion/validation, not as a seed source.

## Criterion 2: Movement target expands only to the right

Status: Pass

Evidence:

- `buildMovementSet(leftWallX)` BFS loop inspects `(current.x + 1, current.y)`; an occupied right neighbor not already in the set is added and enqueued.
- No left-neighbor inspection exists in the code (the old `leftX = wrapX(current.x - 1)` expansion is deleted).
- Expansion stops at the right wall column (`rightX > wallX` → block cannot move; see DEC-036-1).

## Criterion 3: Existing compression movement test encodes corrected behavior

Status: Pass

Evidence: Test 13 in `src/main.ts` rewritten. Run output (`node dist/main.js`):

```text
=== Test 13: CompressionSystem compress moves blocks right ===
  PASS: Field has 5 blocks before compression
  PASS: compress returns true
  PASS: Block moved to (15,4) (right wall column)
  PASS: Old position (14,4) cleared
  PASS: Block remains at (10,4) (behind the wall, not in movement target)
  PASS: Block remains at (11,4) ... (12,4) ... (13,4) (behind the wall, not in movement target)
  PASS: Block count unchanged after compression
```

Blocks at (10,4)–(13,4) remain in place; only (14,4) moves to (15,4); block count remains 5.

## Criterion 4: Build and test suite pass

Status: Pass

Evidence:

- `npx tsc --noEmit` → exit status 0 (0 errors).
- `npx tsc` (emit) → 0 errors; `node dist/main.js` → `Passed: 434 / Failed: 0 / Total: 434` (identical over 2 consecutive runs).
- `npm run build` (tsc + postbuild) succeeds; `dist/index.html` references flat `entry.js`.

---

# Completed Work

- Rewrote `CompressionSystem.buildMovementSet()` to seed at the moving wall's column (`leftWallX`) and expand RIGHT only, per `compress-mechanism.md` "移動対象の構築".
- Routed `leftWallX` through `compress()` → `pushBlocksRight()` → `buildMovementSet()` (movement target re-seeded at the wall column every step, re-computed each compression step).
- Added the right-wall boundary rule to `canMoveRight()` and removed the `wrapX` clamp from `moveRight()` (see DEC-036-1/2).
- Updated class/method JSDoc to describe the corrected algorithm.
- Rewrote Test 13 in `src/main.ts` (9 assertions → 9 assertions; suite total unchanged at 434).
- Verified all compression-path tests unchanged: Tests 12/14/15/16 (unit), Tests 35/37/42/64 (Game-level integration) — all pass without modification.

---

# Modified Files

## File 1

Path: `src/CompressionSystem.ts`

Purpose: Compression movement-target logic (BUG C fix).

Summary of Changes:

- `compress(leftWallX)` passes `leftWallX` to `pushBlocksRight(leftWallX)`.
- `pushBlocksRight(leftWallX)` passes the wall column to `buildMovementSet(leftWallX)`.
- `buildMovementSet(leftWallX)`: seeds from occupied cells in column `leftWallX`; BFS expands RIGHT only (same-row right neighbor); expansion stops at the right wall's x.
- `canMoveRight()`: a block whose right neighbor is beyond the right wall's column cannot move (movement ends, configuration finalized in place).
- `moveRight()`: simultaneous move to `x + 1` directly (no `wrapX` clamp).
- Class JSDoc updated to the 5-step corrected algorithm.

## File 2

Path: `src/main.ts`

Purpose: Test harness (assert-based harness in the entry file).

Summary of Changes:

- Test 13 rewritten to encode the corrected movement target: with blocks at (10,4)–(14,4) and the left wall at x=14, only the block at (14,4) moves to (15,4); (10..13,4) remain; count remains 5. Header comment records the spec basis. Assertion count unchanged (9).

---

# Implementation Decisions

## DEC-036-1

Type: Task Decision

Description: The right-wall column is a hard boundary for the movement target: `buildMovementSet()` does not expand past `rightWall.getX()`, and `canMoveRight()` returns false for any block at the right wall's column.

Reason: The Task Packet pseudocode ("seedX = leftWallX; expand right") does not state what happens at the right wall. Without a boundary rule, a chain reaching column 15 would be validated as movable (`wrapX(16) = 15` made the right neighbor of a block at x=15 resolve to x=15 itself, "in the movement set"), and `moveRight()` would clear (15,y) and re-set it — silently deleting the block that was pushed into it. This would break AC 3 (block count must remain 5) and violate the spec's stopping condition ("移動対象内に1つでも移動できないブロックが存在した時点で圧縮を終了する").

Impact: Blocks at the right wall's column are never moved by compression; a chain touching the right wall aborts the move atomically (no partial push, no block loss). Equivalent to the old `Field.COLS` behavior while the right wall sits at x=15 (`Field.COLS - 1`); expressed via `rightWall.getX()` so a future configurable wall position keeps the boundary correct.

## DEC-036-2

Type: Task Decision

Description: `moveRight()` computes new positions as `{ x: cell.x + 1, y: cell.y }` directly instead of `field.wrapX(cell.x + 1)`.

Reason: `Field.wrapX()` is a clamp, not a wrap (`Field.ts` documents "Horizontal direction does NOT loop"). Retaining the clamp in the move step would be misleading now that `canMoveRight()` guarantees every target is in-bounds (right neighbor at most `rightWall.getX()`).

Impact: Behavior-identical under the current configuration; removes a misleading call site. `Field.wrapX()` itself is unchanged (still used by `RightWall`/`LeftWall` code paths that need column clamping).

## DEC-036-3

Type: Task Decision

Description: Test 13 keeps exactly 9 assertions (same count as the old test).

Reason: Preserves the project-state-documented suite total (434) across the fix, so the Code Review Agent can diff assertion counts directly and any future count change is attributable to TASK-037/038.

---

# Design Deviations

## DEV-036-1

Original Decision: (none — the Task Packet did not specify the right-wall boundary behavior)

New Decision: Movement-target construction stops at the right wall's column, and a movement set touching that column cannot move (compression ends, configuration finalized in place).

Reason: Required for AC 2/AC 3 correctness (see DEC-036-1). Recorded as a deviation from the packet's pseudocode comment ("expand right" alone is ambiguous at the boundary) so downstream reviewers can verify the boundary rule directly.

Impact: Matches `compress-mechanism.md` "移動判定"/"停止条件" and the shipped `LeftWall.advanceOccupiedBlocksInColumn()` pattern (TASK-026/030). No test currently exercises "chain touches right wall aborts" — recommended as regression coverage in TASK-038.

---

# Testing

## Executed Tests

- Full assert-based suite: `npx tsc && node dist/main.js` → 434/434, Failed: 0 (run twice; identical output).
- Typecheck-only gate: `npx tsc --noEmit` → exit 0.
- Production flow: `npm run build` → tsc 0 errors + postbuild; `dist/index.html` references `entry.js`.
- Targeted review of rewritten Test 13 output (9/9 PASS) and unchanged compression-path tests: Test 12 (empty-field cycle), Test 14 (full-row abort), Test 15 (chain into empty wall column), Test 16 (reset callback), Tests 35/37/42/64 (Game-level COMPRESSING flow) — all PASS.

## Results

Pass

Summary: No regressions. Suite total unchanged at 434; all compression-path tests pass with the corrected movement target.

---

# Known Limitations

## LIM-036-1

Description: Under the corrected model, blocks at `x < leftWallX` (behind the moving wall) are never moved by compression, even when horizontally connected. If the wall column itself is empty, `compress()` finalizes the configuration in place.

Impact: Intended per spec ("壁に接触しているブロックを移動対象へ追加する" — only contacted blocks are pushed; chains are pulled only to the RIGHT). Reviewers comparing against the old pull-behind-wall behavior (Tests 13/41 before this task) will see the block-count/finalized-in-place assertions change; that is the fix, not a regression.

Possible Future Solution: None needed; TASK-038 should pin the boundary and behind-the-wall cases as explicit regression tests.

---

# Deliverables

作成・更新した成果物

- Source Code: `src/CompressionSystem.ts` (movement target seeded at `leftWallX`, expands right; right-wall boundary; direct x+1 move).
- Tests: `src/main.ts` (Test 13 rewritten to the corrected behavior).
- Documentation: This implementation report (`.workflow_doc/30_implement.md`); Project State and Next Actions updated.

---

# Review Notes

Code Review Agent に伝えるべき事項

- Focus review on DEC-036-1 (right-wall boundary in `buildMovementSet`/`canMoveRight`) — it is not in the Task Packet but is required for block-loss prevention; verify the abort is atomic (all-or-nothing move).
- Verify Tests 12/14/15/16/41/64 are intentionally unchanged: their scenarios do not depend on left-of-wall expansion, so behavior is identical under the corrected algorithm (traced during implementation; all PASS).
- `compress()` still returns true on the no-movement/not-full path (finalize in place + wall reset) — unchanged by this task; TASK-038 should pin it.
- `Field.wrapX()` remains in the codebase for `LeftWall`/`RightWall`; only the `CompressionSystem` call sites were removed.
- Challenge Agent was not used: the Task Packet design is prescriptive (seed column and expansion direction are explicitly specified); the one unspecified point (right-wall boundary) was resolved with documented rationale (DEC-036-1) and is low-risk.

---

# Recommended Next Actions

次工程への提案

- [ ] Dispatch TASK-037 (independent of TASK-036; both READY per the dispatch rule).
- [ ] Dispatch TASK-038 after TASK-036 and TASK-037 are DONE (regression coverage for corrected movement targets; include the right-wall-column abort case from DEV-036-1).
- [ ] Code Review should independently re-verify AC 1–4 against the live codebase.

---
---

# Implementation Report — TASK-037

Author: Implement Agent

Date: 2026-09-13 (dispatch date per Task Packet: 2026-09-03)

Task-ID: TASK-037

---

# Task Summary

Title: Fix RightWall Vertical Block Movement

Objective: Make the right wall move only blocks directly contacting its own column when it shifts vertically.

Summary: Fixed BUG D. `RightWall.moveBlocksVertical()` previously seeded the wall column and then expanded LEFT via BFS, dragging all horizontally connected blocks during vertical shifts. The BFS LEFT expansion is removed; only occupied cells at `this.x` are collected and moved. Updated the class-level JSDoc and `shiftVertical`/`moveBlocksVertical` method JSDocs to reflect the corrected behavior. Added Test 67 (8 assertions) proving that a left-adjacent block is not dragged vertically. Verification: `npx tsc --noEmit` exit 0; `node dist/main.js` 442/442 (Failed: 0); `npm run build` succeeds.

---

# Acceptance Criteria

## AC 1: `moveBlocksVertical` moves only the wall column

Status: Pass

Evidence:

- `src/RightWall.ts` `moveBlocksVertical()` iterates `y = 0..Field.ROWS - 1`, collects cells where `this.field.get(this.x, y)` is true, and moves only those. No BFS expansion exists.
- The `inSet` / BFS LEFT loop is removed. The method is now a simple collect→compute→clear→set sequence scoped to `this.x`.

---

## AC 2: A left-adjacent connected block stays in place during a vertical shift

Status: Pass

Evidence: Test 67 in `src/main.ts` (8 assertions, all PASS):

```text
=== Test 67: RightWall vertical shift does not drag left-adjacent blocks ===
  PASS: 67a: block at (15,3) moved to (15,4)
  PASS: 67b: old position (15,3) cleared
  PASS: 67c: left-adjacent block at (14,3) stays in place
  PASS: 67d: block count unchanged (2 blocks)
  PASS: 67e: block wrapped from (15,0) to (15,7)
  PASS: 67f: block moved from (15,7) to (15,6)
  PASS: 67g: left-adjacent block at (14,0) stays in place
  PASS: 67h: block count unchanged (3 blocks)
```

---

## AC 3: Existing right-wall unit tests remain valid

Status: Pass

Evidence:

- Test 9 (9 assertions): RightWall wrapping behavior verified — all PASS unchanged.
- Test 10 (12 assertions): Blocks at right-wall column move by `dy` — all PASS unchanged.
- Test 34 (2 assertions): ArrowUp/ArrowDown → `shiftVertical` direction mapping — both PASS unchanged.

---

## AC 4: Build and test suite pass

Status: Pass

Evidence:

- `npx tsc --noEmit` → exit status 0 (0 errors).
- `npx tsc` (emit) → 0 errors; `node dist/main.js` → `Passed: 442 / Failed: 0 / Total: 442`.
- `npm run build` (tsc + postbuild) succeeds.

---

# Completed Work

- Removed the BFS LEFT expansion from `RightWall.moveBlocksVertical()` per `compress-mechanism.md` "壁に接触しているブロックは壁と一緒に移動する" and Decision-037-1.
- Updated the class-level JSDoc to state that only blocks at the wall's own x-position move (no horizontal chain dragging).
- Updated `shiftVertical()` and `moveBlocksVertical()` JSDocs to remove references to BFS expansion.
- Added Test 67 (8 assertions) proving that a left-adjacent block stays in place during vertical shifts.
- Verified Tests 9, 10, and 34 pass without modification.
- Suite total: 434 → 442 (+8 assertions from Test 67).

---

# Modified Files

## File 1

Path: `src/RightWall.ts`

Purpose: Right wall vertical shift logic (BUG D fix).

Summary of Changes:

- `moveBlocksVertical()`: removed BFS LEFT expansion (`inSet` Set, while-loop scanning `leftX = current.x - 1`). Method now collects only cells at `this.x` and moves them.
- Class-level JSDoc updated: "Only blocks directly at the wall's x-position move during vertical shifts; horizontally connected blocks in adjacent columns are not dragged."
- `shiftVertical()` JSDoc updated: "Only occupied cells at the wall's own column are moved — no horizontal expansion into adjacent columns."
- `moveBlocksVertical()` JSDoc updated: "Only cells at this.x are moved. No BFS expansion into adjacent columns."

## File 2

Path: `src/main.ts`

Purpose: Test harness.

Summary of Changes:

- Test 67 added (8 assertions): proves that `shiftVertical()` moves only blocks at the wall's column; left-adjacent blocks remain in place. Two scenarios: single shift and multi-row with wrapping.

---

# Implementation Decisions

## DEC-037-1

Type: Task Decision

Description: The `moveBlocksVertical()` method is simplified to a single-pass loop over `y = 0..ROWS-1` checking `field.get(this.x, y)`, eliminating the `inSet` Set and BFS while-loop. No new abstractions introduced.

Reason: The spec is explicit: "壁に接触しているブロックは壁と一緒に移動する" — blocks contacting the wall move with it. "Contacting the wall" means at the wall's x-position. The BFS LEFT expansion was an unsolicited over-interpretation of "contacting" as "connected to blocks that contact."

Impact: Blocks at x < rightWall.x are never moved by a right-wall vertical shift. This is the intended behavior per the spec and the Task Packet.

---

# Design Deviations

None. The implementation follows the Task Packet exactly. The Task Packet AC 1 specifies "Iterate y = 0..Field.ROWS - 1. Move a block only when field.get(this.x, y) is true. Do not expand to (x - 1, y) or any other connected block" — implemented verbatim.

---

# Testing

## Executed Tests

- Full assert-based suite: `npx tsc && node dist/main.js` → 442/442, Failed: 0.
- Typecheck-only gate: `npx tsc --noEmit` → exit 0.
- Production flow: `npm run build` → succeeds.
- Targeted verification: Tests 9, 10, 34, 67 all PASS.

## Results

Pass

Summary: No regressions. Suite total: 434 → 442 (+8 from Test 67). All existing right-wall tests pass unchanged.

---

# Known Limitations

None introduced by this task.

---

# Deliverables

- Source Code: `src/RightWall.ts` (BFS LEFT expansion removed; JSDocs updated).
- Tests: `src/main.ts` (Test 67 added, 8 assertions).
- Documentation: This implementation report (`.workflow_doc/30_implement.md`); Project State and Next Actions updated.

---

# Review Notes

Code Review Agent に伝えるべき事項

- The fix is a deletion: the BFS LEFT expansion loop is removed. Verify no other code path reintroduces horizontal chain expansion in RightWall.
- Test 67 covers both single-row and multi-row scenarios. The multi-row scenario (67e–67h) also verifies vertical wrapping during the shift.
- `compress-mechanism.md` line 99 ("壁を上下へスライドした結果、壁に接触しているブロックは壁と一緒に移動する") is the spec basis. "Contacting the wall" = at the wall's column, not connected to blocks at the wall's column.
- Challenge Agent was not used: the Task Packet is prescriptive and the fix is a straightforward removal.

---

# Recommended Next Actions

次工程への提案

- [ ] Dispatch TASK-038 (regression coverage for corrected movement targets) — TASK-036 and TASK-037 are now both DONE.
- [ ] Code Review should verify that `moveBlocksVertical()` contains no BFS expansion code and that Test 67 assertions match the corrected behavior.

---

# Implementation Report — TASK-038

Author: Implement Agent

Date: 2026-09-13 (dispatch date per Task Packet: 2026-09-03)

Task-ID: TASK-038

---

# Task Summary

Title: Add Regression Coverage For Corrected Movement Targets

Objective: Add focused regression tests that pin the corrected movement-target behavior for both the left-wall compression system (TASK-036) and the right-wall vertical shift (TASK-037).

Summary: Added two dedicated regression tests to `src/main.ts` (no production source modified).

- Test 68 — `CompressionSystem` movement-target regression (11 assertions). Scenario A (AC 1): a chain at (10..14,4) with the left wall at x=14 — only the wall-column block (14,4) moves to (15,4); (10..13,4) stay; count unchanged (5). Scenario B (DEV-036-1 right-wall abort): a contiguous chain reaching the right-wall column (13..15,4) cannot move because the rightmost block has no cell to move into, so the push aborts atomically and no block is lost.
- Test 69 — `RightWall` vertical-shift regression (10 assertions). Scenario A (AC 2): blocks at (15,3) and (14,3); `shiftVertical(1)` moves (15,3)→(15,4) and leaves (14,3) in place; count unchanged (2). Scenario B: a vertical chain at the wall column (15,2)/(15,3)/(15,4) shifts up as a unit while the horizontally-connected neighbour (14,3) stays; wall y wraps 0→7 on `shiftVertical(-1)`.

Verification: `npx tsc --noEmit` exit 0; `node dist/main.js` 463/463 (Failed: 0); `npm run build` succeeds. AC3 verified by inspection of the existing movement tests (Tests 9/10/13/34/47–51). Suite total: 442 → 463 (+21).

---

# Acceptance Criteria

## AC 1: `CompressionSystem` movement-set regression test

Status: Pass

Evidence: Test 68 in `src/main.ts` (11 assertions, all PASS):

```text
=== Test 68: CompressionSystem movement-target regression (TASK-038) ===
  PASS: 68: field has 5 blocks before compression
  PASS: 68a: compress(14) returns true (movement occurred, cycle completed)
  PASS: 68b: blocks at (10..13,4) remain — behind the wall, never pulled into the movement target
  PASS: 68c: (14,4) vacated — the wall-column block moved right
  PASS: 68d: (15,4) occupied — the wall-column block moved into the right-wall column
  PASS: 68e: block count unchanged (5 blocks)
  PASS: 68f: compress(14) returns true (cycle finalizes in place — field not full)
  PASS: 68g: (14,4) stays — the rightmost block (15,4) blocks the push, whole set aborts
  PASS: 68h: (15,4) stays — a block at the right-wall column cannot move out of bounds
  PASS: 68i: (13,4) stays — behind the wall, not in the movement target
  PASS: 68j: block count unchanged (3 blocks) — atomic abort loses nothing
```

AC 1 scenario (chain (10..14,4), `compress(14)`, blocks remain at (10..13,4), (14,4) vacated, (15,4) occupied, count 5) is implemented verbatim as 68/68a–68e. The additional right-wall abort case (68f–68j) is the DEV-036-1 coverage called out in the dispatch note (see Next Actions).

---

## AC 2: `RightWall` vertical-shift regression test

Status: Pass

Evidence: Test 69 in `src/main.ts` (10 assertions, all PASS):

```text
=== Test 69: RightWall vertical-shift regression (TASK-038) ===
  PASS: 69a: wall-column block (15,3) moved to (15,4)
  PASS: 69b: old wall-column position (15,3) cleared
  PASS: 69c: left-adjacent block (14,3) stays — not dragged vertically
  PASS: 69d: block count unchanged (2 blocks)
  PASS: 69e: all three wall-column blocks shifted up together — (15,2/3/4) -> (15,1/2/3)
  PASS: 69f: horizontally-connected block (14,3) stays in place
  PASS: 69g: (15,4) vacated — its block moved up to (15,3)
  PASS: 69h: no block dragged into the adjacent column at (14,2)/(14,4)
  PASS: 69i: block count unchanged (4 blocks)
  PASS: 69j: wall y wrapped from 0 to 7 on shiftVertical(-1)
```

AC 2 scenario (block at (15,3) and (14,3), right wall at x=15/y=0, `shiftVertical(1)`, (15,3)→(15,4), (14,3) stays, count 2) is implemented verbatim as 69a–69d. The vertical-chain case (69e–69j) is additive coverage (see DEV-038-1).

---

## AC 3: Existing movement tests remain semantically correct

Status: Pass (verified by inspection; no source or test changes required)

Evidence:

- LeftWall chain-push tests still assert that the wall-column block and its same-row right-neighbor move together: Test 47 (wall column (3,0)/(3,1) → (4,0)/(4,1), chain (4,0)/(4,1) → (5,0)/(5,1)), Test 50 (`pushedCells=[(4,4)]` wall column, `connectedCells=[(5,4),(6,4)]`), Test 51 ((3,7)→(4,7)→(5,7) same-row chain).
- Right-wall tests still assert direct wall-column movement: Test 9 (`shiftVertical` wrapping), Test 10 (blocks at the wall column move by `dy`), Test 34 (ArrowUp→`shiftVertical(-1)`, ArrowDown→`shiftVertical(1)`).
- No test asserts that blocks left of the moving left wall are dragged during compression: Test 13 (rewritten in TASK-036) asserts blocks at (10..13,4) REMAIN; Test 48 asserts the disconnected block (5,4) stays; Test 51 asserts the cross-row block (4,0) stays.

All referenced tests pass unchanged in the full-suite run (463/463, Failed: 0).

---

## AC 4: Full suite passes

Status: Pass

Evidence:

- `npx tsc --noEmit` → exit status 0 (0 errors).
- `npx tsc` (emit) → 0 errors; `node dist/main.js` → `Passed: 463 / Failed: 0 / Total: 463`.
- `npm run build` (tsc + postbuild) succeeds.

---

# Completed Work

- Added Test 68 (`CompressionSystem` movement-target regression, 11 assertions): AC 1 scenario + DEV-036-1 right-wall abort case.
- Added Test 69 (`RightWall` vertical-shift regression, 10 assertions): AC 2 scenario + vertical-chain-at-wall case.
- Verified AC 3 by reading the existing movement tests (Tests 9/10/13/34/47–51); no changes needed.
- Re-ran the full suite: 442 → 463 (+21). No regressions.

---

# Modified Files

## File 1

Path: `src/main.ts`

Purpose: Test harness (assert-based test suite).

Summary of Changes:

- Test 68 added (11 assertions): `CompressionSystem` movement-target regression — wall-column seed + right-only expansion (AC 1) and right-wall-column abort (DEV-036-1).
- Test 69 added (10 assertions): `RightWall` vertical-shift regression — wall-column-only movement with a left-adjacent block left behind (AC 2) and a vertical-chain-at-wall case.
- No production source files modified (Scope: `src/CompressionSystem.ts`, `src/RightWall.ts`, `src/Game.ts`, `src/Field.ts`, `src/LeftWall.ts`, `src/ActivePiece.ts`, `src/Renderer.ts`, `src/EffectSystem.ts` untouched).

---

# Implementation Decisions

## DEC-038-1

Type: Task Decision

Description: Added two dedicated, self-contained regression tests (Test 68, Test 69) instead of only extending the existing behavioural tests (Tests 13/67). Each new test is written to be independently understandable and to pin the corrected movement-target invariant directly.

Reason: The Task Packet Objective is explicit — "Add focused regression tests that pin the corrected movement-target behavior." A dedicated regression test that survives future refactors of the behavioural tests is the intended deliverable. Each new test is also made additive over the nearest existing test (Test 68 adds the right-wall abort case absent from Test 13; Test 69 adds the vertical-chain-at-wall case absent from Test 67), so the suite gains coverage rather than duplication.

Impact: +21 assertions (442 → 463). Existing tests unchanged.

---

# Design Deviations

## DEV-038-1

Original Decision: AC 1 and AC 2 describe scenarios that overlap existing tests — AC 1's (10..14,4)/`compress(14)` scenario matches Test 13 (rewritten in TASK-036), and AC 2's (15,3)/(14,3)/`shiftVertical(1)` scenario matches Test 67 (added in TASK-037).

New Decision: Implemented the AC 1 and AC 2 scenarios verbatim as dedicated regression tests (Test 68 / Test 69) per the Objective, and extended each with a scenario not present in the existing tests (Test 68: right-wall-column abort; Test 69: vertical chain at the wall column). Documented the overlap so the Code Review Agent does not read the new tests as accidental duplication.

Reason: The Task Packet predates TASK-036/TASK-037 (dated 2026-09-03) and was written before Tests 13/67 were re-authored. The dispatch note in `90_next_actions.md` ("add regression coverage for the corrected movement targets … include the right-wall-column abort case from DEV-036-1") confirms the intent is a dedicated regression test that also covers the abort case.

Impact: No functional deviation from the intended design; the corrected behavior is now pinned by dedicated, self-contained tests. Test suite grows by 21 assertions.

---

# Testing

## Executed Tests

- Full assert-based suite: `npx tsc && node dist/main.js` → 463/463, Failed: 0.
- Typecheck-only gate: `npx tsc --noEmit` → exit 0.
- Production flow: `npm run build` → succeeds.
- Targeted verification: Tests 9, 10, 13, 34, 47–51, 67, 68, 69 all PASS.

## Results

Pass

Summary: No regressions. Suite total: 442 → 463 (+21 from Tests 68–69). All existing movement/compression/right-wall tests pass unchanged.

---

# Known Limitations

## LIM-038-1

Description: Tests 68/69 are dedicated regression tests that overlap the scenario coverage of Tests 13/67 respectively (see DEV-038-1). If a future refactor removes the corrected-behavior assertions from Tests 13/67, the regression coverage in Tests 68/69 remains, but the suite then carries two tests pinning the same invariants.

Impact: Low. Redundant coverage is intentional (regression pinning) and costs only assertion count, not correctness.

Possible Future Solution: If the suite grows large, consolidate the movement-target regression assertions into the behavioural tests and keep a single test per invariant.

---

# Deliverables

- Tests: `src/main.ts` (Test 68 added, 11 assertions; Test 69 added, 10 assertions).
- Documentation: This implementation report (`.workflow_doc/30_implement.md`); Project State and Next Actions updated.
- Source Code: unchanged (test-only task).

---

# Review Notes

Code Review Agent に伝えるべき事項

- This is a test-only task. Verify no production source file under the Scope "Files Not Modified" list was changed (`git diff` should show only `src/main.ts`).
- Test 68 asserts both the movement case (wall-column block moves right) and the abort case (chain reaching the right wall does not move). Confirm the abort case (68f–68j) is understood as the DEV-036-1 right-wall boundary rule, not a contradiction of Test 13.
- Test 69's `shiftVertical(1)` moves the wall DOWN on screen (y increases); `shiftVertical(-1)` moves it UP (y decreases, wrapping 0→7). This matches the TASK-032 `WALL_UP/DOWN` direction mapping and the `RightWall.shiftVertical` JSDoc.
- AC 3 is a verification criterion; it was satisfied by reading the existing tests, not by editing them. If the reviewer prefers literal AC coverage, note that the existing tests already encode the corrected behavior (see AC 3 evidence).

---

# Recommended Next Actions

次工程への提案

- [ ] Dispatch Code Review Agent for Iteration 8 (TASK-036, TASK-037, TASK-038 all DONE). Per the Bird's Eye Rule, no READY/RUNNING/REVIEW/BLOCKED tasks remain and DONE tasks exist, so the Bird's Eye Review Agent may now run at the end of Iteration 8.
- [ ] Code Review should confirm the diff touches only `src/main.ts` and that Tests 68/69 assert the corrected movement-target behavior (wall-column seed + right-only expansion; wall-column-only vertical shift).
