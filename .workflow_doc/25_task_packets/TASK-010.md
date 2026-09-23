# Task Packet

TASK-ID: TASK-010

Title: Fix alignBlocksVertical Block Loss

Priority: Medium

Dependencies: None

---

# Objective

Fix `CompressionSystem.alignBlocksVertical()` to distribute blocks to adjacent empty rows instead of collapsing all blocks to the wall's y-position. This eliminates block loss while preserving the alignment intent.

---

# Business Context

When blocks are at the right wall's x-position but at different y-positions, `alignBlocksVertical()` currently moves all of them to the wall's y-position. This causes block loss (2 blocks → 1 block). The alignment intent is to pack blocks vertically at the wall position, not to destroy blocks.

---

# Scope

## In Scope

### Target

- `src/CompressionSystem.ts` - Modify `alignBlocksVertical()` to distribute blocks
- `src/main.ts` - Update affected test expectations (Test 15)

## Out of Scope

- Changes to other compression logic
- Changes to block movement algorithm
- Changes to RightWall behavior

---

# Constraints

## D-010-1: Distribute to Adjacent Empty Rows

Priority: Required

Description: Blocks must be distributed to adjacent empty rows starting from the wall's y-position, moving outward in both directions.

Rationale: This preserves the total block count while achieving the alignment effect. Starting from the wall's y-position maintains the visual intent of "aligning with the wall."

---

## D-010-2: Preserve Vertical Looping

Priority: Required

Description: Distribution must respect vertical looping (y=8 wraps to y=0, y=-1 wraps to y=7).

Rationale: The game's vertical looping topology must be maintained. Blocks that would go off the bottom should wrap to the top and vice versa.

---

## D-010-3: Maintain API Compatibility

Priority: Required

Description: The public API of CompressionSystem must not change. Only internal logic of `alignBlocksVertical()` may be modified.

Rationale: Other components depend on the existing interface.

---

# Implementation Notes

## Current Code (CompressionSystem.ts:116-134)

```typescript
private alignBlocksVertical(): void {
    const wallY = this.rightWall.getY();
    const wallX = this.rightWall.getX();

    // Skip if target row is already occupied.
    if (this.field.get(wallX, wallY)) return;

    const toMove: Array<{ y: number }> = [];
    for (let y = 0; y < Field.ROWS; y++) {
        if (this.field.get(wallX, y) && y !== wallY) {
            toMove.push({ y });
        }
    }

    for (const cell of toMove) {
        this.field.set(wallX, cell.y, false);
        this.field.set(wallX, wallY, true);  // All blocks go to wallY - BUG
    }
}
```

## Required Change

```typescript
private alignBlocksVertical(): void {
    const wallY = this.rightWall.getY();
    const wallX = this.rightWall.getX();

    // Skip if target row is already occupied.
    if (this.field.get(wallX, wallY)) return;

    // Collect all blocks at this x-position (excluding wallY).
    const blockYs: number[] = [];
    for (let y = 0; y < Field.ROWS; y++) {
        if (this.field.get(wallX, y) && y !== wallY) {
            blockYs.push(y);
        }
    }

    // Clear old positions.
    for (const y of blockYs) {
        this.field.set(wallX, y, false);
    }

    // Distribute to adjacent empty rows starting from wallY.
    const placed: number[] = [];
    let offset = 0;

    while (placed.length < blockYs.length) {
        // Try +offset (downward)
        let targetY = this.field.wrapY(wallY + offset);
        if (!this.field.get(wallX, targetY) && !placed.includes(targetY)) {
            this.field.set(wallX, targetY, true);
            placed.push(targetY);
        }

        // Try -offset (upward), skip if offset === 0 (already tried wallY)
        if (offset > 0) {
            targetY = this.field.wrapY(wallY - offset);
            if (!this.field.get(wallX, targetY) && !placed.includes(targetY)) {
                this.field.set(wallX, targetY, true);
                placed.push(targetY);
            }
        }

        offset++;
    }
}
```

## Distribution Order Example

If wallY = 3 and there are 3 blocks to place:
1. y=3 (wallY itself, offset=0)
2. y=4 (wallY + 1, offset=1)
3. y=2 (wallY - 1, offset=1)

Result: blocks at y=2, y=3, y=4 (centered around wallY)

## Test Impact

Test 15 currently expects block count to decrease from 2 to 1. After this fix, Test 15 must be updated to expect 2 blocks at adjacent positions.

---

# Acceptance Criteria

- [ ] `npx tsc` compiles with no errors
- [ ] alignBlocksVertical distributes blocks to adjacent empty rows
- [ ] Total block count is preserved (no block loss)
- [ ] Distribution starts from wall's y-position and moves outward
- [ ] Vertical looping is respected in distribution
- [ ] Test 15 updated to reflect new behavior (block count preserved)
- [ ] All existing tests pass

---

# Deliverables

- Modified: `src/CompressionSystem.ts` (alignBlocksVertical fix)
- Modified: `src/main.ts` (Test 15 updated)
- Tests: All tests pass

---

# References

- Code Review FINDING-003: alignBlocksVertical() Causes Block Loss
- Project State Debt-005: alignBlocksVertical Block Loss
- Bird's Eye Review Recommendation-BE-001: Define MVP Quality Gate
- Challenge Concern-001: alignBlocksVertical Design

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
