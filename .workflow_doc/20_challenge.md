# Challenge Report — Iteration 9 Quality Sweep (TASK-039 through TASK-042)

- **Reviewer:** Challenge Agent (advisory sub-agent)
- **Date:** 2026-09-23
- **Scope:** Challenge of the proposed Iteration 9 design: TASK-039 (git baseline), TASK-040 (Low cleanup bundle: CR-IT8-001 comment, CR-IT8-002 JSDoc, CR-IT5-001 dead tolerance, LIM-021-2 determinism, Test 70 pin), TASK-041 (dist check), TASK-042 (main.ts split by component).
- **Method:** Read the live source of every file the design touches (`src/main.ts` full read, `src/Game.ts`, `src/CompressionSystem.ts`, `src/RightWall.ts`, `src/LeftWall.ts`, `src/EffectSystem.ts`, `tsconfig.json`, `package.json`, `.gitignore`, `index.html`, `vite.config.ts`, `README.md` 199-210/249-267, `.git` index state, `.github/workflows/deploy.yml`) plus the shared-memory docs. Findings are advisory; the Plan Agent decides.

**Verdict:** The overall design is sound. Task ordering (cleanup before split) is correct. The split design (module-scope execution, mocks-first import order, verbatim move) is **safe** — I found no cross-section shared variables that break the 9-file grouping, and the ESM evaluation-order concern is unfounded (ESM evaluates imported modules before the importing module body, in import order). However, **one High-severity operational gap** (TASK-039: the git index already contains ~1,560 staged files under `node_modules/` and `dist/`, which `.gitignore` does NOT remove) and **two Medium factual errors in the design's stated rationale** (TASK-040.5's nondeterminism premise; TASK-042's stale "70 sections" AC) must be corrected in the task packets. Details below.

---

# Findings

## F-IT9-01: TASK-039 — the git index already contains node_modules/ and dist/; .gitignore will not remove them

Severity: **High**

Description: The design says "extend .gitignore with node_modules/ and dist/, then make ONE initial commit... Verify git ls-files excludes node_modules/dist." This assumes those paths are merely untracked. They are not: the repository already has a **populated index** (someone ran `git add` without committing). `.gitignore` only affects **untracked** files; files already in the index remain staged and a naive `git add . && git commit` commits all 1,560 of them.

Evidence (live repo):
- `git log` → "fatal: your current branch 'main' does not have any commits yet" (zero commits).
- `git ls-files | wc -l` → **1655**; `git ls-files | grep -c '^node_modules/\|^dist/'` → **1560** (node_modules/ + dist/ staged in the index).
- `git status` → "No commits yet … Changes to be committed: new file: …" (the 22 top-level entries are **staged**, not untracked).
- `.gitignore` contains only `.DS_Store` (so the Bird's Eye Review's "`.gitignore` already covers node_modules/dist" is wrong — see A-IT9-02).

Impact: If the packet is executed as written, the initial commit includes `node_modules/` and `dist/`, permanently polluting the baseline; the AC "git ls-files excludes node_modules/dist" fails, or worse, passes only if the implementer happens to notice.

Recommendation: Make TASK-039 explicit: (1) extend `.gitignore` (`node_modules/`, `dist/`); (2) clear the index before the initial commit — `git rm -r --cached node_modules dist` or, simpler with zero commits, `git reset` (empties the index; nothing to lose since there are no commits); (3) `git add .`; (4) verify `git ls-files | grep -c '^node_modules/\|^dist/'` = 0 **and** `git ls-files | wc -l` ≈ 100 before committing.

## F-IT9-02: TASK-040.5 (LIM-021-2) — the stated root cause is wrong; Test 42 is deterministic today

Severity: **Medium**

Description: The design's rationale is: "the random kind of the piece fixed in cycle 1 determines whether the next spawn collides → PLAYING vs GAME_OVER branch → variable assertion count." I traced Test 42 (main.ts:1627-1707) against the live `Game.ts`/`LeftWall.ts`/`CompressionSystem.ts`/`Field.ts` and this is **false for the current code**:

