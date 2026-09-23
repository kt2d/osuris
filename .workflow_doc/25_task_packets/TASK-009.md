# Task Packet

TASK-ID: TASK-009

Title: Fix Wall Push Collision Validation

Priority: High

Dependencies: None

---

# Objective

Add collision validation before `LeftWall.onWallAdvanced()` pushes the active piece. If the push would cause overlap with occupied cells, fix the piece in place instead.

---

# Business Context

When the Left Wall contacts the active piece, it pushes the piece one cell to the right. However, if that target cell is already occupied by a fixed block, the piece would overlap with existing blocks. This is a correctness issue that can cause unexpected game behavior.

---

# Scope

## In Scope

### Target

- `src/LeftWall.ts` - Modify `onWallAdvanced()` to validate collision before pushing
- `src/main.ts` - Add test for wall push collision validation (new test)
- Update Test 5 if needed (existing test may expect the old behavior)

## Out of Scope

- Changes to other collision detection logic
- Changes to piece movement mechanics
- Changes to compression system

---

# Constraints

## D-009-1: Fix in Place on Collision

Priority: Required

Description: If the push target cell is occupied, the piece must be fixed in place (converted to a fixed block) instead of being pushed.

Rationale: This prevents block overlap and maintains game integrity. Fixing the piece in place is the natural consequence of the wall pushing against an immovable obstacle.

---

## D-009-2: Preserve Existing Behavior When Free

Priority: Required

Description: If the push target cell is free, the piece must be pushed one cell to the right (existing behavior).

Rationale: The existing behavior is correct and should not change when the push is valid.

---

## D-009-3: Maintain Existing API

Priority: Required

Description: The public API of LeftWall must not change. Only internal logic of `onWallAdvanced()` may be modified.

Rationale: Other components depend on the existing interface.

---

# Implementation Notes

## Current Code (LeftWall.ts:132-139)

```typescript
private onWallAdvanced(): void {
    // 1. Check contact with the active piece.
    if (this.activePiece && this.activePiece.isWallHit(this.x)) {
        this.activePiece.move(1, 0);  // No collision check - BUG
        return;
    }

    // 2. Check contact with fixed blocks in the current column.
    this.advanceOccupiedBlocksInColumn(this.x);
}
```

## Required Change

```typescript
private onWallAdvanced(): void {
    // 1. Check contact with the active piece.
    if (this.activePiece && this.activePiece.isWallHit(this.x)) {
        // Validate collision before pushing
        const nextX = this.x + 1;
        const pieceCells = this.activePiece.getCells();  // Get current piece cells
        const canPush = pieceCells.every(cell => {
            const targetX = cell.x + 1;
            return this.field.isValidPosition(targetX, cell.y) && !this.field.get(targetX, cell.y);
        });

        if (canPush) {
            this.activePiece.move(1, 0);
        } else {
            // Cannot push - fix piece in place
            this.activePiece.moveToFixed();
        }
        return;
    }

    // 2. Check contact with fixed blocks in the current column.
    this.advanceOccupiedBlocksInColumn(this.x);
}
```

## Notes

- Use `field.get(x, y)` for O(1) collision check (see TASK-011 for the optimization, but this task can use the current getOccupiedCells() approach if getCells() is not available)
- If `ActivePiece.getCells()` is not a public method, use an alternative approach
- The `moveToFixed()` method should already exist on ActivePiece (used in other parts of the code)

## Test Strategy

Add a new test that:
1. Creates a field with a fixed block at the push target position
2. Places an active piece at the wall's contact position
3. Triggers wall advancement
4. Verifies the piece is fixed in place (not pushed into the occupied cell)

---

# Acceptance Criteria

- [ ] `npx tsc` compiles with no errors
- [ ] Wall push validates collision before moving piece
- [ ] If push target is free, piece is pushed one cell right (existing behavior preserved)
- [ ] If push target is occupied, piece is fixed in place
- [ ] New integration test added for wall push collision validation
- [ ] All existing tests still pass (may need to update Test 5)

---

# Deliverables

- Modified: `src/LeftWall.ts` (collision validation in onWallAdvanced)
- Modified: `src/main.ts` (new test for wall push collision)
- Tests: All tests pass (existing + new)

---

# References

- Code Review FINDING-002: LeftWall Pushes Piece Without Collision Validation
- Project State Debt-003: Wall Push Validation
- Project State Risk-002: spawnPiece Collision with Occupied Cells (related)
- Code Review Coverage Gap: No test for LeftWall pushing piece into occupied cell

---

# Validation Checklist

- [x] TASK-ID exists
- [x] Objective is clear
- [x] Business Context is documented
- [x] Scope is defined
- [x] Constraints are documented
- [x] Acceptance Criteria are measurable
- [x] Deliverables are defined
- [x] Implementation notes provide sufficient detail
- [x] Task can be implemented without reading the full Plan
