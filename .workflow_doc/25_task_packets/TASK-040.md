# Task Packet

TASK-ID: TASK-040
Title: Low Cleanup Bundle + Determinism Hardening
Priority: High
Dependencies: TASK-039

---

# Objective

Clean up accumulated Low-severity code review findings and add the RNG seam for test determinism hardening:

1. Remove the dead tolerance in Test 42 (CR-IT5-001).
2. Add a clarifying comment to `pushBlocksRight` (CR-IT8-001) and pin the "one column per `compress()` call at threshold 1" invariant in Test 70.
3. Fix JSDoc indentation in `RightWall.shiftVertical` (CR-IT8-002).
4. Add `protected randomSource(): number` to `Game` and a `TestGame` subclass with a seeded LCG override (LIM-021-2, re-scoped as determinism hardening).
5. Update the README test-count note (remove the stale variance claim).

---

# Business Context

These are accumulated Low-severity findings from Iterations 3, 5, and 8 Code Reviews. None are bugs — they are maintainability and documentation gaps. The RNG seam is future-proofing: Test 42 is already deterministic under current code (Challenge F-IT9-02), but any future change to piece shapes or spawn positions could silently reintroduce nondeterminism. The seam makes the test sequence reproducible and pins the intent.

---

# Scope

## In Scope

### Target

- `src/main.ts` — Test 42 dead tolerance removal, `TestGame` class addition, Test 70 addition.
- `src/CompressionSystem.ts` — clarifying comment on `pushBlocksRight`.
- `src/RightWall.ts` — JSDoc indentation fix.
- `src/Game.ts` — `protected randomSource(): number` seam.
- `README.md` — test-count note update (lines 205-209).

## Out of Scope

- Changing `pushBlocksRight` loop semantics (comment only; Risk-BE-008).
- Changing any game logic behavior.
- Changing the compression threshold or post-compression wall reset.
- The `src/tests/` split (that is TASK-042).
- The dist check script (that is TASK-041).

---

# Constraints

## DEC-040-1: RNG seam via protected method override

Priority: Required

Description:

Add to `Game`:

```ts
/** Returns a pseudo-random value in [0, 1). Overridable for deterministic testing. */
protected randomSource(): number {
  return Math.random();
}
```

Replace the direct `Math.random()` call in `spawnPiece` (currently `Game.ts:410`, `const type = Math.floor(Math.random() * 7)`) with `this.randomSource()`.

In `src/main.ts`, add a `TestGame` class:

```ts
class TestGame extends Game {
  private _seed: number;
  constructor(canvas: MockGameCanvas, seed = 12345) {
    super(canvas);
    this._seed = seed;
  }
  protected randomSource(): number {
    // Deterministic LCG (Numerical Recipes constants)
    this._seed = (this._seed * 1103515245 + 12345) & 0x7fffffff;
    return this._seed / 0x7fffffff;
  }
}
```

Rationale: Matches the established override-the-test-double pattern (`TestLeftWall.currentTimeMillis()`, `TestEffectSystem.currentTimeMillis()`). A constructor parameter would widen the production API for a test-only concern.

## DEC-040-2: Test 70 scope (F-IT9-04)

Priority: Required

Description:

Test 70 has two sub-scenarios:

**(a) Single-step compression pin (1 column moved):**
- Set up a field with blocks at (11,4), (12,4), (13,4), (14,4).
- Set the left wall at x=14.
- Call `compress(14)`.
- Assert: block at (14,4) moved to (15,4); blocks at (11,4), (12,4), (13,4) unchanged; total count = 4.
- This pins the "one column moved per `compress()` call at threshold 1" invariant that the CR-IT8-001 comment describes.

