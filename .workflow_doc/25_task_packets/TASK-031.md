# TASK-031: Rotation Constraint (minAllowedX)

## Objective

Block a rotation that would place any cell of the active piece at/behind the
left wall (`cell.x <= wallX`), preventing cells from being stranded behind the
wall when a piece is fixed. With no argument the bound is unrestricted, so all
existing no-arg rotation callers and tests keep passing.

## Business Context

`ActivePiece.rotate()` currently only checks field collision, not the wall. A
rotation can place a cell at `x <= wallX`; once that piece is fixed at contact
(TASK-030) those cells sit behind the wall. Example: an I-piece at origin
`x=6` rotating to a vertical orientation whose cells reach `x=3,4,5` — if the
wall is at `x=5`, those cells are behind it. The spec-consistent fix is to
forbid such rotations while the wall is at/behind the target column.

## Scope

### Files to Modify

1. **`src/ActivePiece.ts`**
   - `wouldRotateCollide()` (line 223): add parameter
     `minAllowedX: number = -Infinity`. After computing `rotatedCells`, return
     `true` (blocked) if any `rotatedCell.x < minAllowedX`.
   - `rotate()` (line 239): add parameter `minAllowedX: number = -Infinity`,
     pass it through to `wouldRotateCollide`.

2. **`src/Game.ts`**
   - `processInput()` (line ~359): change `this.activePiece.rotate()` to
     `this.activePiece.rotate(this.leftWall.getX() + 1)`.

### Files NOT Modified

- All other modules. `main.ts` (tests are TASK-034).

## Implementation

### Current

```ts
wouldRotateCollide(): boolean {
  const nextRotation = (this.rotation + 1) % 4;
  const base = ActivePiece.getBaseShape(this.type);
  const rotated = ActivePiece.rotateShape(base, nextRotation);
  const rotatedCells = rotated.map((cell) => ({
    x: this.x + cell.x,
    y: this.field.wrapY(this.y + cell.y),
  }));
  return this.cellsCollide(rotatedCells);
}

rotate(): boolean {
  if (this.wouldRotateCollide()) return false;
  this.rotation = (this.rotation + 1) % 4;
  return true;
}
```

### New

```ts
wouldRotateCollide(minAllowedX: number = -Infinity): boolean {
  const nextRotation = (this.rotation + 1) % 4;
  const base = ActivePiece.getBaseShape(this.type);
  const rotated = ActivePiece.rotateShape(base, nextRotation);
  const rotatedCells = rotated.map((cell) => ({
    x: this.x + cell.x,
    y: this.field.wrapY(this.y + cell.y),
  }));
  // A cell that would end up behind the wall (x < minAllowedX, i.e. x <= wallX)
  // would be stranded; block the rotation.
  for (const cell of rotatedCells) {
    if (cell.x < minAllowedX) return true;
  }
  return this.cellsCollide(rotatedCells);
}

rotate(minAllowedX: number = -Infinity): boolean {
  if (this.wouldRotateCollide(minAllowedX)) return false;
  this.rotation = (this.rotation + 1) % 4;
  return true;
}
```

### Game wiring

```ts
if (actions.has('ROTATE') && this.activePiece) {
  this.activePiece.rotate(this.leftWall.getX() + 1);
}
```

## Constraints

- Default `minAllowedX = -Infinity` keeps every no-arg caller/test backward
  compatible (existing rotation tests at `main.ts:160-236` and Test 33 pass
  unchanged).
- The bound must be `cell.x < minAllowedX` with `minAllowedX = wallX + 1`, i.e.
  block when `cell.x <= wallX` — the exact logical negation of `isWallHit(wallX)`
  (`ActivePiece.ts:294-304`).
- The wall-bound check is a **soft** block (returns false, no movement); it must
  not throw or mutate state.
- No external libraries (Constraint-001).

## Acceptance Criteria

- [ ] `rotate(minAllowedX)` blocks (returns `false`, rotation unchanged) when any
      rotated cell has `x < minAllowedX`.
- [ ] `rotate(minAllowedX)` allows (returns `true`) when no rotated cell is below
      `minAllowedX` and the cells do not collide.
- [ ] `rotate()` with no argument behaves exactly as before (unrestricted x).
- [ ] `Game.processInput` passes `leftWall.getX() + 1` as `minAllowedX`.
- [ ] All existing rotation tests (no-arg) keep passing.
- [ ] `npx tsc` produces 0 errors.

## Deliverables

- Updated `src/ActivePiece.ts`
- Updated `src/Game.ts`

## Edge Cases

1. **Wall at x=0 (spawn)**: `minAllowedX = 1`; a piece at `x=6` rotating never
   reaches `x < 1`, so all rotations are allowed (Test 33 unaffected).
2. **Cell exactly at wallX+1** (`x == minAllowedX`): allowed (not strictly
   below). A cell at `x == wallX` (== `minAllowedX-1`) is blocked.
3. **Rotation also collides with the field**: both conditions are checked; either
   one blocks the rotation.
