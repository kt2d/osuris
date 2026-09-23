# Next Actions

Last Updated: 2026-09-23

Updated By: Plan Agent

---

# Tasks

Iteration 9 (Quality Sweep) — Plan v11.0 created 2026-09-23.

- TASK-039: DONE (2026-09-23) — Git baseline established. Commit `5b34bc2` (99 files, 21,019 insertions). `.gitignore` extended with `node_modules/` and `dist/`. Index cleared from 1,655 → 99 files. Report in `.workflow_doc/30_implement.md`.
- TASK-040: READY — Low cleanup bundle + determinism hardening. Remove Test 42 dead tolerance (CR-IT5-001), add CR-IT8-001 comment + Test 70 pin, fix CR-IT8-002 JSDoc, add `randomSource()` seam + `TestGame` (LIM-021-2 re-scoped), update README. Priority: High.
- TASK-041: READY — Add `scripts/check-dist.mjs` and wire to `postbuild`. Priority: Medium. Independent of TASK-040/042.
- TASK-042: BLOCKED (by TASK-040) — Split `src/main.ts` into `src/tests/` component files (thin entry + 10 files). Priority: High.

Iteration 8 (Compression System Fix) — Plan v10.0 created 2026-09-03. Iteration 8 is COMPLETE (all 3 tasks DONE).

- TASK-036: DONE (2026-09-08) — `CompressionSystem` movement target now seeds at the left-wall column and expands only to the same-row right neighbor. 434/434 tests pass; report in `.workflow_doc/30_implement.md`.
- TASK-037: DONE (2026-09-13) — `RightWall.moveBlocksVertical` now moves only blocks at the wall's own column; BFS LEFT expansion removed. 442/442 tests pass; report in `.workflow_doc/30_implement.md`.
- TASK-038: DONE (2026-09-13) — regression coverage added: Test 68 (`CompressionSystem` movement target, 11 assertions, incl. DEV-036-1 right-wall abort) and Test 69 (`RightWall` vertical shift, 10 assertions). 463/463 tests pass; report in `.workflow_doc/30_implement.md`.
- Code Review (Iteration 8): DONE (2026-09-18) — PASS. All 12 ACs re-verified (tsc 0 errors, 463/463, build OK). 2 Low non-blocking findings: CR-IT8-001 (vestigial single-pass `pushBlocksRight` loop), CR-IT8-002 (JSDoc indentation nit). Report in `.workflow_doc/40_code_review.md`.

Iteration 7 (Bug Fixes) is COMPLETE (2026-09-01). Plan v9.0. TASK-030 through TASK-035 are DONE.

All prior tasks through Iteration 7 are DONE.

---

# Backlog

- Iteration 9 (Quality Sweep) is IN PLANNING (Plan v11.0 created 2026-09-23; 4 task packets written).
- Debt-002 (rotation origin): Low priority, future iteration. Begin with a Challenge Agent cycle.
- SRS-style rotation with wall kicks: Future iteration (largest remaining UX debt).
- Additional piece types: Future iteration (after the above).

---

# Workflow Notes

