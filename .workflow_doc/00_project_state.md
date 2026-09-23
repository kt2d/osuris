# Project State

Last Updated: 2026-09-23

Updated By: Plan Agent

---

# Project Summary

## Purpose

Horizontal Compression Puzzle Game MVP. Players control a Right Wall and rotate pieces while a Left Wall pushes blocks toward the Right Wall. The goal is to maximize block density through compression.

## Target Users

Single player, browser-based puzzle game enthusiasts.

## Core Features

- 16x8 grid with vertical looping topology
- 7 standard Tetrimino shapes with 90° clockwise rotation
- Automatic Left Wall compression force
- Player-controlled Right Wall (vertical shift)
- Compression system that packs blocks against the Right Wall
- Density-based scoring

## Current Iteration

Iteration 9 (Quality Sweep): PLANNING COMPLETE (2026-09-23). Plan v11.0 created. 4 tasks: TASK-039 (git baseline — clear polluted index, extend `.gitignore`, initial commit), TASK-040 (Low cleanup bundle — CR-IT5-001 dead tolerance, CR-IT8-001 comment + Test 70 pin, CR-008-002 JSDoc, LIM-021-2 re-scoped as determinism hardening via `randomSource()` seam + `TestGame`), TASK-041 (dist check — `scripts/check-dist.mjs` wired to `postbuild`), TASK-042 (main.ts split — 2,900+ lines → thin entry + 10 files under `src/tests/`). Challenge Agent review complete (2026-09-23): design sound; 8 findings all accepted (F-IT9-01 through F-IT9-08); task packets incorporate all corrections. No code changes yet. Baseline: 463/463 tests, `npx tsc` 0 errors, `npm run build` succeeds.

Iteration 8 (Compression System Fix): COMPLETE (2026-09-18). Plan v10.0. 3 tasks: TASK-036, TASK-037, TASK-038 all DONE. Code Review PASS. Bird's Eye Review COMPLETE (project health **Healthy**).

---

## Previous Iterations

Iteration 7 (Bug Fixes): COMPLETE (2026-09-01). Plan v9.0. Fix-at-contact, WALL_UP/DOWN inversion, and rotation stranding were fixed. 6 tasks: TASK-030 through TASK-035 all DONE.

---

Iteration 6 (Balance & Visual Feedback): COMPLETE (2026-08-27). Plan v8.0 created (2026-08-26). 5 tasks: TASK-025 (spawn offset), TASK-026 (BFS chain push), TASK-027 (dynamic speed), TASK-028 (effect system), TASK-029 (test updates). All DONE.

Tasks: TASK-023 DONE (2026-08-22). TASK-024 VERIFICATION DONE (280/280). TASK-025 DONE (2026-08-26, spawn offset). TASK-026 DONE (2026-08-26, BFS chain push, deviation DEV-026-1). TASK-027 DONE (2026-08-26, dynamic speed, deviation DEV-027-1). TASK-028 DONE (2026-08-27, effect system, deviations DEV-028-1/2). TASK-029 DONE (2026-08-27, test updates, Test 64 full game flow, deviation DEV-029-1). All 5 Iteration 6 tasks are DONE. Test suite: 403/403 (was 280).

Code Review (2026-08-25, Iteration 5): Pass. TASK-023 の 7 AC と TASK-024 の 5 AC をレビューが独立検証（tsc 0 errors、280/280、build 成功）。重点項目 DEV-023-1/2 の scope 判断は正当と評価。新規 findings 2 件（いずれも Low、非阻害）: CR-IT5-001（Test 42 の dead tolerance）、CR-IT5-002（plan Assumption の不完全と TASK-024 constraint の stale 数値 276）。Artifact: .workflow_doc/40_code_review.md。

Code Review (2026-08-31, Iteration 6): Pass. TASK-025〜029 の全 38 AC をレビューが独立検証（tsc 0 errors、403/403、build 成功）。4 件の Design Deviation（DEV-026-1/2/8-1/8-2/9-1）はすべて正当と評価。新規 findings 2 件（いずれも Low、非阻害）: CR-IT6-001（30_implement.md 初回報告の「10 箇所」stale）、CR-IT6-002（compression move パスの full game flow 統合テスト欠如）。Artifact: .workflow_doc/40_code_review.md。

Challenge Review (2026-08-26): Iteration 6 Plan review completed. Key findings: Change 1 (spawn offset) Accepted with modifications. Change 2 (BFS chain push) Accepted with modifications. Change 3 (dynamic speed) Accepted. Changes 4-5 (visual effects) Rejected per MVP spec but implemented per user request. Artifact: .workflow_doc/20_challenge.md (to be created).

---

## Previous Iterations

Iteration 4 (Block Push Fix): COMPLETE. LeftWall.advanceOccupiedBlocksInColumn() collision validation bug fixed. All 276 tests pass.

Tasks: TASK-022 (Plan v6.0). DONE.

---

Iteration 3 (Bug Fixes): COMPLETE. Dev server entry point, canvas keyboard focus, and overlapping game loops on restart fixed; README updated with game rules, controls, and corrected test count.

Tasks: TASK-018 through TASK-021 (Plan v5.0). All DONE.

---

## Previous Iterations (Legacy)

Iteration 2 (MVP Completion): COMPLETE. All correctness issues resolved, restart mechanism added, documentation finalized.

Tasks: TASK-014 through TASK-017 (Plan v4.0). All DONE.

Iteration 1 (Quality): COMPLETE. Build process fixed, medium-severity findings resolved, integration tests added, low-severity findings cleaned up.

Tasks: TASK-008 through TASK-013 (Plan v3.0). All DONE.

---

# Architecture

- Field: Grid data management with vertical looping
- ActivePiece: Tetrimino shape, rotation, collision detection
- LeftWall: Horizontal movement, contact detection
- RightWall: Vertical boundary, block group shifting
- CompressionSystem: BFS-based block packing algorithm
- InputManager: Keyboard event handling (TASK-004)
- Renderer: Canvas-based visual rendering (TASK-005)
- Game: State machine and component coordination (TASK-006)

---

# Architecture Principles

- Separation of Logic and Rendering
- Decoupled Compression System (swappable module)
- Vertical Looping (top and bottom connected)
- Predictive Collision Detection
- Single Source of Truth for y-wrapping (Field.wrapY)

---

# Stable Decisions

## Decision-001: Field Dimensions

Description: 16 columns x 8 rows.

Reason: Balances gameplay complexity with screen space.

Status: Active

---

## Decision-002: Vertical Looping

Description: Top and bottom boundaries are connected. y=8 wraps to y=0, y=-1 wraps to y=7.

Reason: Core gameplay mechanic enabling Right Wall vertical control.

Status: Active

---

## Decision-003: No Line Clearing (MVP)

Description: Lines are not cleared. Score is block density at game over.

Reason: Focus on core compression mechanic.

Status: Active

---

# Active Constraints

## Constraint-001: No External Libraries

Description: HTML, CSS, TypeScript, Canvas API only.

Reason: MVP simplicity and portability.

---

## Constraint-002: Logic/Rendering Separation

Description: Game logic classes must not depend on rendering. Renderer consumes logical state only.

Reason: Testability and modularity.

---

# Engineering Conventions

- TypeScript ES modules with `.js` import extensions
- Class-based architecture
- Assert-based test harness in `src/main.ts`
- Build: `npx tsc && node dist/main.js`
- No magic numbers (use constants)
- Comments explain "why", not "what"

---

# Known Technical Debt

## Debt-001: CompressionSystem Bugs (RESOLVED)

Description: 4 test failures in CompressionSystem.compress(). Empty fields don't trigger reset callback. Full fields incorrectly trigger reset.

Impact: RESOLVED. All 156 tests now pass.

Priority: High

Status: FIXED by TASK-003-FIX (2026-08-09)

Fix Summary: Restructured compress() to handle three no-movement scenarios: (1) full field restores state and returns false, (2) blocks at wall get alignment without reset, (3) empty field triggers reset callback.

---

## Debt-002: Rotation Origin

Description: Rotation pivot is at piece-local (0,0), not visually centered. I-piece "swings" around top-left corner.

Impact: Rotation may feel unnatural. Not a bug, but a UX limitation.

Priority: Low

Mitigation Plan: Future iteration - consider SRS-style rotation with wall kicks.

---

## Debt-003: Wall Push Validation (RESOLVED)

Description: LeftWall.onWallAdvanced() pushes the active piece without validating against occupied cells ahead.

Impact: RESOLVED. Collision validation now checks all piece cells before pushing. If blocked, piece is fixed in place.

Priority: Medium

Status: FIXED by TASK-009 (2026-08-11)

Fix Summary: Added collision validation in onWallAdvanced(). Each piece cell's target position is checked via field.isValidPosition() and field.get(). If all targets are valid, piece is pushed. If any target is blocked, piece is fixed in place via moveToFixed().

---

## Debt-004: Collision Detection Performance (RESOLVED)

