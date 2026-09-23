# TASK-030: BUG A — Fix Piece at Contact + onPieceFixed Callback + Fall-Through Push

## Objective

When the left wall contacts the active piece, fix the piece to the field
immediately (make it a non-operable field block at its current position), null
both the `LeftWall` and `Game` references, then fall through to push the wall
column (which now includes the just-fixed cells) the same tick.

## Business Context

The spec (`game-design.md:62-67`) states the instant the left wall contacts the
active piece it "操作対象ではなくなる / フィールド上的ブロックとして扱う"
(becomes non-operable / a field block). The current implementation
(`LeftWall.onWallAdvanced`, `LeftWall.ts:189-216`) instead **pushes** the piece
rigidly (`activePiece.move(1,0)` at line 204) until it can no longer move, then
fixes it, and an early `return` (line 211) skips pushing the fixed blocks in the
wall's own column that tick. This iteration corrects both.

## Scope

### Files to Modify

1. **`src/LeftWall.ts`**
   - `onWallAdvanced()` (lines 189-216): replace the `canPush ? move : moveToFixed`
     branch + early return with: fix at contact → callback → null ref → fall
     through to `advanceOccupiedBlocksInColumn(this.x)`.
   - Add a new private field `onPieceFixed: (() => void) | null` (default `null`).
   - Add public setter `setOnPieceFixed(cb: () => void): void`.

2. **`src/Game.ts`**
   - After `LeftWall` construction (near line 64 / in the setup path), register
     the callback: `this.leftWall.setOnPieceFixed(() => { this.activePiece = null; })`.
     Place it where the `LeftWall` is fully constructed and available.

### Files NOT Modified

- `ActivePiece.ts`, `RightWall.ts`, `CompressionSystem.ts`, `Field.ts`,
  `Renderer.ts`, `InputManager.ts`, `main.ts` (tests are TASK-033/034).

## Implementation

### Current `onWallAdvanced()` (LeftWall.ts:189-216)

```ts
private onWallAdvanced(): ChainPushResult {
  if (this.activePiece && this.activePiece.isWallHit(this.x)) {
    const pieceCells = this.activePiece.getOccupiedCells();
    const canPush = pieceCells.every((cell) => {
      const targetX = cell.x + 1;
      return this.field.isValidPosition(targetX, cell.y) && !this.field.get(targetX, cell.y);
    });
    if (canPush) {
      this.activePiece.move(1, 0);
    } else {
      this.activePiece.moveToFixed();
    }
    return { pushedCells: [], connectedCells: [] };   // <- early return skips wall-column push
  }
  return this.advanceOccupiedBlocksInColumn(this.x);
}
```

### New `onWallAdvanced()`

```ts
private onWallAdvanced(): ChainPushResult {
  // 1. Contact with the active piece -> fix it at its current position.
  if (this.activePiece && this.activePiece.isWallHit(this.x)) {
    this.activePiece.moveToFixed();      // writes piece cells to the field, clears piece to (-100,-100)
    this.activePiece = null;             // LeftWall drops its reference
    if (this.onPieceFixed) this.onPieceFixed();   // Game nulls Game.activePiece
  }
  // 2. Push the wall column (BFS chain push). At contact the leftmost piece
  //    cells sit exactly at this.x, so they are pushed this same tick.
  return this.advanceOccupiedBlocksInColumn(this.x);
}
```

### Callback field + setter

```ts
// in class LeftWall, near the other private fields:
private onPieceFixed: (() => void) | null = null;

setOnPieceFixed(cb: () => void): void {
  this.onPieceFixed = cb;
}
```

### Game wiring

In `Game`, once `this.leftWall` exists, register:

```ts
this.leftWall.setOnPieceFixed(() => {
  this.activePiece = null;
});
```

## Constraints

- The `onPieceFixed` call must be null-safe (`if (this.onPieceFixed)`). Existing
  tests construct `LeftWall` without a callback and must keep passing.
- `moveToFixed()` must run **before** the fall-through so the just-fixed cells
  are present in the field when `advanceOccupiedBlocksInColumn` seeds the wall
  column.
- Do NOT change `advanceOccupiedBlocksInColumn` — it already does the correct
  BFS chain push (TASK-026). Only the call routing changes.
- `Game.activePiece` MUST be nulled at contact (Decision-030-2): otherwise the
  `updateCompressing` safety-net (`Game.ts:321-324`) re-runs `moveToFixed` on the
  cleared piece, writing to negative x indices via `Field.set` (no x-wrap).
- No external libraries (Constraint-001).
- TypeScript ES modules with `.js` import extensions.

## Acceptance Criteria

- [ ] When the wall contacts the active piece (`isWallHit` true), `onWallAdvanced`
      calls `moveToFixed()` and does NOT call `move(1,0)`.
- [ ] After contact, `LeftWall.activePiece` is `null` and `Game.activePiece` is `null`.
- [ ] After contact, `onWallAdvanced` returns the result of
      `advanceOccupiedBlocksInColumn(this.x)` (the just-fixed cells are pushed
      the same tick).
- [ ] The early `return { pushedCells: [], connectedCells: [] }` and the `canPush`
      branch are removed.
- [ ] `setOnPieceFixed` is null-safe; constructing a `LeftWall` without a callback
      and calling `advance()` still works (no throw).
- [ ] No double-`moveToFixed`: after a contact-fix, `updateCompressing` does not
      re-fix the piece (Game.activePiece is already null).
- [ ] `npx tsc` produces 0 errors.

## Deliverables

- Updated `src/LeftWall.ts`
- Updated `src/Game.ts`

## Risks

- **F5 stranding (atomic-abort case)**: if the piece is fixed against a wall of
  pre-existing blocks, `advanceOccupiedBlocksInColumn` aborts atomically and the
  just-fixed cells sit behind the wall until the next cycle. Pre-existing and
  spec-consistent; documented as a known limitation (not fixed here).
- **F7**: returning the chain-push result on fixation means push/connection
  effects now fire on piece fixation (new, intended). Existing effect tests are
  unaffected (they null `activePiece` first).

## Edge Cases

1. **Piece with no cell in the wall column at contact** — cannot happen: contact
   fires at the first tick where `minCellX == wallX`, so at least the leftmost
   cell is at `this.x`.
2. **No active piece** — `this.activePiece` is null; the guard is skipped and the
   method directly returns the wall-column push (unchanged behavior).
3. **Chain push aborts** (atomic) — the just-fixed cells stay in the wall column;
   the wall advances past them next tick. Spec-consistent (F5).