1. The cycle-1 piece is fixed at the spawn column (x=6..9, y=4..5) inside `updateCompressing()` (`Game.ts:326-350`), before `compress()`.
2. `compress(14)` finds the wall column x=14 empty (seeded movement set empty, `CompressionSystem.ts:147-157` + `170-184`), finalizes in place, resets the wall, returns true (`CompressionSystem.ts:98-104`).
3. The next spawn (spawnX=6, spawnY=4, `Game.ts:399-433`) collides **for every pair of piece kinds**: every rotation-0 shape occupies at least one cell of x=6..9, y=4..5 that intersects any previously fixed piece (I verified all 7 shapes against all 7), so the next spawn **always** fails → GAME_OVER → the cycle-2/3 branches (gated on PLAYING at main.ts:1665, 1694) never execute. The assertion count is therefore already deterministic today; the 276↔279 variance predates TASK-023's removal of the no-movement/no-reset path.

Impact: The task's stated justification is wrong, and the Implement Agent will be unable to reproduce "variable assertion count" when verifying. The fix itself (seeded RNG) is still worth doing — see ALT-040-1 — but as **future-proofing**, not as a bug fix.

Recommendation: Re-scope TASK-040.5 as "determinism hardening / future-proofing": add `protected randomSource(): number { return Math.random(); }` to `Game` (used at `Game.ts:410`, which today calls `Math.floor(Math.random() * 7)` directly) and a `TestGame` override; state in the packet that the observable count will NOT change, and that the AC is "same total before and after." Also instruct the Implement Agent to re-verify the exact stable count at execution time rather than hard-coding 463 in the AC.

## F-IT9-03: TASK-042 — two acceptance criteria are stale/ambiguous as written

Severity: **Medium**

Description:
1. **"All 70 section headers present exactly once."** Verified: `src/main.ts` contains exactly 70 `section(` calls (the 71st grep hit is the `function section` definition at main.ts:28-30). But TASK-040 adds Test 70 **before** TASK-042 (the dependency is correctly 040→042), so the post-split suite has **71** sections. The AC as written will be "verified false" by a diligent reviewer.
2. **"Total assertion count identical to pre-split run."** Because the split is a verbatim move, the count is preserved — but the AC needs an explicit capture step, otherwise the Implement Agent has no baseline to compare against.

Evidence: TASK-040/042 design text; main.ts structure (70 `section(` calls; harness counters at main.ts:15-16).

Impact: Ambiguous ACs are exactly what the Task Packet Guidelines warn against ("Implement Agent needs only Task Packet + Project State + Next Actions"); an un-runnable AC invites a spurious deviation or a mis-verified close-out.

Recommendation: Re-word the TASK-042 ACs: (a) "the same set of section headers as the pre-split baseline (71 after TASK-040); each appears exactly once"; (b) "the assertion total equals the pre-split baseline captured in the same session, run ≥2× before and after the move."

## F-IT9-04: Test 70 — scenario (a) duplicates Test 68; scenario (b) is the genuinely new pin and works as described

Severity: **Low**

Description:
- **(a) verified true:** with the chain at cols 11..14, `compress(14)` moves exactly one column ((14,y)→(15,y); 11..13 stay; count preserved). The loop is single-pass because `moveRight` vacates the seed column, so the next `buildMovementSet(leftWallX)` returns empty and the loop breaks (`CompressionSystem.ts:147-157`, `170-206`, `244-255`).
- **(b) verified true:** a second `compress(14)` call takes the no-movement path: `shouldCompress(14)` true → empty movement set → no movement → field not full → `resetLeftWall()` → return true (`CompressionSystem.ts:74-105`). With `onLeftWallReset = null`, `resetLeftWall()` is a safe no-op (`CompressionSystem.ts:265-269`), so the field is unchanged and the return is **true**.
- **Non-overlap with Test 68 verified:** Test 68 (main.ts:2802-2838) pins (1) blocks behind the wall are not pulled into the movement target and (2) the right-wall abort; it does not pin cross-call idempotency. 70(a) is nonetheless a near-duplicate of Test 68's assertions 68b-68e.

Impact: Minor scope overstatement; if (a) is dropped the test name "invariant pin" overstates coverage of (b).

