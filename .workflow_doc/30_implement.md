# Implementation Report

Author: Implement Agent

Date: 2026-09-26

Task-ID: TASK-041

---

# Task Summary

Title: Add Automated Dist-Output Verification to the Build Pipeline

Objective: Create `scripts/check-dist.mjs` — a standalone Node ESM script that verifies the dist output after a build — and wire it into the `postbuild` npm script so `npm run build` catches dist problems before CI deploy.

Summary:
Created `scripts/check-dist.mjs` (plain Node ESM, no TypeScript, no external dependencies) implementing the three required checks — `dist/index.html` exists, `dist/index.html` contains `src="entry.js"`, and `dist/entry.js` exists — and wired it to `package.json` `postbuild`. The script resolves all paths from its own location via `import.meta.url`/`fileURLToPath` (cwd-independent) and fails with a clear `stderr` message plus a non-zero exit on any failed check. All 8 Acceptance Criteria verified against the live codebase. The script was implemented verbatim from the Task Packet's reference implementation; one implementation decision (the `path.resolve` path form vs. the DEC-041-2 prose `new URL(...)` form) and one factual correction to the packet's `styles.css` assumption are documented below. No design deviations.

---

# Acceptance Criteria

## AC-1: `scripts/check-dist.mjs` exists and is a valid Node ESM script (no TypeScript, no external dependencies)

Status: Pass

Evidence: File created at `scripts/check-dist.mjs`. `.mjs` extension forces ESM. Imports are exclusively Node built-ins with the `node:` prefix (`node:fs`, `node:url`, `node:path`); no third-party or TypeScript imports. The script executed successfully under `node scripts/check-dist.mjs` (exit 0 on a good dist), which proves it is valid, runnable ESM.

Notes: Implemented verbatim from the Task Packet's "Implementation Notes → Script content (reference implementation)".

## AC-2: The script resolves all paths from its own location (uses `import.meta.url` or `fileURLToPath`), NOT from `process.cwd()`

Status: Pass

Evidence: `const __dirname = path.dirname(fileURLToPath(import.meta.url));` then `const distDir = path.resolve(__dirname, '../dist');`. No reference to `process.cwd()` exists in the script.

Notes: Verified independently by invoking the script from a different working directory — `cd /tmp && node /workspaces/osuris/scripts/check-dist.mjs` — all three checks still resolved and passed (exit 0), confirming cwd-independence (F-IT9-05).

## AC-3: The script checks: (1) `dist/index.html` exists, (2) `dist/index.html` contains `src="entry.js"`, (3) `dist/entry.js` exists

Status: Pass

Evidence: All three checks implemented (DEC-041-3). Build output shows the three `✓` lines. Failure paths independently exercised: corrupting `dist/index.html` (reverting the sed rewrite) made check #2 fail; deleting `dist/entry.js` made check #3 fail — each printed its own `✗` line.

## AC-4: On failure, the script prints a clear message to `stderr` and exits with a non-zero status

Status: Pass

Evidence: `check()` writes failures via `console.error` (→ `stderr`); the failure block writes `check-dist: FAILED — fix the build before deploying.` via `console.error` and calls `process.exit(1)`. Verified: corrupted `dist/index.html` → clear per-check message + `FAILED` line + exit 1; deleted `dist/entry.js` → same, exit 1.

## AC-5: `package.json` `postbuild` includes `&& node scripts/check-dist.mjs` at the end

Status: Pass

Evidence: `package.json` `postbuild` now ends with `... dist/index.html && node scripts/check-dist.mjs`. Confirmed in the `npm run build` output, which echoes the full `postbuild` command and then shows the `check-dist:` output.

## AC-6: `npm run build` succeeds (the full build + check pipeline works)

Status: Pass

Evidence: `npm run build` → `tsc` compiles (exit 0), `postbuild` copies + rewrites `index.html`, then `check-dist` runs and reports `all checks passed.` Overall exit 0.

## AC-7: `npx tsc && node dist/main.js` still reports `Failed: 0` (the standard test flow is unaffected)

Status: Pass

Evidence: `npx tsc && node dist/main.js` → `Passed: 473 / Failed: 0 / Total: 473 / All tests PASSED.`, exit 0. This flow does not invoke `postbuild`, so the dist check is not executed — confirming DEC-041-1 (the check is intentionally outside the test-suite flow).

## AC-8: `npx tsc --noEmit` exits with status 0

