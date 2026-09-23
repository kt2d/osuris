# Task Packet

TASK-ID: TASK-011

Title: Optimize Collision Detection

Priority: Medium

Dependencies: None

---

# Objective

Replace the O(n*m) collision detection in `ActivePiece.cellsCollide()` with O(1) cell lookup using `field.get(x, y)`. This eliminates the inner loop over occupied cells.

---

# Business Context

The current collision detection calls `field.getOccupiedCells()` inside the loop for each piece cell, creating O(n*m) complexity. For a 16x8 grid with many blocks, this degrades performance. The fix is a simple one-line change per cell check.

---

# Scope

## In Scope

### Target

- `src/ActivePiece.ts` - Optimize `cellsCollide()` to use O(1) lookup

## Out of Scope

- Changes to other collision detection methods
- Changes to field data structure
- Changes to getOccupiedCells() method

---

# Constraints

## D-011-1: Use field.get(x, y) for O(1) Lookup

Priority: Required

Description: Replace the inner loop over `getOccupiedCells()` with a direct `field.get(cell.x, cell.y)` call.

Rationale: `field.get(x, y)` returns the boolean occupancy status of a cell in O(1) time, eliminating the need to iterate over all occupied cells.

---

## D-011-2: Preserve Collision Semantics

Priority: Required

Description: The optimized collision detection must produce identical results to the original for all valid inputs.

Rationale: This is a performance optimization, not a behavior change. The collision detection must remain correct.

---

# Implementation Notes

## Current Code (ActivePiece.ts:206-218)

```typescript
private cellsCollide(cells: Array<{ x: number; y: number }>): boolean {
    for (const cell of cells) {
        // Out of bounds check (x only; y wraps via the field).
        if (!this.field.isValidPosition(cell.x, cell.y)) return true;

        // Check against occupied cells on the field.
        const occupied = this.field.getOccupiedCells();  // Called per cell - O(n*m)
        for (const occ of occupied) {
            if (occ.x === cell.x && occ.y === cell.y) return true;
        }
    }
    return false;
}
```

## Required Change

```typescript
private cellsCollide(cells: Array<{ x: number; y: number }>): boolean {
    for (const cell of cells) {
        // Out of bounds check (x only; y wraps via the field).
        if (!this.field.isValidPosition(cell.x, cell.y)) return true;

        // O(1) occupancy check.
        if (this.field.get(cell.x, cell.y)) return true;
    }
    return false;
}
```

## Complexity Change

| Metric | Before | After |
|--------|--------|-------|
| Per cell check | O(m) | O(1) |
| Total (n cells) | O(n*m) | O(n) |
| Max comparisons | 4 * 128 = 512 | 4 |

## Test Strategy

No new tests needed. The existing collision tests (Tests 1-3, 33) verify collision detection behavior. If the optimization is correct, all existing tests should pass.

---

# Acceptance Criteria

- [ ] `npx tsc` compiles with no errors
- [ ] `cellsCollide()` uses `field.get(x, y)` instead of `getOccupiedCells()`
- [ ] Collision detection produces identical results to original
- [ ] All existing collision tests pass (Tests 1-3, 33)
- [ ] All 222 existing tests pass

---

# Deliverables

- Modified: `src/ActivePiece.ts` (cellsCollide optimization)
- Tests: All 222 existing tests pass

---

# References

- Code Review FINDING-001: Performance - O(n*m) Collision Detection
- Project State Debt-004: Collision Detection Performance
- Bird's Eye Review Debt-BE-003: Performance Debt Underestimated

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