Recommendation: Keep (a) as an explicit same-call single-step pin (cheap) or drop it; keep (b) as the new pin and state its expected return value (true) and expected field state in the packet so the Implement Agent writes the right assertions.

## F-IT9-05: TASK-041 — postbuild wiring is sound; two small hardening points

Severity: **Low**

Description: The design's rationale is **verified correct**: the standard verification flow `npx tsc && node dist/main.js` does not run `postbuild`, and a suite-internal dist/index.html check would break that documented flow (the suite never reads `dist/index.html` — I found no `readFileSync`/`index.html` reference in the 2,903-line suite). `npm run build` = `tsc` + postbuild (`package.json:8-9`), so appending `&& node scripts/check-dist.mjs` to `postbuild` works; `npm run clean && npx tsc && node dist/main.js` and the Vite flows (`vite.config.ts` builds from root `index.html`) are unaffected.

Evidence: `package.json` scripts; `vite.config.ts` (`root: '.'`, input `./index.html`); `index.html:76` (`src="./src/entry.js"` — the string the sed rewrites); `.github/workflows/deploy.yml` (runs `npm run build` on push to main).

Impact: A broken `check-dist.mjs` fails `npm run build` and therefore **blocks the GitHub Pages deploy** in CI.

Recommendation: (1) Also assert `dist/entry.js` exists — the sed rewrite is only half the contract; the other half is that tsc actually emitted `dist/entry.js` from `src/entry.ts`. (2) Resolve paths from the script's own URL (`new URL('../dist/index.html', import.meta.url)`) instead of cwd. (3) State the blast radius in the packet so the Implement Agent ACs a local `npm run build` before pushing.

## F-IT9-06: TASK-042 — 9-file grouping: `field.test.ts` is a 1-test file misnamed by component

Severity: **Low**

Description: Test 6 (main.ts:431-442) tests `ActivePiece.getOccupiedCells()` vertical wrapping; `Field` appears only as a constructor argument. A "field.test.ts" containing it would mislead the next reader about where field-topology tests live. `input.test.ts` grouping (17-22, 45) is correct — Test 45 is an InputManager test.

Recommendation: Fold Test 6 into `activePiece.test.ts` (or rename the file). Minor; no behavioral risk.

## F-IT9-07: TASK-042 — module-scope execution design verified safe; one authoring pitfall to write into the packet

Severity: **Low**

Description: The split design is sound, and the direct answer to question 1(a)/(b):
- **ESM ordering (1a):** ES modules evaluate imported modules' bodies before the importing module's body, in import order. `main.ts` importing `./tests/mocks.js` first, then component files, guarantees the RAF-override + mock classes exist before any test body runs. **Safe.**
- **RAF global override (1b):** the overrides are module-scope side effects in `mocks.ts` (today main.ts:1222-1237); under the design they run at `mocks.js` evaluation, before the first component module body. **Safe.**
- **Shared variables (1c):** full read of main.ts found **no cross-section shared variables** beyond the harness counters and the mocks. Cross-file usage that must live in `harness.ts`/`mocks.ts` (verified): `assert`/`section`/counters (everywhere); `TestLeftWall` (Tests 4,5,5b,47-54,56,62,64,65,66 — note 65 uses only ActivePiece but 62/64 use TestLeftWall inside game.test.ts); `MockRenderContext`/`MockRenderCanvas`/`MockGameCanvas` (renderer/game/effects files); `gameTick`/`gameTicks`/`rafCallbacks` (game/effects files). Within-file module-scope consts (`field`/`piece` in Tests 2-3; `actions` in Tests 17-22,45; `testField`/`testPiece`/`testLeftWall`/`testRightWall` in Tests 23-30,60,61; `runBrowserFrame` in Test 46) are all verbatim-movable because each group's tests stay in one file.

Evidence: main.ts:15-52, 118-168, 766-791, 799-800, 923-982, 1178-1251, 1874-1881, 2211-2219, 2271-2279.

Impact: Without an explicit instruction, the Implement Agent may write a test file that uses a mock without importing it (runtime `ReferenceError` that `tsc` does not catch), or import a mock directly in a test file, silently making the load order depend on import bookkeeping.

