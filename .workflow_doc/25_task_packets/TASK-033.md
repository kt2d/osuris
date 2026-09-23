# TASK-033: Rewrite Gating Tests (Test 5, Test 5b/5c, Test 34)

## Objective

Rewrite the tests that currently **encode the buggy behavior** so they encode
the corrected behavior. These are the gating failures the Challenge Agent
identified (F1, F2, F3) plus the Test 5c sub-block the challenge missed.

## Business Context

The test suite currently asserts the buggy push/fix and inverted-direction
behavior. Deploying the fixes (TASK-030, TASK-032) without rewriting these makes
the suite fail. Rewriting pins the corrected, spec-faithful behavior.

## Scope

### Files to Modify

- **`src/main.ts`** — three test regions:
  1. **Test 5** (`main.ts:287-370`): the `wall6` contact block (lines 315-323)
     and the `field7` "full scenario" (lines 333-359).
  2. **Test 5b / 5c** (`main.ts:371-426`): the `field6b` blocked case
     (lines 397-415) and the `field6c` "free push" case (lines 417-426).
  3. **Test 34** (`main.ts:1350-1369`): the `ArrowUp`/`ArrowDown` assertions.

### Files NOT Modified

- Test 9 / Test 10 (direct `shiftVertical` unit tests) — unaffected.
- Test 35+ and all other tests.

## Implementation

### Corrected expectations (from Challenge §7 + Plan correction)

**Test 5 — after `wall6.setPosition(4); wall6.advance();`** (wall x=4→5, contact):
- `piece6.getX() === -100` and `piece6.getY() === -100` (piece fixed, not
  pushed to x=6).
- `wall6.getX() === 5`.
- Field holds the chain-pushed I-piece cells: `field6.get(6,4)===true`,
  `field6.get(7,4)===true`, `field6.get(8,4)===true`, `field6.get(9,4)===true`,
  and `field6.countBlocks() === 4`.
- `piece6.isWallHit(5) === false` (piece cleared).
- The `field7` block: `wall7.setPosition(4); wall7.advance();` now **fixes and
  pushes** the piece (no manual `piece7.moveToFixed()` needed). Assert
  `piece7.getX() === -100`, `field7.countBlocks() === 4`, and the four cells at
  `(6,4)(7,4)(8,4)(9,4)`. Remove/replace the now-redundant manual `moveToFixed`
  call (a manual call on a cleared piece writes to negative x indices and is a
  no-op on counted cells, but it is misleading).

**Test 5b — after `wall6b.advance();`** (O piece at (5,4), blocker at (7,4)):
- `piece6b.getX() === -100`, `piece6b.getY() === -100` (fixed in place).
- The fall-through chain push drags the blocker at `(7,4)` to `(8,4)`:
  `field6b.get(8,4) === true` (replace the old "original blocker at (7,4) still
  present" assertion).
- Fixed piece cells after push: `(6,4)(6,5)(7,4)(7,5)`. `field6b.countBlocks()
  === 5` (1 blocker + 4 piece cells — count unchanged, but `(7,4)` is now a
  piece cell, and the blocker is at `(8,4)`).

**Test 5c — after `wall6c.advance();`** (I piece at (5,4), no blockers):
- `piece6c.getX() === -100` (was `=== 6`). The piece is fixed, not pushed.
- `field6c.countBlocks() === 4` (was `=== 0`). The chain push leaves the four
  cells at `(6,4)(7,4)(8,4)(9,4)`.
- Remove the "free push still works: piece moved to x=6" framing — under the
  fix there is no "push the piece" case; contact always fixes.

**Test 34 — swap the direction:**
- Line 1361: `assert(rw4.getY() === (initialY - 1 + Field.ROWS) % Field.ROWS,
  'Right wall shifts UP (smaller y) by ArrowUp');`
- Line 1367: `assert(rw4.getY() === (yAfterUp + 1) % Field.ROWS, 'Right wall
  shifts DOWN (larger y) by ArrowDown');`

## Constraints

- Rewrite assertions only; keep the same test setup (fields, pieces, walls,
  `gameTick()` dispatch for Test 34).
- Preserve the total assertion count intent (do not silently delete coverage —
  replace each buggy assertion with a corrected one of equivalent specificity).
- Test 34 must keep using `dispatchKey('ArrowUp'/'ArrowDown')` + `gameTick()`
  so it exercises the real `Game.processInput` path.
- No external libraries (Constraint-001).

## Acceptance Criteria

- [ ] Test 5 asserts fix-at-contact (`piece6.getX()===-100`) and the field holds
      `(6,4)(7,4)(8,4)(9,4)`; no assertion expects `getX()===6` at contact.
- [ ] Test 5b asserts the blocker moved to `(8,4)` and `countBlocks()===5`.
- [ ] Test 5c asserts `piece6c.getX()===-100` and `field6c.countBlocks()===4`
      (no `===6` / `===0` assertions remain).
- [ ] Test 34 asserts `ArrowUp → (y-1+ROWS)%ROWS` and `ArrowDown → (y+1)%ROWS`.
- [ ] Test 9 / Test 10 are unchanged and still pass.
- [ ] Full suite passes: `npx tsc && node dist/main.js` → `Failed: 0`.

## Deliverables

- Updated `src/main.ts` (Test 5, Test 5b/5c, Test 34)

## Edge Cases

1. **Manual `moveToFixed` on a cleared piece**: if the old line 340 is left in,
   it writes to negative x indices (`Field.set` has no x-wrap) — a sparse
   artifact not counted by `countBlocks`. Remove it to avoid the smell.
2. **Test 34 wrap**: use `(y - 1 + ROWS) % ROWS` for the up case so `y=0` wraps
   correctly to `ROWS-1`.