**(b) Cross-call idempotency (second `compress()` is a safe no-op):**
- Continue from (a)'s final state (blocks at 11, 12, 13, 15; wall at x=14 after reset... wait, the wall resets to x=0 after a successful compress).
- Actually: after `compress(14)` in (a) succeeds, `resetLeftWall()` is called (wall resets to x=0) and a new piece spawns. For (b), set up a FRESH scenario:
  - Create a field with a block at (14,4) only.
  - Set `onLeftWallReset = null` (so the reset is a no-op).
  - Set the left wall at x=14.
  - Call `compress(14)` → movement path: block moves 14→15, returns true.
  - Call `compress(14)` again (wall is still at x=14 since `onLeftWallReset = null` means the reset didn't move it back to x=0... wait, I need to check this).

Actually, let me re-read the Challenge F-IT9-04 description more carefully:

"(b) verified true: a second `compress(14)` call takes the no-movement path: `shouldCompress(14)` true → empty movement set → no movement → field not full → `resetLeftWall()` → return true (`CompressionSystem.ts:74-105`). With `onLeftWallReset = null`, `resetLeftWall()` is a safe no-op (`CompressionSystem.ts:265-269`), so the field is unchanged and the return is **true**."

So the scenario is:
- Set up a field where the movement set is empty at the wall column (no blocks at x=14).
- `compress(14)` → `shouldCompress(14)` true → `buildMovementSet(14)` empty → no movement → field not full → `resetLeftWall()` (no-op with null callback) → return true.

Wait, that's just the no-movement path, not a "second call." Let me re-read...

The Challenge says "a second `compress(14)` call takes the no-movement path." So the scenario is:
1. First `compress(14)`: there IS a block at x=14, it moves to x=15, wall resets.
2. Second `compress(14)`: wall is back at x=14 (or still at x=14 if onLeftWallReset is null), but now the block is at x=15, so `buildMovementSet(14)` is empty → no-movement path → return true.

Actually, I think the key insight from the Challenge is:
- With `onLeftWallReset = null`, the wall does NOT reset after the first compress.
- So the second `compress(14)` is called with the wall still at x=14, but the block has already moved to x=15.
- `buildMovementSet(14)` finds no blocks at x=14 → empty movement set → no-movement path → `resetLeftWall()` (no-op) → return true.
- Field is unchanged (block stays at x=15).

This pins that calling `compress()` when there's nothing to move is a safe no-op (doesn't corrupt state, doesn't lose blocks, returns true).

Let me write the test scenario more precisely:

**(b) No-movement path idempotency:**
- Create a CompressionSystem with a field containing a single block at (15,4).
- Set `onLeftWallReset = null`.
- Call `compress(14)`.
- Assert: `compress(14)` returns `true`.
- Assert: block is still at (15,4) (unchanged).
- Assert: total block count is still 1.

This is the genuinely new pin: it proves that `compress()` at a wall position with no blocks at the wall column is a safe no-op.

Rationale: F-IT9-04 verified both scenarios work as described. (a) is a focused invariant pin paired with the CR-IT8-001 comment. (b) pins the no-movement path's safety (no state corruption, correct return value).

## DEC-040-3: LIM-021-2 re-scoped as determinism hardening

Priority: Required

Description:

The original premise ("Test 42's random piece spawns cause variable assertion count") is false for current code (F-IT9-02). The task is re-scoped: add the `randomSource()` seam + `TestGame` override so that any future change cannot silently reintroduce nondeterminism.

**The assertion total will NOT change.** The AC is "same total before and after," captured at execution time.

Rationale: The seam is future-proofing. Test 42 is already deterministic (universal spawn collision). The seam ensures reproducibility if piece shapes or spawn logic change.

## DEC-040-4: Do NOT change `pushBlocksRight` loop semantics

Priority: Required

Description: Add ONLY a comment. Do not refactor, simplify, or "clean up" the loop.

Rationale: Risk-BE-008 — the loop's single-pass behavior is correct for the current game flow. Any change to the loop requires updating `compress-mechanism.md` first.

---

# Implementation Notes

### CR-IT5-001: Remove Test 42 dead tolerance

- Location: `src/main.ts`, Test 42, around lines 1687-1690.
- The assertion `secondWallX === 0 || secondWallX === Field.COLS - 2` has a dead OR branch. Under current code, `secondWallX` is always `0` (the wall resets to x=0 after a successful compress). The `=== Field.COLS - 2` branch is unreachable.
- Action: Remove the `|| secondWallX === Field.COLS - 2` part. Keep `secondWallX === 0`.
- Note: This is a test-only change. It does not affect the assertion count (removing a dead OR branch from an existing assertion does not change the count).

### CR-IT8-001: Clarifying comment on `pushBlocksRight`

- Location: `src/CompressionSystem.ts`, the `pushBlocksRight` method (around lines 147-157).
- Add a comment explaining WHY the loop is effectively single-pass:

```ts
/**
 * Pushes the movement target one column right.
 *
 * The loop is effectively single-pass: after one iteration, the seed column
 * (leftWallX) is vacated by moveRight(), so the next buildMovementSet(leftWallX)
 * returns an empty set and the loop breaks. The loop structure is preserved
 * for clarity and to guard against future changes to moveRight() that might
 * leave the seed column occupied. Do not simplify without updating
 * compress-mechanism.md (Risk-BE-008).
 */
```

- Do NOT change the loop code. Comment only.

### CR-IT8-002: Fix JSDoc indentation in `RightWall.shiftVertical`

- Location: `src/RightWall.ts`, the `shiftVertical` method JSDoc (around lines 61-64).
- The `@param` block is over-indented relative to the surrounding ` *` comment lines.
- Action: Normalize the indentation so all `@param` lines align with the ` *` prefix.

### Test 70: Add new test section

- Location: `src/main.ts`, after Test 69 (at the end of the test sections, before the summary).
- Add a new `section('Test 70: compress() one-column invariant and no-movement idempotency')`.
- Implement sub-scenarios (a) and (b) as described in DEC-040-2.
- Expected assertion count: approximately 8-10 assertions (4 for (a), 4 for (b), plus setup assertions).

### LIM-021-2: Add `randomSource()` seam + `TestGame`

- Location: `src/Game.ts` — add the `protected randomSource()` method; replace `Math.random()` at line 410.
- Location: `src/main.ts` — add the `TestGame` class (near the other test classes, e.g., after `TestLeftWall`).
- **Important**: Do NOT change any existing test to use `TestGame`. The seam is added for future use. Test 42 continues to use the regular `Game` class (which now calls `this.randomSource()` → `Math.random()` in production, but in the test harness the piece kind is determined by the same collision logic regardless of the random value).
- Actually, wait: if Test 42 uses `new Game(canvas)` (not `TestGame`), then `randomSource()` calls `Math.random()` in the test too. The determinism comes from the universal collision (the random value is computed but the collision happens regardless). So the seam is dormant for Test 42.
- To actually exercise the seam, we could change Test 42 to use `TestGame` instead of `Game`. But that would be a behavior change (different random sequence). Since the collision is universal, the result is the same. Let me think about this...
- Actually, the cleanest approach: Test 42 continues to use `Game` (not `TestGame`). The `randomSource()` seam is added to `Game` and `TestGame` is available for future tests. The AC is "same total before and after" — which is trivially satisfied since we're not changing which class Test 42 uses.
- If we want to actually verify the seam works, we can add a small assertion in Test 70 (or a new sub-section) that creates a `TestGame` and verifies `randomSource()` produces a deterministic sequence. But that's testing the LCG, not the game logic. Keep it simple: add the seam, don't change existing tests.

### README update

- Location: `README.md`, lines 205-209.
- Current text:
  ```
  Tests are embedded in `src/main.ts` using an assert-based harness.
  All tests must pass. The total assertion count is currently typically
  280 and may vary slightly between runs because Test 42 contains
  path-dependent conditional assertions driven by the random piece spawns —
  the summary's `Failed: 0` line is the pass criterion.
  ```
- New text:
  ```
  Tests are embedded in `src/main.ts` (and `src/tests/`) using an assert-based
  harness. All tests must pass. The total assertion count is deterministic
  (currently 463 + Test 70 assertions). The summary's `Failed: 0` line is
  the pass criterion.
  ```
- Note: The exact count will be 463 + (Test 70 assertions). The Implement Agent should compute the actual post-change count and use that in the README.

### Baseline capture (for TASK-042 count-identity)

- BEFORE making any changes in this task, run `npx tsc && node dist/main.js` and record:
  - The total assertion count.
  - The set of section headers (number of `section(` calls).
- This baseline is used by TASK-042 to verify count-identity after the split.
- Record the baseline in the implement report (`30_implement.md`).

---

# Acceptance Criteria

- [ ] `npx tsc --noEmit` exits with status 0.
- [ ] `node dist/main.js` reports `Failed: 0`.
- [ ] The total assertion count is identical to the pre-change baseline captured at the start of this task (run ≥2× before and after; the count must be stable).
- [ ] Test 42 no longer contains the `|| secondWallX === Field.COLS - 2` dead branch.
- [ ] `CompressionSystem.pushBlocksRight` has a JSDoc comment explaining the single-pass behavior. The loop code is unchanged.
- [ ] `RightWall.shiftVertical` JSDoc `@param` lines are properly indented.
- [ ] Test 70 exists with both sub-scenarios (a) and (b). (a) pins the one-column invariant. (b) pins the no-movement path idempotency (returns true, field unchanged).
- [ ] `Game` has a `protected randomSource(): number` method. `Game.ts:410` (or equivalent) uses `this.randomSource()` instead of `Math.random()` directly.
- [ ] `TestGame` class exists in `src/main.ts` (or `src/tests/mocks.ts` if the split has already happened — it has not; this is before TASK-042) with a seeded LCG override of `randomSource()`.
- [ ] README lines 205-209 no longer contain the "may vary slightly between runs" text.
- [ ] `npm run build` succeeds.

---

# Deliverables

- Updated `src/main.ts` (dead tolerance removed, Test 70 added, `TestGame` added).
- Updated `src/CompressionSystem.ts` (comment only).
- Updated `src/RightWall.ts` (JSDoc fix).
- Updated `src/Game.ts` (`randomSource` seam).
- Updated `README.md` (test note).
- Verification output from `npx tsc --noEmit && node dist/main.js` (pre-change and post-change counts).

---

# References

- `.workflow_doc/20_challenge.md` — F-IT9-02 (re-scope), F-IT9-04 (Test 70 scope), F-IT9-08 (TestGame pattern).
- `.workflow_doc/40_code_review.md` — CR-IT5-001, CR-IT8-001, CR-IT8-002.
- `src/CompressionSystem.ts` — `pushBlocksRight` method (lines 147-157).
- `src/RightWall.ts` — `shiftVertical` JSDoc (lines 61-64).
- `src/Game.ts` — `spawnPiece` method (line 410, `Math.random()` call).
- `compress-mechanism.md` — the compression spec (reference only; do not modify).

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