Recommendation: Write into the TASK-042 packet: component test files import **only** from `./harness.js` and `./mocks.js`; mocks are never constructed in test files; `main.ts` imports `./tests/mocks.js` first and calls `printSummary()` as its last statement; `printSummary()` keeps the exact summary format and the throw-on-failure (so `node dist/main.js` exits non-zero on any failure).

## F-IT9-08: TASK-040.5 — TestGame pattern choice is correct; one latent trap for future tests

Severity: **Low**

Description: The protected-method-override choice (DEC-040-1) matches the established pattern: `TestLeftWall.currentTimeMillis()` (main.ts:36-52) and `TestEffectSystem.currentTimeMillis()` (main.ts:2271-2279) are both subclass overrides of a `protected` clock seam (`LeftWall`/`EffectSystem` expose `currentTimeMillis()`; `Game.currentTimeMillis()` exists at Game.ts:163-165). `Game`'s constructor is also the production entry point (`src/entry.ts`), so a constructor-parameter seam would widen the production API surface for a test-only concern.

On question 2's sub-question (Date.now / tick gating): **no residual nondeterminism in Test 42.** The wall in Test 42 is the real `LeftWall`, but `Game.updatePlaying()` gates movement on `tick(this.elapsedTime())` (`Game.ts:302`), and `elapsedTime()` ≈ 0ms inside the synchronous test loop (< the 400ms initial interval, `LeftWall.ts:133-147`), so the wall never moves under `tick()`; Test 42 drives the wall via `setPosition()` (main.ts:1636, 1640, 1666, 1695), which bypasses tick gating. A seeded `randomSource()` makes the whole run deterministic.

Impact: None for Test 42. The trap is for future tests that drive the wall through `tick()`: they also need a `currentTimeMillis()` override (or a `TestLeftWall` swap), or gating stays on `Date.now()`.

Recommendation: State both rules in the TASK-040 packet: `randomSource()` (and any future clock seam) is overridden by subclassing, never by constructor parameters; tests that depend on wall timing must override the clock seam too.

---

# Alternative Approaches

## ALT-040-1: RNG seam via optional constructor parameter instead of protected-method override

Description: `constructor(canvas, rng: () => number = Math.random)` with `spawnPiece` calling `this.rng()`.

Advantages: The seam is explicit at the call site; a `TestGame` subclass could be replaced by `new Game(canvas, seededLcg)`; some teams prefer not to model seams as production API.

Disadvantages: Widens the production constructor signature for a test-only concern (Constraint-002 adjacent); diverges from the project's established override-the-test-double pattern (DEV-027-1, DEV-028-1); the "TestGame extends Game" class then becomes an awkward hybrid (subclass for the clock, constructor param for the RNG).

When To Use: If a future iteration needs per-instance RNG streams in production (e.g., replays/seeds), the parameter seam becomes the right shape; until then keep the override.

## ALT-042-1: main.ts split first, cleanup bundle second (ordering challenge — recommendation: keep cleanup-first)

Description: Execute TASK-042 before TASK-040 so the split is a pure verbatim move of the current file.

Advantages: The split diff is provably behavior-preserving (pure move); the cleanup bundle then lands in small component files, making scope attribution per-file.

Disadvantages: The split diff (2,903 verbatim lines) carries unrelated test-identity changes (Test 70, TestGame, dead tolerance), muddying the bisect that TASK-039's commit discipline is meant to enable; the cleanup bundle is small and localized, so it does not benefit from being split-first.

When To Use: Only if the Plan Agent decides the split itself should be reviewed diff-by-diff against the pre-split file; then add a "split-only" commit boundary in the packet. My recommendation is cleanup-first (TASK-039 → 040 → 041 → 042), with TASK-041 independent of both.

---

# Assumption Review

## A-IT9-01: "All 22 top-level entries are untracked" (challenge brief)

Risk: **False as stated.** The 22 top-level entries are **staged** (`git status` → "No commits yet … Changes to be committed: new file: …"), and the index already holds 1,655 files incl. ~1,560 under `node_modules/`/`dist/`. The operational consequence is F-IT9-01: `.gitignore` alone will not fix the index.