Description: ActivePiece.cellsCollide() calls field.getOccupiedCells() inside the loop for each cell, creating O(n*m) complexity.

Impact: RESOLVED. Replaced inner loop with O(1) field.get(x, y) lookup.

Priority: Medium

Status: FIXED by TASK-011 (2026-08-13)

Fix Summary: Replaced the inner loop over getOccupiedCells() with a direct field.get(cell.x, cell.y) call. Complexity reduced from O(n*m) to O(n). Maximum comparisons reduced from 512 to 4.

---

## Debt-005: alignBlocksVertical Block Loss (RESOLVED → REMOVED)

Description: CompressionSystem.alignBlocksVertical() collapsed multiple blocks at the same x-position to a single y-position, causing block loss. Later determined to be unsolicited field modification not in spec.

Impact: FIXED by TASK-010 (2026-08-13), then REMOVED. The method is not described in compress-mechanism.md and was eliminated entirely.

Priority: Medium

Status: RESOLVED — CHAL-005 (2026-08-21) accepted removal; TASK-023 (2026-08-22) removed alignBlocksVertical() and hasBlocksAtWallX() from CompressionSystem.

Removal Summary: Challenge Agent confirmed alignBlocksVertical() is not in spec. compress-mechanism.md says "移動対象内に1つでも移動できないブロックが存在した時点で圧縮を終了する。その時点の配置を確定する。" — no provision for post-compression alignment. TASK-023 removed both methods and the compress() fallback branch (5-case → 3-case structure). Note: the removed no-movement/no-reset path also eliminated a degenerate game flow where the left wall stayed at threshold and re-triggered compression every frame (LIM-023-1 in 30_implement.md).

---

## Debt-006: No preventDefault on Arrow Keys (RESOLVED)

Description: InputManager does not call event.preventDefault() for mapped keys, allowing browser scrolling during gameplay.

Impact: RESOLVED. preventDefault is now called for mapped keys (Space, ArrowUp, ArrowDown) using optional chaining for test compatibility.

Priority: Low

Status: FIXED by TASK-013 (2026-08-13)

Fix Summary: Added event.preventDefault?.() in InputManager.attachListener() before recording the key press. Optional chaining ensures compatibility with test mocks.

---

## Debt-007: Game Loop in GAME_OVER (RESOLVED)

Description: requestAnimationFrame continues running in GAME_OVER state, redrawing the overlay every frame.

Impact: RESOLVED. gameLoop now conditionally schedules the next frame only when state is not GAME_OVER.

Priority: Low

Status: FIXED by TASK-013 (2026-08-13)

Fix Summary: Added state check in gameLoop: if (this.state !== 'GAME_OVER') before scheduling next animation frame. Final GAME_OVER frame is still rendered before the loop stops.

---

## Debt-009: hasOccupiedBlocksInColumn O(n) Performance (CR-IT1-002) (RESOLVED)

Description: LeftWall.hasOccupiedBlocksInColumn() iterates over all occupied cells on the field to check if any exist in a specific column. This is O(n) where n = total occupied cells.

Impact: RESOLVED. Replaced with O(ROWS) loop using field.get(col, y). Maximum comparisons: 128 -> 8.

Priority: Low

Status: FIXED by TASK-016 (2026-08-14)

Fix Summary: Replaced the linear scan over getOccupiedCells() with a loop over rows (y=0 to Field.ROWS) using field.get(col, y) for O(1) per-cell lookup. Consistent with TASK-011 optimization pattern.

---

## Debt-008: Renderer.drawScore() Syntax Error (CR-IT1-001) (RESOLVED)

Description: Renderer.ts line 220 had a missing `=` assignment operator in `const textX (cols * cs) / 2;`. The variable `textX` was undefined, causing the score text to render at x=0 instead of centered.

Impact: RESOLVED. Current codebase has correct syntax: `const textX = (cols * cs) / 2;`. Score text renders correctly in the browser.

Priority: Critical

Status: FIXED (verified in codebase; line 220 has correct `=` assignment operator)

Fix Summary: The missing `=` was present during Code Review but the current codebase already has the correct syntax. Score text "Density: N%" renders centered below the grid as intended.

---

## Debt-010: Single-File Test Suite (Bird's Eye Review 2026-09-18)

Description: All 463 assertions live in `src/main.ts` (2,903 lines). Crosses the ~400 split threshold recommended by the 2026-08-21 Bird's Eye Review (Risk-BE-005).

Impact: Maintainability, agent context cost, per-task diff attribution. No correctness impact.

Priority: Low

Status: OPEN — split by component in a quality iteration behind a small test-registry helper (no external framework, per Constraint-001); keep the `npx tsc && node dist/main.js` entry flow.

---

# Recurring Risks

## Risk-004: Integration Test Coverage Gaps (MITIGATED)

Description: Test suite lacked coverage for: (1) vertical wrapping during compression, (2) multiple consecutive compression cycles, (3) spawn collision with occupied cells.

Impact: MITIGATED. Integration tests added in TASK-012 (Tests 41-43). All three gaps now covered.

Status: MITIGATED by TASK-012 (2026-08-13)

Mitigation: Tests 41-43 added to src/main.ts. Test 41 covers vertical wrapping during compression. Test 42 covers multiple consecutive compression cycles. Test 43 documents Risk-002 (spawn collision gap).

---

## Risk-001: Vertical Looping Edge Cases

Description: Interactions between vertical wrapping and compression can produce unexpected block positions.

Observed In: CompressionSystem BFS movement set building.

Mitigation: Field.wrapY() as single source of truth. Thorough test coverage.

---

## Risk-002: spawnPiece Collision with Occupied Cells (RESOLVED)

Description: Game.spawnPiece() checks spawnX >= rightWall.getX() but does not validate against occupied cells on the field. A piece could spawn overlapping with fixed blocks.

Impact: RESOLVED. Collision validation now checks all piece cells before accepting the spawn. If blocked, game transitions to GAME_OVER.

Status: FIXED by TASK-014 (2026-08-14)

Fix Summary: Added ActivePiece.isColliding() public method wrapping cellsCollide(). Game.spawnPiece() validates collision after creating ActivePiece. If collision detected, active piece is nulled and game transitions to GAME_OUT. Test 43 updated to verify the fix. Tests 36 and 42 updated to accommodate spawn collision as a valid GAME_OVER trigger after compression.

---

## Risk-003: No Restart Mechanism (RESOLVED)

Description: Once the game reaches GAME_OVER state, there is no way to restart. The player must refresh the browser page.

Impact: RESOLVED. Enter key now triggers restart from GAME_OVER state. Game over screen displays "Press Enter to restart" instruction.

Status: FIXED by TASK-015 (2026-08-14)

Fix Summary: Added Enter -> RESTART mapping in InputManager. Game.processInput() handles RESTART in GAME_OVER state by calling start(). Game loop keeps running in GAME_OVER for input processing. Renderer displays restart instruction in game over screen. Tests 44 and 45 added.

---

## Risk-005: No Version Control Baseline (Bird's Eye Review 2026-09-18)

Description: The git repository has zero commits; all files are untracked. Scope attribution in implement/review reports is done by file reading, not `git diff`; no change history, bisect, or rollback is possible.

Observed In: Noted in 6+ reports (e.g., 40_code_review.md Iteration 8 Review Notes; TASK-035/036 reports). Independently confirmed 2026-09-18 (`git log` reports no commits).

Priority: Medium (fix is one-time and cheap)

Mitigation: At the start of the next iteration: an initial baseline commit (respecting the existing `.gitignore` for `node_modules/`/`dist/`) plus per-task or per-iteration commits thereafter.

---

# Lessons Learned

## Lesson-001: Compression Cycle Completion

Description: The compression cycle must always complete when walls meet, regardless of whether blocks moved. The cycle trigger is wall proximity, not block movement.

Reason: This was the root cause of 3 of 4 test failures. Empty fields between walls still represent valid gameplay states.

---

## Lesson-002: Wall Contact Scope

Description: "Contacting the wall" means blocks at the wall's own column; blocks merely connected to them are NOT moved by wall operations unless the spec says so. Settled by DEC-023-1 (alignBlocksVertical removal), DEC-036-1 (compression seeds at the moving wall's column, right-wall boundary), DEC-037-1 (right-wall vertical shift moves only its own column).

Reason: The project's most expensive recurring bug class (3 instances: Debt-005, BUG C, BUG D) came from generalizing "contact/connected" into chain propagation the spec never asked for. `compress-mechanism.md` is the arbiter for any future wall-operation question. Do not re-introduce chain propagation.

---

# Proven Practices

- Assert-based test harness in main.ts (simple, effective)
- TestLeftWall subclass for deterministic time testing
- Simultaneous update pattern for block movement (prevents order-dependent bugs)

---

# Workflow Knowledge