Status: Pass

Evidence: `npx tsc --noEmit` → exit 0, no diagnostics.

---

# Completed Work

- Created the `scripts/` directory (did not previously exist).
- Created `scripts/check-dist.mjs` — a standalone Node ESM verification script (no TypeScript, no external dependencies) implementing the three required checks and the fail-with-clear-message + non-zero-exit behavior.
- Updated `package.json` `postbuild` to append `&& node scripts/check-dist.mjs` so `npm run build` (the CI build command) runs the check.
- Verified all 8 Acceptance Criteria against the live codebase, including the two failure scenarios (corrupted `index.html`, missing `entry.js`) and the cwd-independence scenario.
- Resolved the Task Packet's open question about `styles.css` (see Known Limitations / Review Notes).

---

# Modified Files

## File

Path: `scripts/check-dist.mjs`

Purpose: New standalone Node ESM script that verifies the `dist/` output after a build.

Summary of Changes: New file. Resolves `distDir` from `import.meta.url` (cwd-independent). Checks `dist/index.html` existence, `src="entry.js"` content, and `dist/entry.js` existence; logs per-check `✓`/`✗`; on any failure prints an actionable message to `stderr` and exits 1.

## File

Path: `package.json`

Purpose: Wire the dist check into the build pipeline.

Summary of Changes: `scripts.postbuild` changed from `cp index.html dist/ && sed -i '...' dist/index.html` to the same command with ` && node scripts/check-dist.mjs` appended. No other script or field changed.

---

# Implementation Decisions

## DEC-041-IMPL-1: Path resolution form (reference-implementation `path.resolve` vs. DEC-041-2 prose `new URL(...)`)

Type: Task Decision

Description: The Task Packet presents two cwd-independent path-resolution forms: the DEC-041-2 *Constraint Description* shows `const distDir = new URL('../dist/', import.meta.url);` (a `file://` URL object), while the *Implementation Notes → reference implementation* uses `const __dirname = path.dirname(fileURLToPath(import.meta.url)); const distDir = path.resolve(__dirname, '../dist');` (a filesystem path string). The implemented script uses the latter (the reference implementation).

Reason: Both forms satisfy AC-2 ("uses `import.meta.url` or `fileURLToPath`") and the cwd-independence intent (F-IT9-05). The reference implementation in the Implementation Notes is the concrete, copy-paste-ready version the packet provides; its `path.resolve`/`path.join` output is a filesystem path directly consumable by `fs.existsSync`/`readFileSync`/`path.join` without a `fileURLToPath` conversion at each use site.

Impact: None on behavior. Documented so the Code Review Agent does not flag the difference from the DEC-041-2 prose snippet as a deviation. This is compliance with the packet's own reference implementation, not a design change.

## DEC-041-IMPL-2: Challenge Agent not invoked

Type: Task Decision

Description: The Challenge Agent was not consulted for this task.

Reason: The Challenge Usage guidance targets multiple-strategy / complex-algorithm / significant-refactor / performance / concurrency / ambiguous-intent situations. This task is a well-specified, low-risk script creation with a full reference implementation provided in the packet; there were no competing strategies or architectural trade-offs. Invoking the advisor would add cost without changing the outcome.

Impact: None. Recorded so downstream agents know the omission was deliberate, not an oversight.

---

# Design Deviations