Validation Method: `git ls-files | wc -l` (1655); `git ls-files | grep -c '^node_modules/\|^dist/'` (1560); `git status` (staged files); `git log` (zero commits).

## A-IT9-02: "`.gitignore` already covers node_modules/ and dist/" (50_birds_eye_review.md, Debt-BE-005 / Recommendation-BE-009)

Risk: **False.** `.gitignore` contains only `.DS_Store` (verified, 2 lines). The TASK-039 design correctly notices this; the next Bird's Eye Review should carry the correction forward.

Validation Method: `cat .gitignore`.

## A-IT9-03: "Test 42's random piece spawns cause the total count to vary (276↔279)" (00_project_state.md Workflow Knowledge) and "current 463 total is stable" (90_next_actions.md)

Risk: The first claim is a **stale historical observation** (pre-TASK-023 semantics); the second is consistent with my analysis (Test 42 is deterministic under current code — see F-IT9-02). If the Implement Agent "verifies" the old claim it will find it false and may mis-file it as a new bug.

Validation Method: Run `node dist/main.js` 3× and compare totals; trace the cycle-2 gate at main.ts:1665 (`if (game42.getState() === 'PLAYING')`) against the spawn-collision behavior pinned by Test 43 (main.ts:1710-1764).

## A-IT9-04: "70 section headers" (TASK-042 AC)

Risk: True today (70 `section(` calls in main.ts:1-2903), but becomes 71 after TASK-040 adds Test 70; the AC must reference the post-040 count or the pre-split baseline (see F-IT9-03).

Validation Method: `grep -c "^section(" src/main.ts` → 70.

---

# Verification Ledger (claims checked against the live repo)

| Claim | Verdict | Evidence |
|---|---|---|
| `src/main.ts` = 2,903 lines | TRUE | `wc -l src/main.ts` → 2903 |
| `npx tsc` 0 errors; `node dist/main.js` 463/463 | ACCEPTED (documented 2026-09-18; not re-run — I ran no builds to avoid polluting `dist/`/`dist/tests/` in a repo with no baseline) | 00_project_state.md |
| `git log` → zero commits | TRUE | `git log` → "does not have any commits yet" |
| `node_modules/` and `dist/` are NOT in `.gitignore` | TRUE | `.gitignore` = `.DS_Store` only |
| "All 22 top-level entries untracked" | FALSE (they are staged) | `git status` → "Changes to be committed"; `git ls-files` → 1,655 files |
| Test 42 dead tolerance at main.ts:1687-1690 | TRUE | `secondWallX === 0 \|\| secondWallX === Field.COLS - 2` at 1687-1690 |
| `pushBlocksRight` single-pass loop at CompressionSystem.ts:147-157 | TRUE | loop re-seeds `buildMovementSet(leftWallX)`; seed column vacated by `moveRight` → next set empty → break |
| `onLeftWallReset=null` → `resetLeftWall()` safe no-op | TRUE | CompressionSystem.ts:265-269; null default at :32 |
| `compress()` 3-case structure at CompressionSystem.ts:74-105 | TRUE | movement→reset/true; full→restore/false; no-movement→finalize+reset/true |
| RightWall JSDoc misindent at RightWall.ts:61-64 | TRUE | `@param` block over-indented vs surrounding ` *` |
| `Math.random()` at Game.ts:410 | TRUE | `const type = Math.floor(Math.random() * 7);` (spawnPiece 399-433) |
| `currentTimeMillis()` override pattern | TRUE | Game.ts:163-165; main.ts:43-45 (TestLeftWall), 2271-2279 (TestEffectSystem) |
| 70 `section(` calls in main.ts | TRUE | 70 matches (71st grep hit is the `function section` definition at :28) |
| `package.json` build/postbuild scripts | TRUE | `build: tsc`; `postbuild: cp + sed` (sed is GNU `-i`; env is Linux) |
| `tsconfig.json` needs no change for `src/tests/` | TRUE | `rootDir: ./src`, `outDir: ./dist`, `include: src/**/*`, `module: ES2020` |
| README 205-209 stale ("typically 280 and may vary") | TRUE | verified verbatim; the variance note is obsolete for the **right reason** (Test 42 is deterministic today, F-IT9-02) |
| README 249-267 structure tree omits `src/tests/` | TRUE | will need a TASK-042 doc-sync AC |
| CI runs `npm run build` | TRUE | `.github/workflows/deploy.yml` → Pages deploy depends on the postbuild chain (F-IT9-05) |
| `opencode.json` contains internal infra detail | TRUE | internal LLM provider URLs (`http://192.168.0.10:11434/v1`) — decide commit vs. ignore in TASK-039; `.devcontainer/`/`.github/` are shareable infra, fine to commit |

