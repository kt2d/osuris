# TASK-034: New Coverage — Constrained Rotation + Shape Scramble + Direction

## Objective

Add test coverage for the two behaviors introduced/changed by this iteration
that currently have **zero** tests: (a) the wall-aware rotation constraint
(Challenge F8) and (b) the piece-shape scramble caused by fixing the piece at
contact and pushing its cells individually (Challenge F4). Also pin the
corrected `WALL_UP/DOWN` screen direction at the `Game` level.

## Business Context

The rotation constraint (TASK-031) and the fix-at-contact scramble (TASK-030)
are new, spec-faithful behaviors with no existing tests. Without tests they are
unpinned and can regress silently. The shape scramble in particular is a large,
deliberate behavioral change (Decision-030-3) that must be documented in the
suite so its exact resting shape is a contract, not an accident.

## Scope

### Files to Modify

- **`src/main.ts`** — add new test sections (numbering continues after the
  current highest test). Use the existing `section(...)` / `assert(...)` /
  `TestLeftWall` harness.

### Files NOT Modified

- All source modules under test (this task adds tests only; it does not change
  production code).

## Implementation

### Constrained-rotation tests (TASK-031)

Add a test section that exercises `ActivePiece.rotate(minAllowedX)` /
`wouldRotateCollide(minAllowedX)` directly, and the `Game` path:

1. **Blocked at/behind wall**: construct a piece whose next rotation places a
   cell at `x < minAllowedX`. Example: I-piece (type 0) at origin `x=4`, rot 0
   (cells `(4,y)(5,y)(6,y)(7,y)` on a row). Rotating to vertical yields cells
   with x-offsets that can go negative. Pick a `minAllowedX` such that a
   rotated cell lands at `x < minAllowedX`; assert `rotate(minAllowedX)` returns
   `false` and `rotation` is unchanged.
2. **Allowed when clear**: same piece with a smaller `minAllowedX` (or wall
   far left) so no rotated cell is below the bound → `rotate(minAllowedX)`
   returns `true` and `rotation` advances.
3. **I-piece rot-180 negative-offset case**: specifically pin the I-piece
   vertical orientation that produces negative x-offsets (the exact stranding
   scenario the constraint prevents).
4. **Default (no arg) unchanged**: `rotate()` with no argument on the same
   pieces behaves as before (unrestricted) — guards backward compatibility.

Use `ActivePiece` directly (not `Game`) for 1-4 to keep them deterministic and
independent of `Game` state.

### Shape-scramble test (TASK-030 / Decision-030-3)

Pin the exact resting shape produced by fix-at-contact + block-by-block push.
Use the T-piece example from Challenge §1.3:

- T-piece (type 2) at origin `x=6`, rot 0, cells `(6,4)(7,4)(8,4)(7,5)`.
- Wall reaches `x=6` (contact). After `moveToFixed` + fall-through
  `advanceOccupiedBlocksInColumn(6)`:
  - Seed col 6 → `(6,4)`. BFS right collects `(7,4)(8,4)` (row 4) but NOT
    `(7,5)` (row 5, no right neighbor).
  - Move set `{(6,4)(7,4)(8,4)}` → pushed to `(7,4)(8,4)(9,4)`.
  - `(7,5)` is NOT in the move set, so it stays at `(7,5)`.
  - **Resting field: `(7,4)(8,4)(9,4)(7,5)`** (4 blocks).
- Assert those four cells exactly and `countBlocks() === 4`. This pins that the
  piece "disintegrates into individually-pushed blocks" — the `(7,5)` arm does
  **not** move with the row-4 chain. (The old rigid-push behavior would have
  produced `(7,4)(8,4)(9,4)(8,5)`; assert that `(8,5)` is NOT occupied.)

### Game-level direction test (TASK-032)

Test 34 (TASK-033) already covers `ArrowUp → y-1` / `ArrowDown → y+1` through
the real `Game.processInput` path. This task adds a **complementary** assertion
only if a wrap-boundary case is not covered by Test 34 (e.g. `ArrowUp` from
`y=0` wrapping to `y=7`). Otherwise no extra test is needed — do not duplicate
Test 34.

## Constraints

- New tests must be deterministic (use `TestLeftWall` / direct `ActivePiece`;
  override time where wall advancement is involved, per the existing harness).
- Do not modify existing tests (those are TASK-033's scope).
- Add assertions; keep `Failed: 0` for the whole suite.
- No external libraries (Constraint-001).

## Acceptance Criteria

- [ ] A rotation that places a cell at `x < minAllowedX` is blocked (returns
      `false`, rotation unchanged).
- [ ] The same rotation is allowed when `minAllowedX` is small enough.
- [ ] The I-piece rot-180 negative-offset case is explicitly tested.
- [ ] `rotate()` with no argument is unchanged (backward-compatible).
- [ ] The T-piece scramble test asserts the exact resting shape
      `(7,4)(8,4)(9,4)(7,5)` and that `(8,5)` is NOT occupied.
- [ ] Full suite passes: `npx tsc && node dist/main.js` → `Failed: 0`.

## Deliverables

- Updated `src/main.ts` (new test sections)

## Edge Cases

1. **`minAllowedX` equal to a rotated cell's x** (`x == minAllowedX`): allowed
   (strict `<`). A cell at `x == minAllowedX - 1` is blocked.
2. **Scramble with a blocked chain (atomic abort)**: if the row-4 chain cannot
   move, the just-fixed cells stay put. This is the F5 limitation; do not assert
   a specific scramble shape in that case (test the free-move path only).
