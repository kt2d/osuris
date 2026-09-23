# TASK-026: BFS Wall Advancement (Chain Push)

## Objective

When the left wall advances and pushes blocks in its column, also push any blocks that are connected to those blocks via horizontal adjacency. This creates a "chain push" effect where connected blocks move together.

## Business Context

Currently, the left wall only pushes blocks in its immediate column. Blocks at x+1 that are connected (adjacent) to blocks at x do not move. This creates an unintuitive behavior where a solid wall of blocks doesn't move as a unit. The BFS chain push makes the wall push the entire connected mass.

## Scope

### Files to Modify

1. **`src/LeftWall.ts`** — `advanceOccupiedBlocksInColumn(col)` method (lines ~177-210)
   - Add BFS expansion to find connected blocks to the RIGHT
   - Track connection points (blocks added during BFS)
   - Return effect data alongside movement data

### Files NOT Modified

- No changes to Field, ActivePiece, RightWall, CompressionSystem, Game, Renderer, InputManager

## Implementation

### Current Behavior

```
advanceOccupiedBlocksInColumn(col):
  1. Find all occupied cells at column `col`
  2. Validate targets (col+1, same y) are empty
  3. Move only those cells
```

### New Behavior

```
advanceOccupiedBlocksInColumn(col):
  1. Find all occupied cells at column `col` → toMove set
  2. BFS expand RIGHT:
     for each cell in toMove:
       if cell at (x+1, y) is occupied:
         add it to toMove
         mark it as a "connected" block
  3. Validate ALL targets (x+1 for every cell in toMove) are empty
  4. If validation fails → abort (no blocks move)
  5. Move all cells in toMove
  6. Return { pushedCells, connectedCells }
```

### BFS Expansion Details

```
// BFS expansion (rightward from wall column)
let head = 0;
while (head < toMove.length) {
  const current = toMove[head++];
  const rightX = current.x + 1;

  // Check right neighbor (same row, no vertical wrap for connections)
  if (rightX < Field.COLS && field.get(rightX, current.y)) {
    const key = `${rightX},${current.y}`;
    if (!set.has(key)) {
      set.add(key);
      toMove.push({ x: rightX, y: current.y });
      connectedCells.push({ x: rightX, y: current.y });
    }
  }
}
```

### Key Design Decisions

1. **Horizontal-only expansion**: Only check right neighbor (x+1, same y). Do NOT check vertical connections (y±1). This keeps behavior predictable.

2. **No vertical wrap for connections**: `field.get(x, y)` wraps Y, but chain connections should NOT cross the wrap boundary. Since we only check `rightX = current.x + 1` (same y), and y doesn't change during expansion, vertical wrap is not an issue.

3. **Single BFS pass**: One expansion pass is sufficient. The wall advances 1 column per tick, so the chain only extends 1 column per tick. Multiple passes would be needed only if the chain itself had internal gaps (which shouldn't happen since we expand from contiguous blocks).

4. **Validation before movement**: All targets must be valid before any blocks move. If the chain can't move (blocked), nothing moves. This prevents partial pushes.

### Return Type

```typescript
private advanceOccupiedBlocksInColumn(col: number): { pushedCells: Array<{x: number; y: number}>, connectedCells: Array<{x: number; y: number}> } {
  // ... implementation
  return { pushedCells: allMoved, connectedCells: newlyConnected };
}
```

### `onWallAdvanced()` Integration

```typescript
private onWallAdvanced(): void {
  // ... active piece handling (unchanged) ...

  // Fixed block contact with chain push
  const result = this.advanceOccupiedBlocksInColumn(this.x);
  // Effect registration is handled by caller (Game)
}
```

## Constraints

- BFS must use `field.get(x, y)` for occupancy check (Y wraps, X does not)
- BFS must check `rightX < Field.COLS` to avoid out-of-bounds
- Must not modify field during BFS (read-only expansion)
- All validations must pass before any movement
- Must not break existing 280 tests

## Acceptance Criteria

1. `LeftWall.advanceOccupiedBlocksInColumn()` uses BFS to find connected blocks to the right
2. Blocks directly right of wall-column blocks are pushed if connected
3. Blocks 2+ columns right are NOT pushed (single BFS pass)
4. If any block in the chain is blocked, NO blocks move (atomic push)
5. Connection points (blocks added during BFS) are tracked and returned
6. `field.get()` Y-wrapping does NOT create chain connections across wrap boundary
7. All 280+ existing tests pass (Failed: 0)
8. `npx tsc` produces 0 errors

## Deliverables

- Updated `src/LeftWall.ts`
- Updated `src/main.ts` (BFS chain push tests)

## Risks

- **Large chain "locked" scenarios**: If a large connected mass can't move (no room), the entire push fails. This is more punishing than the current behavior. Acceptable risk — creates interesting tactical decisions.
- **Interaction with right wall vertical shift**: If the player shifts the right wall while a chain is in progress, the field state changes. The BFS re-runs each tick, so this is handled correctly but may produce unintuitive results. Document this behavior.
- **Test compatibility**: Existing tests that rely on column-only push behavior may fail. Update tests to expect chain push behavior.

## Edge Cases

1. **Chain at right edge**: If the chain extends to x=14 (rightWall at x=15), the block at x=14 can't move right (x=15 is the right wall column). The push fails entirely.

2. **Empty gap in chain**: If blocks exist at x=3 and x=5 but not x=4, only the block at x=3 is pushed. The block at x=5 is not connected (no adjacency through x=4).

3. **Multi-row chain**: Blocks at (3,0), (3,1), (4,0), (4,1) form a 2x2 block. When wall is at x=3, all 4 blocks are pushed (2 in wall column + 2 connected right).

4. **Wall at right edge**: If wall is at x=14, there's only 1 column to push into (x=15). The BFS expansion finds nothing new (x=15 is the right wall column, which may or may not be occupied).