---

# Answers to the Calling Agent's Questions

1. **Split design (TASK-042):** (a) "mocks first, then components" is robust — ESM evaluates imported modules before the importing module body, in import order; the RAF override is a module-scope side effect of `mocks.ts`, so it precedes every test body (F-IT9-07). (b) Safe, as above. (c) No missed cross-section shared variables; the complete cross-file shared surface is exactly `harness.ts` (counters, assert, section, printSummary) + `mocks.ts` (TestLeftWall, MockCanvas, MockRenderContext, MockRenderCanvas, MockGameCanvas, RAF overrides, gameTick/gameTicks); write the import rule into the packet. (d) The AC set is nearly sufficient; fix the "70 sections" count (→71 after 040) and add the count-identity baseline step (F-IT9-03). (e) `field.test.ts` should be merged into `activePiece.test.ts` (F-IT9-06).
2. **RNG injection:** TestGame override fits the established pattern (F-IT9-08); the design's nondeterminism premise is wrong (F-IT9-02); re-scope as hardening. No residual nondeterminism in Test 42 (spawn collision is universal; tick gating is inert because elapsed≈0).
3. **Test 70 pin:** (a) works as described but duplicates Test 68; (b) works as described (`resetLeftWall()` with null callback is a no-op; second `compress(14)` returns **true** with an unchanged field) and is genuinely non-overlapping with Test 68.
4. **Dist check:** postbuild wiring is sound; `npx tsc && node dist/main.js`, `npm run clean && …`, and the Vite flows are unaffected; add the `dist/entry.js` existence check; resolve paths from the script's URL; note the CI deploy blast radius.
5. **Task ordering:** cleanup (040) before split (042) is the right call — the split becomes a pure verbatim move, and the split diff stays reviewable as a move; 041 is independent (ALT-042-1).
6. **Git baseline:** the index already contains node_modules/dist (F-IT9-01) — fix before committing; `.gitignore` gap confirmed (A-IT9-02); decide `opencode.json` commit-vs-ignore; `.devcontainer/`/`.github/` are fine to commit; `package-lock.json` must be committed (CI runs `npm ci`).
7. **General:** no scope creep vs. Recommendation-BE-009/010; the CR-IT8-001 comment + Test 70 pin correctly pre-empts Risk-BE-008; the main ambiguity risks for the Implement Agent are F-IT9-01, F-IT9-02, F-IT9-03, F-IT9-07.

---

# Recommended Task-Packet Corrections (advisory — the Plan Agent decides)

1. **TASK-039:** add the index-clear step (`git rm -r --cached node_modules dist` or `git reset`) and the `git ls-files` count checks before the initial commit; decide `opencode.json` (internal provider URLs) commit-vs-ignore; require `package-lock.json` in the baseline commit.
2. **TASK-040:** re-scope LIM-021-2 as determinism hardening (seeded `randomSource()` override; `TestGame` subclass mirroring TestLeftWall/TestEffectSystem); state that the assertion total will NOT change; require a pre-split suite run captured as the TASK-042 baseline; state Test 70(b)'s expected return value (true).
3. **TASK-041:** add the `dist/entry.js` existence check; cwd-independent path resolution; note the CI deploy blast radius in the ACs.
4. **TASK-042:** fix the "70 sections" AC (71 after 040); add the count-identity baseline step; merge Test 6 into `activePiece.test.ts`; write the import rule (test files import only harness/mocks; RAF override lives in `mocks.ts`) into the packet.