- Task Packets should be self-contained and independently implementable
- Challenge review is valuable for architectural decisions
- Test failures should be analyzed before planning fixes
- Task Packet validation checklist is a strong quality gate; enforce for all future packets
- Separate entry file pattern preferred over environment detection for mixed environments
- Challenge Agent review should be allocated time for architectural decisions
- Challenge Agent review is now part of the standard post-MVP iteration flow; begin each iteration with a Challenge Agent review cycle
- Design deviations from Task Packets are a feature, not a bug — document them to preserve reasoning for future agents
- LIM-021-2 (STALE — corrected 2026-09-23, F-IT9-02): Test 42's assertion count is DETERMINISTIC under current code (spawn collision is universal across all piece-kind pairs; the 276↔279 variance predates TASK-023's removal of the no-movement/no-reset path). The `randomSource()` seam + `TestGame` added in TASK-040 is future-proofing, not a bug fix.
- Post-MVP bug-fix iterations follow a consistent pattern: Challenge Agent identifies runtime issues → Plan Agent creates targeted tasks → Implement Agent executes with design deviations → Code Review validates
- Spec-vs-implementation comparison is the primary bug-finding technique for gameplay-rule iterations (Iterations 5 and 8 found their bugs this way at plan time). Run it at plan time for any iteration touching game rules.
- Reviewer "not a bug" verdicts that rest on spec interpretation are low-confidence (2026-09-01 Challenge F9/F10 were overturned by Iteration 8 — they described exactly BUG C and BUG D). Record such verdicts as assumptions with spec-text citations and re-check at the next spec-compliance pass.
- Single-file workflow artifacts (10/20/30/40/50) are overwritten each cycle; the 00_project_state.md Change Log is the authoritative cross-cycle history. Close-out Change Log entries must carry finding-level detail.

---

# Planning Guidance

- TASK-001 through TASK-038 are all DONE.
- Current iteration is Iteration 9 (Quality Sweep), Plan v11.0, PLANNING COMPLETE (2026-09-23). 4 tasks created: TASK-039 (git baseline), TASK-040 (Low cleanup + determinism), TASK-041 (dist check), TASK-042 (main.ts split). Challenge Agent review complete (2026-09-23); all 8 findings accepted and incorporated into task packets.
- Iteration 8 (Compression System Fix) is COMPLETE (Code Review PASS 2026-09-18). Bird's Eye Review COMPLETE (project health Healthy).
- Iteration 7 (Bug Fixes) is COMPLETE (2026-09-01). Tasks: TASK-030 through TASK-035 are DONE.
- Test suite total is 463 assertions (stable; Test 42 is deterministic under current code — F-IT9-02).
- Iterations 0 through 8 are all COMPLETE.
- Each new iteration should begin with a Challenge Agent review cycle.
- Design deviation documentation should continue as a standard practice.
- Bird's Eye Review should run at the end of each major iteration or feature milestone.
- **Per-task commit discipline**: after TASK-039 establishes the baseline, each subsequent task should be committed separately (per the Risk-005 mitigation plan).
- Next iteration scope candidates (after Iteration 9): (1) Debt-002 SRS-style rotation with wall kicks; (2) Content — additional piece types / grid sizes.
- Before any change to the compression threshold or post-compression wall reset: the CR-IT8-001 comment and Test 70 pin (added in TASK-040) must be updated first, and `compress-mechanism.md` must be updated if the intended semantics is multi-step packing (Risk-BE-008).
- **LIM-021-2 correction (F-IT9-02)**: The Workflow Knowledge entry "Test 42's random piece spawns cause total assertion count to vary between 276 and 279" is STALE. Test 42 is deterministic under current code (spawn collision is universal). The `randomSource()` seam added in TASK-040 is future-proofing, not a bug fix.

---

# Task Packet Guidelines

## Recommended Size

1-3 hours of implementation per task.

## Objective

One objective per Task Packet.

## Acceptance Criteria

3-7 measurable criteria per task.

## Scope

Self-contained. Implement Agent needs only Task Packet + Project State + Next Actions.

---

# Change Log

## 2026-09-23

Updated By: Plan Agent

Summary: Plan v11.0 created for Iteration 9 (Quality Sweep). 4 tasks: TASK-039 (git baseline — clear polluted index per F-IT9-01, extend `.gitignore`, initial commit), TASK-040 (Low cleanup bundle — CR-IT5-001 dead tolerance removal, CR-IT8-001 clarifying comment + Test 70 invariant pin, CR-IT8-002 JSDoc fix, LIM-021-2 re-scoped as determinism hardening via `randomSource()` seam + `TestGame` per F-IT9-02), TASK-041 (dist check — `scripts/check-dist.mjs` wired to `postbuild` per F-IT9-05), TASK-042 (main.ts split — 2,900+ lines → thin entry + 10 files under `src/tests/` per Debt-010, with F-IT9-03 AC fixes, F-IT9-06 Test 6 merge, F-IT9-07 import rule). Execution order: TASK-039 → TASK-040 → TASK-042; TASK-041 independent (dep only on TASK-039). All 8 Challenge findings (F-IT9-01 through F-IT9-08) accepted and incorporated. Task packets written to `.workflow_doc/25_task_packets/`.

---

## 2026-09-23

Updated By: Challenge Agent

Summary: Challenge Agent review of the Iteration 9 Quality Sweep design (TASK-039 git baseline, TASK-040 Low cleanup bundle, TASK-041 dist check, TASK-042 main.ts split) completed. Overall: design sound (cleanup-before-split ordering correct; split design verified safe — ESM module evaluation ordering guarantees the mocks-first import sequence; no cross-section shared variables beyond harness/mocks). Findings: (1) **F-IT9-01 (High)** — the git index already contains 1,560 staged files under node_modules/ and dist/ (1,655 total; zero commits); `.gitignore` does not unstage them, so TASK-039 must clear the index (`git rm -r --cached node_modules dist` or `git reset`) before the baseline commit, and verify with `git ls-files`; (2) **F-IT9-02 (Medium)** — TASK-040.5's premise is wrong for current code: Test 42's PLAYING/GAME_OVER branch is NOT random (the next spawn collides for every piece-kind pair — every rotation-0 shape overlaps the fixed piece at x=6..9, y=4..5), so the assertion count is already deterministic; re-scope as determinism hardening via a `randomSource()` protected-method seam + TestGame override (matches TestLeftWall/TestEffectSystem pattern); (3) **F-IT9-03 (Medium)** — TASK-042 AC "70 section headers" is stale once TASK-040 adds Test 70 (→71); the count-identity AC needs an explicit pre-split baseline capture step; (4) F-IT9-04 (Low) — Test 70(a) duplicates Test 68; (b) is the new pin and verified to work (null reset callback → no-op; second compress(14) returns true, field unchanged); (5) F-IT9-05 (Low) — dist check: add `dist/entry.js` existence check; note CI blast radius (deploy.yml runs `npm run build`); (6) F-IT9-06 (Low) — merge Test 6 into activePiece.test.ts; (7) F-IT9-07 (Low) — write the import rule (test files import only harness/mocks) into the TASK-042 packet; (8) F-IT9-08 (Low) — future tests driving the wall via tick() must also override the clock seam. Verified true against the live repo: main.ts 2,903 lines / 463 assertions / 70 `section(` calls; Test 42 dead tolerance at main.ts:1687-1690; pushBlocksRight single-pass loop (CompressionSystem.ts:147-157); onLeftWallReset null-safe (CompressionSystem.ts:265-269); Math.random at Game.ts:410; .gitignore contains only `.DS_Store` (Bird's Eye Review's Debt-BE-005 claim that node_modules/dist are covered is wrong); all 22 top-level entries are STAGED (not untracked). Artifact: .workflow_doc/20_challenge.md.

---

## 2026-09-18

Updated By: Bird's Eye Review Agent

Summary: Bird's Eye Review completed for the full project evolution (Iterations 0–8, TASK-001 through TASK-038 + TASK-003-FIX), focused on the Iteration 5–8 span since the 2026-08-21 review. Independent verification: `npx tsc` 0 errors; `node dist/main.js` 463/463 (Failed: 0); `git log` confirms zero commits. Project health: **Healthy** (up from Stable). Key findings: (1) One recurring spec-interpretation bug class found and fixed three times (Debt-005 alignBlocksVertical IT5; BUG C/BUG D IT8) — all from generalizing "contacting the wall" into chain propagation; rule now settled as Lesson-002 ("contacting" = at the wall's own column). (2) The 2026-09-01 Challenge report's F9/F10 "not a bug" verdicts were later overturned — they described exactly BUG C and BUG D; spec-interpretation verdicts recorded as low-confidence (Workflow Knowledge). (3) Spec-vs-implementation comparison at plan time confirmed as the primary rule-bug detector (Trend-BE-001, Lesson-BE-009). (4) Two new actionable gaps: Debt-010 (src/main.ts 2,903 lines / 463 assertions crossed the ~400 split threshold) and Risk-005 (no VCS baseline — zero git commits; scope attribution has been diff-less for 6+ iterations). Positive: 15 design deviations (DEV-018 through DEV-038) all judged legitimate; fix + dedicated regression pin pairing standard (Tests 15/65/66/67/68/69); zero regressions at any iteration boundary; Change Log discipline sustained. Recommendations: git baseline before next code work; next-iteration candidates = quality sweep (main.ts split + Low cleanup + determinism) or Debt-002 SRS rotation; protect compression-loop semantics before any threshold change (Risk-BE-008). Artifact: .workflow_doc/50_birds_eye_review.md.

