# Task Packet

TASK-ID: TASK-016

Title: Optimize hasOccupiedBlocksInColumn()

Priority: Low

Dependencies: None

---

# Objective

Replace the O(n) linear scan in `LeftWall.hasOccupiedBlocksInColumn()` with an O(ROWS) loop using `field.get(col, y)`. Maximum comparisons reduced from 128 to 8.

---

# Business Context

CR-IT1-002 identifies that `LeftWall.hasOccupiedBlocksInColumn()` iterates over all occupied cells on the field to check if any exist in a specific column. This is O(n) where n = total occupied cells, despite only needing to check one column. TASK-011 already optimized collision detection to O(1) per cell. This optimization maintains consistency across the codebase.

---

# Scope

## In Scope

### Target

- `src/LeftWall.ts` - Replace `hasOccupiedBlocksInColumn()` implementation

## Out of Scope

- Changes to other methods in LeftWall
- Changes to collision detection in ActivePiece (already optimized in TASK-011)
- Performance testing or benchmarks

---

# Constraints

## D-016-1: Use field.get() for O(1) Lookup

Priority: Required

Description: Replace the linear scan over `getOccupiedCells()` with a loop over rows using `field.get(col, y)`.

Rationale: Consistent with TASK-011 optimization pattern. Reduces maximum comparisons from 128 (full field) to 8 (ROWS).

## D-016-2: Preserve Return Value

Priority: Required

Description: The method must return `true` if any cell in the specified column is occupied, `false` otherwise.

Rationale: Existing callers depend on this behavior.

## D-016-3: Use Field.ROWS Constant

Priority: Required

Description: Iterate from y=0 to y < Field.ROWS. Use the constant, not a magic number.

Rationale: Consistent with project conventions (no magic numbers).

---

# Implementation Notes

## Current Code (LeftWall.ts)

```typescript
hasOccupiedBlocksInColumn(col: number): boolean {
    const occupied = this.field.getOccupiedCells();
    for (const cell of occupied) {
        if (cell.x === col) return true;
    }
    return false;
}
```

## Required Change

```typescript
hasOccupiedBlocksInColumn(col: number): boolean {
    for (let y = 0; y < Field.ROWS; y++) {
        if (this.field.get(col, y)) return true;
    }
    return false;
}
```

## Key Points

- This is a pure optimization; behavior is identical
- No new tests needed (existing tests cover this method)
- The optimization follows the same pattern as TASK-011 (ActivePiece.cellsCollide)

---

# Acceptance Criteria

- [ ] `npx tsc` compiles with no errors
- [ ] hasOccupiedBlocksInColumn() uses field.get(col, y) in a loop over rows
- [ ] Maximum comparisons reduced from 128 to 8
- [ ] All 257 existing tests pass
- [ ] Method returns identical results for all inputs

---

# Deliverables

- Modified: `src/LeftWall.ts` (optimized hasOccupiedBlocksInColumn)
- Tests: All 257 existing tests pass

---

# References

- Code Review CR-IT1-002: LeftWall.hasOccupiedBlocksInColumn() Uses O(n) Linear Scan
- TASK-011: Optimize Collision Detection (same optimization pattern)

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
