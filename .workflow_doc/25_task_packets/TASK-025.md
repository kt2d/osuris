# TASK-025: Spawn Position Offset 5 Blocks Left

## Objective

Shift the active piece spawn position 5 columns to the left, from `spawnX = max(2, rightWall.x - 4)` to `spawnX = max(2, rightWall.x - 9)`.

## Business Context

Players need more horizontal space to position their pieces before the left wall reaches them. The current spawn at x=11 (with rightWall at x=15) gives only 4 columns of space. Shifting to x=6 gives 9 columns of space, improving playability.

## Scope

### Files to Modify

1. **`src/Game.ts`** — `spawnPiece()` method, line ~323
   - Change: `spawnX = Math.max(2, this.rightWall.getX() - 4)` → `spawnX = Math.max(2, this.rightWall.getX() - 9)`
   - Update JSDoc comment to reflect new formula

2. **`src/main.ts`** — Test updates
   - Tests that verify spawn position need to expect x=6 (was x=11) when rightWall is at x=15

### Files NOT Modified

- No new files
- No changes to ActivePiece, Field, LeftWall, RightWall, CompressionSystem, Renderer, InputManager

## Constraints

- Must maintain `spawnX >= 2` minimum (ensures at least 2 columns of space to the left)
- Must maintain `spawnX < rightWall.x` (piece must spawn to the left of the right wall)
- All existing 280 tests must pass (Failed: 0)
- `npx tsc` must produce 0 errors

## Acceptance Criteria

1. `Game.spawnPiece()` uses formula `max(2, rightWall.getX() - 9)` for spawnX
2. With rightWall at x=15 (default), piece spawns at x=6 (was x=11)
3. With rightWall at x=11 (edge case after compression), piece spawns at x=2 (minimum)
4. With rightWall at x=10, piece spawns at x=2 (minimum guard active)
5. All 280+ existing tests pass (Failed: 0)
6. `npx tsc` produces 0 errors

## Deliverables

- Updated `src/Game.ts`
- Updated `src/main.ts` (test assertions for spawn position)

## Implementation Notes

### Current Behavior

```
rightWall.x = 15 → spawnX = max(2, 15 - 4) = max(2, 11) = 11
rightWall.x = 10 → spawnX = max(2, 10 - 4) = max(2, 6) = 6
```

### New Behavior

```
rightWall.x = 15 → spawnX = max(2, 15 - 9) = max(2, 6) = 6
rightWall.x = 11 → spawnX = max(2, 11 - 9) = max(2, 2) = 2
rightWall.x = 10 → spawnX = max(2, 10 - 9) = max(2, 1) = 2 (guard active)
```

### Spawn Y (unchanged)

```
spawnY = Math.floor(Field.ROWS / 2) = Math.floor(8 / 2) = 4
```

### Tests to Update in `main.ts`

Search for tests that check spawn position. The key test is Test 31 (game starts with spawned piece). Any assertion that checks `getActivePiece().getX() === 11` should become `=== 6`.

### Edge Case: I-Piece at Minimum Spawn

When `rightWall.x = 11`, spawn is at `x = 2`. The I-piece (4 cells wide) spans columns 2, 3, 4, 5. This leaves columns 6-14 (9 columns) for gameplay. While tight, this is playable. Document this behavior.

## Risks

- If the right wall is pushed left during gameplay (not currently possible), spawn position could be further left. Currently the right wall is fixed at x=15.
- The I-piece at minimum spawn (x=2) is playable but reduces maneuverability. This is an acceptable trade-off for the increased spawn space.