---

## 2026-09-18

Updated By: Code Review Agent

Summary: Code Review completed for Iteration 8 (TASK-036, TASK-037, TASK-038). Overall Status: Pass. All 12 acceptance criteria independently re-verified against the live codebase (`npx tsc --noEmit` exit 0; `npx tsc` 0 errors; `node dist/main.js` 463/463, Failed: 0; `npm run build` succeeds). Both bugs fixed per `compress-mechanism.md`: BUG C (CompressionSystem movement target seeds at the moving left-wall column and expands RIGHT only — left-expansion removed) and BUG D (RightWall moves only wall-column blocks on vertical shift — BFS left-expansion removed). The one packet-unspecified boundary case (right-wall column) was resolved soundly and necessarily (DEC-036-1) to prevent an out-of-bounds block move / block loss, and is pinned by Test 68f–68j; DEC-036-2 (removing the misleading `wrapX` clamp) verified safe. Design deviations DEV-036-1 and DEV-038-1 judged legitimate. 2 new Low findings, both non-blocking: CR-IT8-001 (the `pushBlocksRight` loop is effectively single-pass because the seed column empties after one move — correct for the default game flow but vestigial; recommend a clarifying comment) and CR-IT8-002 (JSDoc `@param` block in `RightWall.shiftVertical` indented inconsistently, cosmetic). Neither blocks completion. Artifact: .workflow_doc/40_code_review.md. Iteration 8 is COMPLETE; per the Bird's Eye Rule the Bird's Eye Review Agent may now run.

---

## 2026-09-13

Updated By: Implement Agent

Summary: TASK-038 completed (Iteration 8, third and final task — Iteration 8 now COMPLETE). Test-only task: added two dedicated regression tests to `src/main.ts`, pinning the corrected movement-target behavior from TASK-036/TASK-037. Test 68 (11 assertions) pins the `CompressionSystem` movement target: AC 1 scenario (chain at (10..14,4), `compress(14)` → only the wall-column block moves, blocks behind the wall stay) plus the DEV-036-1 right-wall abort case (a chain reaching the right-wall column aborts atomically, no block lost). Test 69 (10 assertions) pins the `RightWall` vertical shift: AC 2 scenario (block at (15,3) moves on `shiftVertical(1)`, left-adjacent (14,3) stays) plus a vertical-chain-at-wall case. AC 3 verified by inspection of existing movement tests (9/10/13/34/47–51 unchanged). No production source modified. Verification: `npx tsc --noEmit` exit 0; `node dist/main.js` 463/463 (Failed: 0); `npm run build` succeeds. Suite total: 442 → 463. One design deviation documented (DEV-038-1: AC1/AC2 scenarios overlap existing Tests 13/67; dedicated regression tests added per the Objective, each made additive). Artifact: .workflow_doc/30_implement.md. Next: dispatch Code Review (Iteration 8 complete); Bird's Eye Review may now run per the Bird's Eye Rule.

---

## 2026-09-13

Updated By: Implement Agent

Summary: TASK-037 completed (Iteration 8, second task). Fixed BUG D in `src/RightWall.ts`: `moveBlocksVertical()` no longer expands LEFT via BFS; only occupied cells at the wall's own column (`this.x`) are moved during vertical shifts, per `compress-mechanism.md` "壁に接触しているブロックは壁と一緒に移動する" and Decision-037-1. Updated class/method JSDocs. Added Test 67 (8 assertions) in `src/main.ts` proving left-adjacent blocks are not dragged. Tests 9/10/34 pass unchanged. Suite total: 434 → 442. Verification: `npx tsc --noEmit` exit 0; `node dist/main.js` 442/442 (Failed: 0); `npm run build` succeeds. No design deviations. Next: dispatch TASK-038 (regression coverage). Artifact: .workflow_doc/30_implement.md.

---

## 2026-09-08

Updated By: Implement Agent

Summary: TASK-036 completed (Iteration 8, first task). Fixed BUG C in `src/CompressionSystem.ts`: the compression movement target now seeds at the moving left wall's column (`compress(leftWallX)` → `pushBlocksRight(leftWallX)` → `buildMovementSet(leftWallX)`) and expands RIGHT only, per `compress-mechanism.md` "移動対象の構築". Blocks at x < leftWallX are no longer pulled into the movement target. Added the right-wall boundary rule (DEC-036-1: a block at the right wall's column cannot move; movement set stops there) and removed the misleading `wrapX` clamp from `moveRight()` (DEC-036-2). Rewrote Test 13 in `src/main.ts` to encode the corrected behavior (9 assertions, count unchanged; suite total remains 434). One design deviation documented (DEV-036-1: right-wall boundary rule not in the Task Packet pseudocode but required to prevent block loss). Verification: `npx tsc --noEmit` exit 0; `node dist/main.js` 434/434 (Failed: 0, 2 runs); `npm run build` succeeds. Next: dispatch TASK-037 (independent); TASK-038 after TASK-037 is DONE. Artifact: .workflow_doc/30_implement.md.

---

## 2026-09-03

Updated By: Plan Agent

Summary: Plan v10.0 created for Iteration 8 (Compression System Fix). The iteration addresses two movement-target bugs found by comparing the spec and implementation: BUG C — CompressionSystem expands the movement target left from the right-wall adjacent column, pulling blocks behind the moving left wall; BUG D — RightWall.moveBlocksVertical moves horizontally connected blocks vertically, causing vertical compression. New tasks: TASK-036 (fix CompressionSystem movement target), TASK-037 (fix RightWall vertical block movement), TASK-038 (regression coverage). Iteration 7 tasks are all DONE.

---

## 2026-09-01

Updated By: Implement Agent

Summary: TASK-035 completed (Iteration 7, sixth and final task). Doc-sync: `game-design.md` line 53 ("# 壁" section) replaced — "* 左端から右方向へ一定速度で移動する" → "* 左端から右方向へ動的速度で移動する（ゲーム開始時 400ms/tick から 10 秒かけて 200ms/tick へ線形加速する）", matching the dynamic interval implemented in TASK-027 (`LeftWall.getTickInterval`: linear ramp 400ms → 200ms over 10 s). Full-file read + repo-wide grep confirmed line 53 was the only speed claim in the spec (other wall-movement passages describe direction only); remaining "一定速度" occurrences are in historical `.workflow_doc/` artifacts, out of scope. Documentation-only change: no source/test files modified. One sanctioned style decision (DEC-035-1: parenthetical bullet form instead of the packet's full-sentence example, per the packet's own "adjust to surrounding structure" instruction); no design deviations. Verification: `npx tsc` 0 errors; `node dist/main.js` 434/434 (Failed: 0). All 6 Iteration 7 tasks (TASK-030 through TASK-035) are now DONE — Iteration 7 is COMPLETE. Artifact: .workflow_doc/30_implement.md.

---

## 2026-09-01

Updated By: Implement Agent