None. The script was implemented verbatim from the Task Packet's reference implementation, and the `package.json` change matches the packet's specified `postbuild` string exactly. The `styles.css` item below is a factual correction to a packet assumption, not a design deviation (the script correctly does NOT check CSS, per the packet's own "What the script does NOT check" scope).

---

# Testing

## Executed Tests

- Baseline (pre-change): `npx tsc --noEmit` (exit 0); `npm run build` (exit 0, old `postbuild`); `node dist/main.js` (473/473, Failed: 0).
- `npm run build` with the new `postbuild` → build + check pipeline; all three `check-dist` checks pass; exit 0.
- `npx tsc --noEmit` → exit 0.
- `npx tsc && node dist/main.js` → 473/473, Failed: 0, exit 0 (standard test flow unaffected — DEC-041-1).
- Verification step 3: `rm dist/entry.js` → `npm run build` → `tsc` re-emits `entry.js`, check passes, exit 0.
- Verification step 4 (corrupt): revert `src="entry.js"` in `dist/index.html` → run `node scripts/check-dist.mjs` directly → check #2 fails with a clear `✗` + `FAILED` message, exit 1.
- Extra (missing file): `rm dist/entry.js` → run `node scripts/check-dist.mjs` directly (no rebuild) → check #3 fails, exit 1.
- Extra (cwd-independence, AC-2): `cd /tmp && node /workspaces/osuris/scripts/check-dist.mjs` → all checks pass, exit 0.
- Restored a clean `dist/` with a final `npm run build` after the destructive checks.

## Results

Pass

Summary: All 8 Acceptance Criteria verified. The three positive checks pass on a good build; both failure scenarios (corrupted `index.html`, missing `entry.js`) produce a clear `stderr` message and exit 1; cwd-independence confirmed. The standard test flow (`npx tsc && node dist/main.js`) is unchanged (473/473, Failed: 0), confirming DEC-041-1.

---

# Known Limitations

## LIM-041-1: Scope of the dist check

Description: The script verifies existence/content of `dist/index.html` and existence of `dist/entry.js`. It does not verify that `dist/entry.js` is runtime-correct (i.e., that it actually boots the game), nor does it check `dist/main.js` (a dev artifact) or CSS.

Impact: A syntactically-valid but logically-broken `entry.js` (e.g., a runtime `ReferenceError` at module top-level) would pass the existence check. This is by design and matches the Task Packet scope; the check is a cheap build-sanity gate, not a runtime test.

Possible Future Solution: A headless smoke test (load `dist/entry.js` under a DOM shim) — out of scope for this task and heavier than the MVP build gate warrants.

## LIM-041-2: `src/styles.css` is an orphaned file (correction to a Task Packet assumption)

Description: The Task Packet's "What the script does NOT check" note assumed `styles.css` "is in `src/` and referenced from `index.html`" (the packet author left this as an open question: "actually, let me check"). Verified this session: `src/styles.css` exists (591 bytes) but is referenced **nowhere** in `src/`, `index.html`, or `vite.config.ts` (grep for `styles.css` and `.css'`/`.css"` imports returned no matches). `index.html` has no `<link rel="stylesheet">` or `.css` reference; the only external reference is `<script type="module" src="./src/entry.js">`.

Impact: None for this task — the check correctly does not test CSS, so the task is unaffected regardless of the CSS question. The factual correction matters for future agents: `src/styles.css` appears to be dead/unreferenced, not "referenced from index.html".

Possible Future Solution: A separate cleanup task should confirm whether `styles.css` is intended to be loaded (and if so, wire it in) or delete it as dead. Recorded as a Review Note for the Iteration 9 Code Review Agent.

---

# Deliverables

- Source Code: `scripts/check-dist.mjs` (new).
- Build config: `package.json` (`postbuild` updated).
- Documentation: this Implementation Report (`.workflow_doc/30_implement.md`); Project State and Next Actions updated.

---

# Review Notes

- **Verify the pipeline wiring, not just the script.** The task's value is that `npm run build` (the CI build command in `.github/workflows/deploy.yml`) now fails when the dist output is broken. Confirm `postbuild` ends with `&& node scripts/check-dist.mjs` and that `npm run build` runs the check (visible in the build output).
- **DEC-041-IMPL-1 is not a deviation.** The script follows the packet's own reference implementation (`path.resolve(__dirname, ...)`), which differs only cosmetically from the `new URL(...)` form shown in the DEC-041-2 constraint prose. Both satisfy AC-2.
- **DEC-041-IMPL-2 (Challenge not invoked)** was a deliberate scope judgment for a low-risk, fully-specified task; flag if the review process requires advisor coverage for every task regardless of risk.
- **LIM-041-2 is a real finding for triage.** `src/styles.css` is unreferenced. This does not block TASK-041 but is a candidate for the Iteration 9 cleanup backlog.
- The script intentionally does NOT run under the standard `npx tsc && node dist/main.js` test flow (DEC-041-1); do not treat "the check didn't run in the test flow" as a defect.

---

# Recommended Next Actions

- [ ] Dispatch Code Review for Iteration 9 (all 4 tasks — TASK-039/040/041/042 — are now DONE).
- [ ] Triage LIM-041-2: decide whether `src/styles.css` should be wired into the build or removed as dead (separate cleanup task; not this task's scope).
- [ ] Optional (future): add a headless smoke test that actually boots `dist/entry.js` if the build gate needs to catch runtime-level breakage (LIM-041-1).