- **2026-09-23 TASK-039 completed (Iteration 9, first task):** Git baseline established. Commit `5b34bc2` (99 files). `.gitignore` extended with `node_modules/` and `dist/`. Risk-005 RESOLVED. Per-task commit discipline now active. Next dispatch: TASK-040 (High) and TASK-041 (Medium) are both READY. Report in `.workflow_doc/30_implement.md`.
- **2026-09-23 Plan v11.0 created (Iteration 9 Quality Sweep):** 4 tasks created: TASK-039 (git baseline), TASK-040 (Low cleanup + determinism), TASK-041 (dist check), TASK-042 (main.ts split). Challenge Agent review (2026-09-23) complete; all 8 findings (F-IT9-01 through F-IT9-08) accepted and incorporated into task packets. Execution order: TASK-039 → TASK-040 → TASK-042; TASK-041 independent. Task packets in `.workflow_doc/25_task_packets/`. Next dispatch: TASK-039 (git baseline) — the first and only READY task with no dependencies.
- **2026-09-23 Challenge Agent review completed (Iteration 9 Quality sweep design):** Advisory review of the proposed TASK-039/040/041/042 design (per Recommendation-BE-010). Verdict: design sound; cleanup-before-split ordering endorsed; split design verified safe (ESM module-evaluation ordering; no cross-section shared variables beyond harness/mocks). Task packets must carry these corrections before dispatch: F-IT9-01 (clear the git index before the baseline commit — 1,560 node_modules/dist files are already staged; .gitignore does not unstage them), F-IT9-02 (TASK-040.5 premise wrong — re-scope as determinism hardening; Test 42 is deterministic today), F-IT9-03 (TASK-042 ACs: 70→71 sections after TASK-040; add count-baseline capture step), F-IT9-04/05/06/07/08 (Test 70(b) is the new pin; add dist/entry.js check; merge Test 6 into activePiece.test.ts; write the import rule into the TASK-042 packet). Report in `.workflow_doc/20_challenge.md`.
- **2026-09-18 Bird's Eye Review completed (Iterations 0–8, focus IT5–8)**: Project health **Healthy** (up from Stable). Key findings: (1) recurring spec-interpretation bug class resolved — "contacting the wall" = "at the wall's own column" (Lesson-002; 3 instances: Debt-005, BUG C, BUG D); (2) 2026-09-01 Challenge F9/F10 "not a bug" verdicts were later overturned (they described exactly BUG C/BUG D) — spec-interpretation verdicts are low-confidence (now in Workflow Knowledge); (3) spec-vs-implementation comparison at plan time is the primary rule-bug detector; (4) two new actionable gaps recorded: Debt-010 (main.ts 2,903 lines / 463 assertions crossed the ~400 split threshold) and Risk-005 (zero git commits — no VCS baseline). Positive: 15 design deviations all legitimate; fix + regression pin pairing standard; zero regressions at iteration boundaries. Next: user selects Iteration 9 scope (candidates: quality sweep = git baseline + main.ts split + Low cleanup + determinism; or Debt-002 SRS rotation) → Plan Agent. Report in `.workflow_doc/50_birds_eye_review.md`.
- **2026-09-18 Code Review completed (Iteration 8)**: PASS. TASK-036/037/038 all 12 ACs independently re-verified (tsc 0 errors, 463/463, build OK); both BUG C and BUG D confirmed fixed per `compress-mechanism.md`. 2 Low non-blocking findings (CR-IT8-001, CR-IT8-002) logged to Backlog. Iteration 8 is COMPLETE (tasks DONE + review PASS). Next dispatch: Bird's Eye Review Agent (Bird's Eye Rule satisfied — no READY/RUNNING/REVIEW/BLOCKED tasks remain, DONE tasks exist). Report in `.workflow_doc/40_code_review.md`.
- **2026-09-13 TASK-038 completed (Iteration 8, final task)**: Regression coverage added (Test 68, Test 69) in `src/main.ts`. No production source modified. 463/463 tests pass, `npx tsc` 0 errors, `npm run build` succeeds. Iteration 8 tasks COMPLETE. Report in `.workflow_doc/30_implement.md`.
- **2026-09-13 TASK-037 completed (Iteration 8)**: `RightWall.moveBlocksVertical` fixed (only wall-column blocks move; BFS LEFT expansion removed). 442/442 tests pass, `npx tsc` 0 errors, `npm run build` succeeds. Report in `.workflow_doc/30_implement.md`.
- **2026-09-08 TASK-036 completed (Iteration 8)**: `CompressionSystem` movement target fixed (seed at left wall column, expand right only; right-wall boundary abort). 434/434 tests pass, `npx tsc` 0 errors, `npm run build` succeeds. Report in `.workflow_doc/30_implement.md`.
- **2026-09-03 Plan v10.0 created for Iteration 8 (Compression System Fix)** (artifact: `.workflow_doc/10_plan.md`). The plan targets two movement-target bugs: BUG C (`CompressionSystem` seeds movement target at right-wall adjacent column and expands left) and BUG D (`RightWall.moveBlocksVertical` drags horizontally connected blocks vertically). Three tasks were created under `.workflow_doc/25_task_packets/`: TASK-036, TASK-037, and TASK-038.
- **2026-09-01 Iteration 7 completed**: all 6 tasks (TASK-030 through TASK-035) are DONE. Code Review passed with 434/434 tests and 0 TypeScript errors.
- **2026-08-31 Iteration 6 completed**: all 5 tasks (TASK-025 through TASK-029) are DONE.
- Iteration 0 through Iteration 8 are COMPLETE.
- Game is playable in the browser via `npx serve dist`.
- Each new iteration should begin with a Challenge Agent review cycle.

---

# Runner Notes

## Dispatch Rule

Runner dispatches the first READY task whose dependencies are all DONE, in priority order (High > Medium > Low).

Current dispatch (Iteration 9): TASK-039 is DONE. **TASK-040** (Low cleanup + determinism, High priority) and **TASK-041** (dist check, Medium priority) are both READY. Dispatch TASK-040 first per priority. After TASK-040 is DONE, TASK-042 becomes READY.

## Task Dependencies

```
Iteration 9 (Quality Sweep):
TASK-039 (git baseline) → DONE (2026-09-23, commit 5b34bc2)
TASK-040 (Low cleanup + determinism) → READY
TASK-041 (dist check) → READY
TASK-042 (main.ts split) → BLOCKED (dep: TASK-040)

Iteration 8 (Compression System Fix) — COMPLETE:
TASK-036 (CompressionSystem fix) → DONE (2026-09-08)
TASK-037 (RightWall vertical shift fix) → DONE (2026-09-13)
TASK-038 (regression coverage) → DONE (2026-09-13)
Code Review (Iteration 8) → PASS (2026-09-18)

Iteration 7 (all DONE):
TASK-030 through TASK-035 → DONE
```

Recommended execution order (Iteration 9):

1. ~~TASK-039 (git baseline)~~ — DONE (2026-09-23)
2. TASK-040 (Low cleanup + determinism hardening) — dispatch now
3. TASK-041 (dist check) — READY, independent of 040/042
4. TASK-042 (main.ts split) — after TASK-040
5. Code Review (Iteration 9) — after all 4 tasks DONE
6. Bird's Eye Review — if the Bird's Eye Rule is satisfied

## Completion Rule

After agent completes:

1. Verify deliverable file exists
2. Verify tests pass (`npx tsc && node dist/main.js`)
3. Update Status to DONE
4. Clear Next Action

## Retry Rule

If agent fails:

1. Set Status to BLOCKED
2. Record cause in Notes
3. Do not auto-retry

## Bird's Eye Rule

Bird's Eye Review runs only when:

- No READY tasks remain
- No RUNNING tasks remain
- No REVIEW tasks remain
- No BLOCKED tasks remain
- At least one DONE task exists