Summary: TASK-034 completed (Iteration 7, fifth task). Added two new test sections to `src/main.ts` after Test 64. Test 65 (10 assertions) pins the `minAllowedX` rotation constraint (TASK-031) directly on `ActivePiece`: blocked rotation returns false with rotation unchanged (65a), allowed rotation including the strict-`<` boundary case `x == minAllowedX` (65b), the I-piece rot-180 negative-offset stranding case at the wall (65c; the packet's illustrative rot-0 example cannot exercise the constraint, DEC-034-2), and no-arg `rotate()` backward compatibility against the identical blocked setup (65d). Test 66 (9 assertions) pins the T-piece shape scramble (Decision-030-3, TASK-030): fix-at-contact at x=6 followed by the fall-through BFS chain push leaves the exact resting shape (7,4)(8,4)(9,4)(7,5), asserts the old rigid-push arm position (8,5) is NOT occupied (the (7,5) arm stays put — BFS expansion is same-row horizontal only), and verifies the `ChainPushResult` contract (pushedCells [(7,4)], connectedCells [(8,4),(9,4)], post-move positions); driven via `TestLeftWall.advance()` to bypass tick gating (DEC-034-3). No Game-level direction test added — Test 34 (rewritten in TASK-033) already covers the packet's wrap-boundary example (DEC-034-1). +19 assertions (415→434). 434/434 pass (Failed: 0, stable over 4 runs). npx tsc 0 errors; npm run build succeeds. No design deviations. Artifact: .workflow_doc/30_implement.md.

---

## 2026-09-01

Updated By: Implement Agent

Summary: TASK-033 completed (Iteration 7, fourth task). Rewrote four gating test regions in `src/main.ts` to encode the corrected behavior: (1) Test 5 wall6 contact — now asserts fix-at-contact (x=-100/y=-100) + chain-pushed cells at (6,4)(7,4)(8,4)(9,4) (3→9 assertions); (2) Test 5 field7 — removed manual `moveToFixed()` call, asserts fix+push from `advance()` directly (7→9 assertions); (3) Test 5b — blocker now at (8,4), piece cells at (6,4)(6,5)(7,4)(7,5); (4) Test 5c — "free push" framing removed, asserts fix + 4 chain-pushed blocks (3→7 assertions); (5) Test 34 — direction formulas swapped (ArrowUp→y-1, ArrowDown→y+1). Net +12 assertions (403→415). 415/415 pass (Failed: 0). npx tsc 0 errors; npm run build succeeds. No design deviations. Artifact: .workflow_doc/30_implement.md.

---

## 2026-09-01

Updated By: Implement Agent

Summary: TASK-032 completed (Iteration 7, third task). BUG B fix: `Game.processInput()` now maps `WALL_UP → shiftVertical(-1)` (up on screen) and `WALL_DOWN → shiftVertical(1)` (down on screen); previously inverted. `RightWall.shiftVertical`'s `@param dy` JSDoc reworded to state the on-screen direction consequence (packet text verbatim). The class-level JSDoc (lines 10-11) was also reworded — it described wrapping under the old inverted convention and would have left the file self-contradictory (deviation DEV-032-1, doc-only). `shiftVertical`'s body and `moveBlocksVertical` are unchanged (F10). Test 9/10 (direct `shiftVertical` unit tests) pass unchanged (15/15). Baseline before change: 396/403 (7 known Test 5/5b/5c gating failures). After change: 394/403 — the +2 failures are Test 34's direction assertions, which encode the old inverted mapping and are the rewrite target of TASK-033 (challenge finding F2). npx tsc 0 errors; npm run build succeeds. Artifact: .workflow_doc/30_implement.md.

---

## 2026-09-01

Updated By: Implement Agent

Summary: TASK-031 completed (Iteration 7, second task). Rotation constraint `minAllowedX`: `ActivePiece.wouldRotateCollide(minAllowedX)` and `ActivePiece.rotate(minAllowedX)` now accept an optional `minAllowedX` parameter (default `-Infinity`, backward-compatible). When set, any rotated cell with `x < minAllowedX` blocks the rotation (soft block: returns false, no state mutation). `Game.processInput()` passes `this.leftWall.getX() + 1` so cells at `x <= wallX` are forbidden. The bound is the exact logical negation of `isWallHit(wallX)`. npx tsc 0 errors. Test run: 396/403 pass, 7 fail — same pre-existing gating failures from TASK-030 (Test 5/5b/5c). No new failures introduced. No design deviations. Artifact: .workflow_doc/30_implement.md.

---

## 2026-09-01

Updated By: Implement Agent

Summary: TASK-030 completed (Iteration 7, first task). BUG A fix: LeftWall.onWallAdvanced() now fixes the active piece at contact (moveToFixed) instead of pushing it (old canPush ? move : moveToFixed branch removed), nulls LeftWall.activePiece, fires the new onPieceFixed callback (Game nulls Game.activePiece), then falls through to advanceOccupiedBlocksInColumn(this.x) so the just-fixed cells are BFS chain-pushed the same tick. New field `onPieceFixed: (() => void) | null` + setter `setOnPieceFixed(cb)` added to LeftWall (null-safe per F6). Game constructor registers the callback. npx tsc 0 errors. Test run: 396/403 pass, 7 fail — all in Test 5/5b/5c (gating tests encoding the old buggy push behavior; TASK-033 rewrites them). No design deviations. Artifact: .workflow_doc/30_implement.md.

---

## 2026-08-31

Updated By: Implement Agent

Summary: TASK-029 re-verification pass (re-dispatch `exec task-029`; task had been DONE since 2026-08-27). At dispatch time, confirmed codebase and docs were consistent (Test 64 present at src/main.ts lines 2519–2600; state docs already marked TASK-029 DONE). Independently re-verified all 7 acceptance criteria against the live codebase with no source changes: `npx tsc` 0 errors; `node dist/main.js` 403/403 (Failed: 0) stable over 4 consecutive runs; BFS chain push tests = Tests 47–51 (5 >= 3); dynamic speed tests = Tests 52–56 (5 >= 2); effect system tests = Tests 57–63 (7 >= 2); total 403 assertions (>= 280); all 9 real `.tick()` call sites in src/main.ts pass numeric elapsedMs (Test 46 wrapper forwards elapsedMs; zero no-arg call sites); `npm run build` succeeds. Test 64 body re-read and confirmed to match the 2026-08-27 report (16 assertions, 4 phases, kind-agnostic spawn safety). Status: TASK-029 remains DONE (independently confirmed). Artifact: .workflow_doc/30_implement.md (Re-Verification Pass section appended).

---

## 2026-08-27

Updated By: Implement Agent

Summary: TASK-029 completed (Iteration 6 final task). Scope verification at start confirmed the bulk of the test scope was already implemented by TASK-025 through TASK-028 (spawn position Tests 31/43, BFS chain push Tests 47-51, dynamic speed Tests 52-56, effect system Tests 57-63, tick signature). The single uncovered scope item was a full-game-flow integration test, closed by new Test 64 (16 assertions): Phase 1 `start()` -> PLAYING with spawn at x=6; Phase 2 one `TestLeftWall` tick -> wall x=0->1 with chain push moving fixed blocks (1,4),(2,4),(3,4) to (2,4),(3,4),(4,4) and registering pushed effect (2,4) + connected effects (3,4),(4,4); Phase 3 wall set to x=14 (`Field.COLS - 2`) -> shouldCompress true -> COMPRESSING; Phase 4 `compress(14)` -> no-movement path (blocks not adjacent to right wall) -> finalize + wall reset to x=0 + new piece spawns at x=6 -> PLAYING, no block loss (`countBlocks() === 3`). Spawn safety is deterministic: rotation-0 shapes of all 7 kinds occupy x >= 6 while blocks stay at x <= 4, so post-compression spawn cannot collide regardless of random piece kind (all assertions kind-agnostic). Scope note (DEV-029-1): the packet's "Spawn Position Tests" item was already satisfied by TASK-025, so no test was created (re-run verification only). Known limitation (LIM-029-1): Test 64 exercises the no-movement compression path; a move-path full-game-flow variant is not present (elements individually covered). All 7 acceptance criteria verified: 403/403 tests pass (Failed: 0, stable over 4 consecutive runs), BFS tests = Tests 47-51 (5), dynamic speed tests = Tests 52-56 (5), effect system tests = Tests 57-63 (7), total 403 assertions (>= 280), npx tsc 0 errors, no bare `tick()` call sites remain (all 10 pass numeric elapsedMs). Test suite 387 -> 403. npx tsc 0 errors, npm run build succeeds. Artifact: .workflow_doc/30_implement.md. All 5 Iteration 6 tasks are DONE.

---

## 2026-08-27

Updated By: Implement Agent

Summary: TASK-028 completed. Effect system + flash + connection effects: new `src/EffectSystem.ts` (pure-logic `Effect`/`EffectCell` types + `EffectSystem` class — register/update/query/clear, key "type,x,y", `PUSH_DURATION_MS=300`/`CONNECT_DURATION_MS=400`, wall-clock expiration via overridable `protected currentTimeMillis()`). `LeftWall.tick()` now returns `ChainPushResult | null` (was boolean) and `advance()` returns `ChainPushResult`, completing the result path from TASK-026's BFS chain push to the Game (LIM-026-1 closed). `Game` gained `effectSystem` (cleared in `start()` for AC #7, registered from `tick()` results in `updatePlaying()`, pruned in the `update()` dispatcher for all states per DEC-028-2, passed to `Renderer.render()` as a new 7th parameter, exposed via new `getEffectSystem()` accessor). `Renderer.drawBlocks()` renders pushed cells brighter (`#9a9aba`, new `COLOR_PUSHED_BLOCK`) and connected cells with a yellow glow rect + inner block body (`#ffd93d`, new `COLOR_CONNECTED_OVERLAY`). Test harness: `MockRenderContext.fillRect` now records `fillStyle`; existing tests updated for the changed APIs (Test 4, Tests 23-30, Tests 53/54, Test 56). New Tests 57-63 (38 assertions): registration/query, expiration boundaries (299/300ms, 399/400ms) + refresh via a deterministic `TestEffectSystem` clock, clear(), Renderer pushed/connected drawing (exact hex + rects), full Game integration (one frame: wall tick -> chain push -> effect registration -> canvas draw at pixels (81,161) `#9a9aba` / (121,161) `#ffd93d`), and restart clears effects. Two design deviations documented: DEV-028-1 (clock abstraction over the packet's direct `Date.now()` for deterministic AC #4 testing), DEV-028-2 (opaque yellow glow frame per the packet pseudocode instead of the palette table's "50% alpha overlay"; keeps AC #3's exact hex testable). npx tsc 0 errors, 387/387 tests pass (Failed: 0; was 349/349), npm run build succeeds. Artifact: .workflow_doc/30_implement.md.

---

## 2026-08-26

Updated By: Implement Agent

Summary: TASK-027 completed. Dynamic push speed: `LeftWall.tick(elapsedMs)` now gates movement on a dynamic interval via new public `getTickInterval(elapsedMs)` (linear ramp 400ms → 200ms over 10s per Decision-026-3; new constants INITIAL_TICK_INTERVAL_MS=400 / MINIMUM_TICK_INTERVAL_MS=200 / TICK_RAMP_DURATION_MS=10000). `Game` gained `startTime` (set in `start()`, resets the ramp on restart), `protected currentTimeMillis()`, and `public elapsedTime()`, and `updatePlaying()` now passes `this.elapsedTime()` to `tick()`. Removed the now-dead `tickIntervalMs` constructor parameter / `DEFAULT_TICK_INTERVAL_MS` / field (no call site ever passed it; old default 200 preserved as MINIMUM_TICK_INTERVAL_MS); `toString()` simplified to `LeftWall(x=N)`. Test harness: `TestLeftWall` extended with a deterministic clock (`currentTimeMillis()` override on the pre-existing `_time` field + `advanceMockTime()`); Test 4 call site updated to `tick(0)` (assertion strengthened to `x === 0`), Test 46 tick wrapper forwards `elapsedMs`. New Tests 52–56 (30 assertions): ramp formula table + constants, tick gating at 400/392/300ms boundaries, post-compression reset does NOT reset the ramp (240ms gate at 8s), `Game.elapsedTime()` + ramp restart on `start()`, and `updatePlaying` → `tick(elapsed)` wiring. One design deviation documented: DEV-027-1 — the packet's `tick()` pseudocode gates on the static `tickIntervalMs` and computes `dynamicInterval` as an unused variable, contradicting the Objective ("wall starts at 400ms per tick") and AC #2; the gate was corrected to use `getTickInterval(elapsedMs)` directly (the approved Decision-026-3 formula IS the interval). npx tsc 0 errors, 349/349 tests pass (Failed: 0, stable over 3 runs; was 319/319), npm run build succeeds. Artifact: .workflow_doc/30_implement.md.

---

## 2026-08-26

Updated By: Implement Agent

Summary: TASK-025 and TASK-026 completed. TASK-025: Game.spawnPiece() spawn formula changed from `max(2, rightWall.x - 4)` to `max(2, rightWall.x - 9)` (JSDoc updated); Test 31 gained 6 spawn-position assertions (default x=6/y=4; minimum-guard x=2 at rightWall x=11 and x=10) and Test 43's spawn-area fill moved from (11..14,4) to (6..9,4). TASK-026: LeftWall.advanceOccupiedBlocksInColumn() rewritten as transitive BFS chain push — seeds the wall column, expands RIGHT read-only (horizontal-only, same row), validates all targets (in-bounds AND (in-set OR empty)), aborts atomically on any failure, moves the whole connected mass one column right simultaneously, and returns post-move `pushedCells`/`connectedCells` via new exported `ChainPushResult` type. Tests 47-51 added (33 assertions: 2x2 unit, gap breaks chain, atomic abort at field edge, return-value contract, no cross-row/wrap connections). One design deviation documented: DEV-026-1 — the packet's prose AC #3 ("single BFS pass, blocks 2+ columns right NOT pushed") contradicts the packet's own queue-BFS pseudocode; transitive BFS adopted because under single-pass a solid wall's direct-neighbor target is always occupied → permanent atomic abort → the feature would be useless in its designed scenario. The testable core of AC #3 (disconnected blocks are not pushed) remains satisfied (Test 48). Known limitations: LIM-026-1 (ChainPushResult unused by game flow until TASK-028 wires effect registration), LIM-026-2 (large connected masses lock and abort atomically — accepted risk per packet). npx tsc 0 errors, 319/319 tests pass (Failed: 0, was 280/280), npm run build succeeds. Artifact: .workflow_doc/30_implement.md.

---

## 2026-08-26

Updated By: Plan Agent

Summary: Plan v8.0 created for Iteration 6 (Balance & Visual Feedback). 5 tasks: TASK-025 (spawn position offset -5 columns), TASK-026 (BFS wall advancement / chain push), TASK-027 (dynamic push speed: 400ms→200ms over 10s), TASK-028 (effect system + flash + connection effects), TASK-029 (test updates). Challenge Agent review completed: Changes 1-3 accepted, Changes 4-5 (visual effects) rejected per MVP spec but implemented per user request. All task packets written to `.workflow_doc/25_task_packets/`.

---

## 2026-08-25

Updated By: Code Review Agent

Summary: Code review completed for Iteration 5 (TASK-023, focus: DEV-023-1/2 scope judgment). Overall Status: Pass. All 7 TASK-023 acceptance criteria independently re-verified (npx tsc 0 errors, 280/280 tests pass Failed: 0, npm run build succeeds, grep confirms no residual references to removed methods). All 5 TASK-024 acceptance criteria verified as already satisfied — TASK-024 may be closed verification-only (confirm 280/280, mark DONE). Scope judgment assessment: DEV-023-1 and DEV-023-2 are legitimate — the TASK-023 packet contains a plan-level contradiction (Scope "test changes are TASK-024" vs AC #6 "Failed: 0"), which was unresolvable without test updates; the implementer chose the minimum-discretion resolution (TASK-024's fully-specified Test 15 design applied; Test 41/14 re-targeted to spec step 5) and documented it completely. The old Test 41 scenario (vertical wrapping during compression) contradicted the spec's own vertical-looping section, so retiring it aligns with Plan intent. LIM-023-1 correctly characterized (old align path returned true without reset, creating a per-frame degenerate re-trigger; new behavior conforms to Decision-023-1 wording). 2 new Low findings: CR-IT5-001 (Test 42 legacy tolerance is now dead and could mask a future no-reset regression — recommend follow-up removal), CR-IT5-002 (Plan v1.0 assumption "only Test 15 tested alignBlocksVertical" was incomplete; TASK-024 constraint cites stale count 276 vs actual 280 — record 280/280 at close-out). Neither finding blocks Iteration 5 completion. Artifact: .workflow_doc/40_code_review.md.

---

## 2026-08-22

Updated By: Implement Agent

Summary: TASK-023 completed. Removed alignBlocksVertical() and hasBlocksAtWallX() from CompressionSystem; compress() simplified to 3 cases per compress-mechanism.md step 5 (movement → reset/true; full → restore/false; no-movement non-full → finalize in-place + reset/true). Two documented design deviations: DEV-023-1 (re-targeted Test 41 — which no packet owned — and updated Test 14, both of which asserted the removed path; project Completion Rule requires Failed: 0 before DONE) and DEV-023-2 (applied TASK-024's verbatim Test 15 design, making TASK-024 verification-only). Also updated README test-count note (276 → 280, DEV-023-3). npx tsc 0 errors, 280/280 tests pass (Failed: 0, stable over 10 runs), npm run build succeeds. Notable finding (LIM-023-1): the removed no-movement/no-reset path had left the left wall at threshold, re-triggering compression every frame (degenerate cycle); the new behavior resets the wall to x=0.

---

## 2026-08-21

Updated By: Challenge Agent

Summary: Game rule compliance review completed. 3 concerns identified: (1) CompressionSystem.alignBlocksVertical() adds unsolicited field modification not in spec — Accepted for removal. (2) LeftWall.advanceOccupiedBlocksInColumn() does not use BFS movement set — Partially Accepted: fix validation bug, defer BFS refactoring to gameplay design task. (3) LeftWall reset timing — Accepted: already correct, no change needed. Priority: (1) Fix validation bug in LeftWall, (2) Remove alignBlocksVertical(), (3) Evaluate BFS wall advancement as separate task. Challenge report written to .workflow_doc/20_challenge.md.

---

## 2026-08-21

Updated By: Code Review Agent

Summary: Code review completed for Iteration 4 (TASK-022). All 6 acceptance criteria verified — all met. 276/276 tests pass (Failed: 0), npx tsc 0 errors, build clean. Implementation matches Plan v6.0 D-022 exactly. No design deviations. 1 new Low-severity finding: CR-IT4-001 (no regression test for the specific adjacent-blocks overwrite scenario that was the original bug). None block deployment. Artifact: .workflow_doc/40_code_review.md. Iteration 4 is COMPLETE; per the Bird's Eye Rule, the Bird's Eye Review Agent may now run.

---

## 2026-08-20

Updated By: Implement Agent

Summary: TASK-022 completed. Fixed `LeftWall.advanceOccupiedBlocksInColumn()` collision validation bug: added target occupancy check before moving blocks. When the Left Wall pushes fixed blocks to the right, the method now validates that all target cells (x+1, y) are within bounds and unoccupied. If any target is blocked, the move is aborted, preventing block overwrite and field corruption. All 276 tests pass (Failed: 0), npx tsc 0 errors. Iteration 4 (Block Push Fix) is COMPLETE.

---

## 2026-08-20

Updated By: Plan Agent

Summary: Plan v6.0 created for Iteration 4 (Block Push Fix). Identified critical bug in `LeftWall.advanceOccupiedBlocksInColumn()`: missing collision validation when pushing fixed blocks causes block loss and premature game over. Spec review completed (.workflow_doc/20_spec_review.md). Full spec-to-implementation mapping verified. Fix: add target occupancy check before moving blocks. Task: TASK-022. Current Iteration updated to Iteration 4 (Block Push Fix).

---

## 2026-08-18

Updated By: Code Review Agent

Summary: Code review completed for Iteration 3 (Bug Fixes). All 4 tasks (TASK-018 through TASK-021) verified against acceptance criteria — all met. All 276 tests pass (Failed: 0), npx tsc 0 errors, npm run build succeeds, dist/ output correct (flat entry.js after postbuild rewrite). Both design deviations (DEV-019-1, DEV-021-1) confirmed as correct decisions that better satisfy the acceptance-criteria intent than the literal packet text. The TASK-020 loopGeneration guard + Test 46 confirmed as a high-quality, behavior-faithful fix for the in-flight-loop re-entrancy case. 4 new Low-severity findings (no Critical/High/Medium): CR-IT3-001 (src/styles.css is unreferenced dead code, diverged from index.html's inline <style> block), CR-IT3-002 (postbuild sed rewrite is fragile/unguarded; no automated dist check), CR-IT3-003 (browser-facing changes from TASK-018/019 have no automated tests — manual-only verification), CR-IT3-004 (Test 42 makes the suite total non-deterministic, 276 vs 279 — documented as LIM-021-2). None block deployment; all are follow-up cleanup candidates. Review artifact written to .workflow_doc/40_code_review.md. Iteration 3 is COMPLETE; per the Bird's Eye Rule, the Bird's Eye Review Agent may now run.

---

## 2026-08-18

Updated By: Implement Agent

Summary: TASK-021 completed. README.md fully rewritten to the packet's structure (Game Rules / How to Play / Game Over / Scoring / Getting Started / Development / Architecture / Project Structure / Design Documents): documented field topology, automatic Left Wall push as the placement mechanic explicitly NOT game over (D-021, per user-reported misunderstanding), the real game over condition (new piece cannot spawn: spawn overlaps Right Wall or fixed blocks), Enter-to-restart, density-% scoring formula, and verified dev commands (incl. TASK-018's postbuild behavior). Test count documented as typical 276 with variability note (occasionally 279 — Test 42 contains path-dependent conditional assertions driven by random piece spawns, discovered during verification; see LIM-021-2 in 30_implement.md); the packet's "267" was stale, predating TASK-020's Test 46 (Design Deviation DEV-021-1). Project Structure section corrected (was missing Game.ts, InputManager.ts, Renderer.ts, entry.ts). No source code changes. npx tsc 0 errors, all tests pass (Failed: 0 on every run), npm run build succeeds. Iteration 3 (TASK-018 through TASK-021) is now COMPLETE.

---

## 2026-08-17

Updated By: Implement Agent

Summary: TASK-020 completed. Fixed overlapping game loops on restart (CR-IT2-003): Game.start() now calls this.stop() first (per D-020) and increments a loopGeneration counter that invalidates the in-flight gameLoop() iteration; gameLoop() reschedules the next frame only when the generation still matches. Proved via a new regression test (Test 46, 9 assertions) that D-020's stop() alone was insufficient: the restart is triggered from inside the running loop iteration (processInput -> RESTART -> start()), and that iteration still schedules a second frame after start() returns — 4 assertion failures pre-fix (2 pending rAF callbacks, 2 loop runs per frame, double tick). All 276 tests pass (267 existing + 9 new), npx tsc 0 errors, npm run build succeeds.

---

## 2026-08-17

Updated By: Implement Agent

Summary: TASK-019 completed. Made the canvas focusable so keyboard input (Space rotate, ArrowUp/ArrowDown wall shift) works: added `tabindex="0"` to the canvas in index.html, added `#game-canvas:focus` styling (`outline: none`, `border-color: #6bff6b` = right wall color) to src/styles.css, and call `canvas.focus()` after `game.start()` in src/entry.ts. During implementation, discovered index.html does not reference src/styles.css (page uses an inline `<style>` block only; grep-verified), so added the same focus rule to the inline block as well so the visual feedback actually applies (Design Deviation DEV-019-1). Rejected alternative (link styles.css + extend postbuild to copy CSS into dist/) as scope expansion breaking the TASK-018-confirmed build flow. Verified: `npx tsc` 0 errors, all 267 tests pass, `npm run build` succeeds, Vite dev server and `npx serve dist` both serve HTML containing `tabindex="0"` + focus styles and entry module containing `canvas.focus()` (HTTP 200). Real-browser runtime check remains LIM-019-1.

---

## 2026-08-17

Updated By: Implement Agent

Summary: TASK-018 completed. Fixed `npm run dev` entry point: index.html script src changed from `entry.js` to `./src/entry.js` so the Vite dev server resolves `src/entry.ts`. During implementation, proved that the one-line fix alone would break the documented production flow (`npm run build && npx serve dist`): tsc emits flat output (`dist/entry.js`, no `dist/src/`), causing `/src/entry.js` to 404 under static serve. Added a postbuild sed rewrite in package.json so dist/index.html references `entry.js` (flat path), preserving the production flow (Design Deviation DEV-018-1). Verified: Vite dev server serves the full module graph with HTTP 200 (no resolution errors), `npx serve dist` works, all 267 tests pass, `npm run build` succeeds. Real-browser visual check remains LIM-018-1.

---

## 2026-08-14

Updated By: Plan Agent

Summary: Plan v5.0 created for Iteration 3 (Bug Fixes). 4 tasks (TASK-018 through TASK-021) to fix: (1) npm run dev entry point (index.html script src), (2) canvas keyboard focus (tabindex + CSS), (3) overlapping game loops on restart (stop() before start()), (4) README update with game rules clarification. Wall push behavior confirmed as intentional game mechanic (not game over). Current Iteration updated to Iteration 3 (Bug Fixes).

---

## 2026-08-14

Updated By: Challenge Agent

Summary: Challenge review completed on three post-MVP runtime issues. (1) Issue A: Canvas focus bug confirmed — all keyboard input non-functional in browser. Recommended fix: attach keydown listener to `document` instead of canvas. Severity: Critical. (2) Issue B: Overlapping game loops on restart confirmed. Recommended fix: call `this.stop()` at beginning of `start()`. Severity: High. (3) Issue C: Wall push "game over" perception — player loses agency when piece is fixed by wall. Recommended fix: stop wall advancement when piece is fixed. Severity: Medium. Challenge report written to .workflow_doc/20_challenge.md.

---

## 2026-08-14

Updated By: Code Review Agent

Summary: Code review completed for Iteration 2 (MVP Completion). All 4 tasks (TASK-014 through TASK-017) verified against acceptance criteria. All 267 tests pass. Both findings from the previous code review (CR-IT1-001, CR-IT1-002) confirmed as resolved. 3 new low-severity findings identified: CR-IT2-001 (game loop continues in GAME_OVER - intentional), CR-IT2-002 (advanceOccupiedBlocksInColumn still O(n)), CR-IT2-003 (potential overlapping game loops on restart). MVP is complete with no outstanding correctness issues. Review artifact written to .workflow_doc/40_code_review.md.

---

## 2026-08-14

Updated By: Implement Agent

Summary: TASK-017 completed. Updated Project State and Next Actions to reflect Iteration 2 (MVP Completion) completion. All Iteration 2 tasks (TASK-014 through TASK-017) marked as DONE. Debt-008 (CR-IT1-001), Risk-002, Risk-003, Debt-009 (CR-IT1-002) confirmed as resolved in documentation. Current Iteration updated to "COMPLETE". Planning Guidance updated with TASK-017 as DONE. All 267 tests pass. Iteration 2 documentation finalized.

---

## 2026-08-14

Updated By: Implement Agent

Summary: TASK-016 completed. Optimized LeftWall.hasOccupiedBlocksInColumn(): replaced O(n) linear scan over getOccupiedCells() with O(ROWS) loop using field.get(col, y). Maximum comparisons reduced from 128 to 8. Consistent with TASK-011 optimization pattern. All 267 tests pass. CR-IT1-002 resolved.

---

## 2026-08-14

Updated By: Implement Agent

Summary: TASK-015 completed. Added restart mechanism: Enter key mapped to RESTART action in InputManager. Game.processInput() handles RESTART in GAME_OVER state by calling start() for full state reset. Game loop keeps running in GAME_OVER for input processing (reverses part of TASK-013's Debt-007 fix). Renderer displays "Press Enter to restart" in game over screen. Tests 44 (11 assertions) and 45 (2 assertions) added. Test 20 updated (Enter removed from unknown keys). All 267 tests pass. Risk-003 resolved.

---

## 2026-08-14

Updated By: Implement Agent

Summary: TASK-014 completed. Added ActivePiece.isColliding() public method for spawn collision validation. Modified Game.spawnPiece() to validate collision before accepting spawn. If spawn position overlaps with occupied cells, game transitions to GAME_OVER. Updated Test 43 to verify the fix (replaced Risk-002 documentation with fix verification). Updated Tests 36 and 42 to accommodate spawn collision as a valid GAME_OVER trigger after compression. All 254 tests pass. Risk-002 resolved.

---

## 2026-08-13

Updated By: Plan Agent

Summary: Plan v4.0 created for Iteration 2 (MVP Completion). 4 tasks (TASK-014 through TASK-017) to resolve remaining correctness issues (Risk-002: spawnPiece collision), add restart mechanism (Risk-003), optimize hasOccupiedBlocksInColumn() (CR-IT1-002), and update documentation. Debt-008 (CR-IT1-001) verified as fixed in current codebase. Current Iteration updated to Iteration 2 (MVP Completion).

---

## 2026-08-13

Updated By: Code Review Agent

Summary: Code review completed for Iteration 1 (Quality). All 6 tasks (TASK-008 through TASK-013) verified against acceptance criteria. All 257 tests pass. All 10 findings from the previous code review (FINDING-001 through FINDING-010) confirmed as resolved. 2 new findings identified: CR-IT1-001 (Critical: Renderer.drawScore() syntax error, missing `=` on line 220) and CR-IT1-002 (Low: LeftWall.hasOccupiedBlocksInColumn() O(n) performance). Added Debt-008 for CR-IT1-001. Review artifact written to .workflow_doc/40_code_review.md.

---

## 2026-08-13

Updated By: Implement Agent

Summary: TASK-012 completed. Added 3 integration tests (Tests 41-43) to cover identified test coverage gaps: (1) vertical wrapping during compression, (2) multiple consecutive compression cycles, (3) spawn collision with occupied cells. 22 new assertions added. All 257 tests pass (235 existing + 22 new). Risk-004 (Integration Test Coverage Gaps) mitigated. Risk-002 (spawn collision) documented in Test 43. No source code changes (test-only task).

---

## 2026-08-13

Updated By: Implement Agent

Summary: TASK-013 completed. Fixed 4 low-severity findings: (1) removed redundant setPosition(0) in Game.updateCompressing(), (2) added preventDefault?.() for mapped keys in InputManager, (3) cancelled animation frame in GAME_OVER state, (4) moved score text to dedicated UI area below grid (canvas height +30px). All 235 tests pass. Debt-006 and Debt-007 resolved.

---

## 2026-08-13

Updated By: Implement Agent

Summary: TASK-011 completed. Optimized collision detection in ActivePiece.cellsCollide(). Replaced O(n*m) inner loop over getOccupiedCells() with O(1) field.get(x, y) lookup. Maximum comparisons reduced from 512 to 4. All 235 tests pass. Debt-004 resolved.

---

## 2026-08-13

Updated By: Implement Agent

Summary: TASK-010 completed. Fixed alignBlocksVertical block loss in CompressionSystem. Replaced collapsing behavior with distribution algorithm: blocks at wallX are distributed to adjacent empty rows starting from wallY, alternating +offset (downward) and -offset (upward). Vertical looping respected. Test 15 updated to expect block count preservation (2 blocks remain 2). All 235 tests pass. Debt-005 resolved.

---

## 2026-08-11

Updated By: Implement Agent

Summary: TASK-009 completed. Fixed wall push collision validation in LeftWall.onWallAdvanced(). Added collision check before pushing active piece: if any target cell is occupied or out of bounds, piece is fixed in place via moveToFixed(). 12 new assertions added (Test 5b). All 234 tests pass. Debt-003 resolved.

---

## 2026-08-11

Updated By: Implement Agent

Summary: TASK-008 completed. Fixed build process: added clean and postbuild scripts to package.json, cleaned stale debug files from dist/, verified vite.config.ts correct (no changes needed). All 222 tests pass. Build process now supports: `npm run clean` (remove dist/), `npm run build` (tsc + auto-copy HTML), `npm run clean && npm run build` (full clean build).

---

## 2026-08-11

Updated By: Code Review Agent

Summary: Code review completed. All 7 tasks (TASK-001 through TASK-007) verified against acceptance criteria. All 222 tests pass. Build succeeds with no errors. 10 findings identified (0 critical, 3 medium, 7 low). Added Debt-004 through Debt-007 and Risk-002 through Risk-003. Review artifact written to .workflow_doc/40_code_review.md.

---

## 2026-08-11

Updated By: Bird's Eye Review Agent

Summary: Full MVP development cycle reviewed. Project health: Stable. All 7 tasks complete, 222 tests pass. 6 open debt items, 4 risks (3 pre-existing + 1 new integration test gap). Key findings: Task Packet discipline is the project's greatest strength; Challenge Agent was not used (gap); build process needs improvement; documentation quality is high. 4 proven practices identified. 4 lessons extracted. Bird's Eye Review artifact written to .workflow_doc/50_birds_eye_review.md.

---

## 2026-08-11

Updated By: Plan Agent

Summary: Plan v3.0 created for Iteration 1 (Quality). 6 tasks (TASK-008 through TASK-013) to fix build process, resolve medium-severity findings (wall push validation, block loss, collision detection), add integration tests, and clean up low-severity findings. Challenge Agent review recommended for TASK-008 (Vite build) and TASK-010 (block loss design).

---

## 2026-08-21

Updated By: Bird's Eye Review Agent

Summary: Full project evolution reviewed across 4 iterations (TASK-001 through TASK-022). Project health: Stable. All 22 tasks complete, 276 tests pass. 2 open low-severity debt items (Debt-002: rotation origin, Debt-003/004/005/006/007/008/009 all resolved). 1 ongoing risk (test count non-determinism, LIM-021-2). Key findings: Task Packet discipline is the project's greatest strength; Challenge Agent utilization improved from unused to actively used; design deviation documentation is a mature new practice; post-MVP bug-fix iterations follow a consistent repeatable pattern. 5 proven practices identified, 6 lessons learned. Bird's Eye Review artifact written to .workflow_doc/50_birds_eye_review.md.

---

## 2026-08-21

Updated By: Plan Agent

Summary: Plan v7.0 created for Iteration 5 (Game Rule Compliance). Identified 1 spec compliance issue: CompressionSystem.compress() calls alignBlocksVertical() as a fallback when blocks can't move right — not in spec. Challenge Agent review completed: Concern-001 (alignBlocksVertical removal) Accepted, Concern-002 (LeftWall BFS) Partially Accepted (deferred), Concern-003 (LeftWall reset timing) Accepted (no change). 2 tasks: TASK-023 (remove alignBlocksVertical from CompressionSystem), TASK-024 (update Test 15). Current Iteration updated to Iteration 5 (Game Rule Compliance).

---

## 2026-08-10

Updated By: Implement Agent

Summary: TASK-007 completed. Created browser entry point src/entry.ts that initializes Game and starts the game loop. Updated index.html with game instructions and correct script reference. Separated browser entry from test suite (src/main.ts remains tests-only). All 222 tests pass. Build succeeds with no errors. Game is now playable in the browser via `npx serve dist`.

---

## 2026-08-10

Updated By: Implement Agent

Summary: TASK-006 completed. Created Game class in src/Game.ts with three-state state machine (PLAYING, COMPRESSING, GAME_OVER). Game loop via requestAnimationFrame. Component coordination: Field, ActivePiece, LeftWall, RightWall, CompressionSystem, InputManager, Renderer. Piece spawning at max(2, rightWall.x - 4). Score = block density percentage. 24 new tests added (Tests 31-40). Total: 222 tests pass.

---

## 2026-08-10

Updated By: Implement Agent

Summary: TASK-005 completed. Created Renderer class in src/Renderer.ts with Canvas-based rendering. Render order: clear, grid, blocks, active piece, walls, UI. Color scheme per spec. Score displayed at top, game over overlay with final density. 18 new tests added (Tests 23-30). Total: 198 tests pass.

---

## 2026-08-10

Updated By: Implement Agent

Summary: TASK-004 completed. Created InputManager class with poll-based input model. Key mapping: Space=ROTATE, ArrowUp=WALL_UP, ArrowDown=WALL_DOWN. Set-based deduplication prevents input flooding. 24 new tests added. Total: 180 tests pass.

---

## 2026-08-09

Updated By: Implement Agent

Summary: TASK-003-FIX completed. Fixed 4 test failures in CompressionSystem.compress(). All 156 tests pass. Debt-001 resolved.

---

## 2026-08-09

Updated By: Plan Agent

Summary: Plan v2.0 created. Identified 4 CompressionSystem test failures. Created TASK-003-FIX, TASK-004, TASK-005, TASK-006, TASK-007 task packets. Defined Game state machine architecture.
