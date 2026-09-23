# Task Packet

TASK-ID: TASK-014

Title: Fix spawnPiece Collision Validation

Priority: High

Dependencies: None

---

# Objective

Add collision validation in `Game.spawnPiece()` to prevent pieces from spawning overlapping with existing blocks on the field. If the spawn position is blocked, transition to GAME_OVER instead of creating an overlapping piece.

---

# Business Context

Risk-002 documents that `Game.spawnPiece()` checks whether `spawnX >= rightWall.getX()` but does not validate against occupied cells on the field. A piece could spawn overlapping with fixed blocks, creating invalid game states. Test 43 currently documents this as a known risk. This task resolves Risk-002 by adding collision validation before accepting a spawn.

---

# Scope

## In Scope

### Target

- `src/Game.ts` - Add collision validation in `spawnPiece()` method
- `src/main.ts` - Update Test 43 to verify spawn collision validation works correctly (replace Risk-002 documentation with actual fix verification)

## Out of Scope

- Changes to piece movement mechanics
- Changes to rotation collision detection (already handled by ActivePiece)
- Changes to wall push collision validation (already handled by TASK-009)

---

# Constraints

## D-014-1: Validate All Piece Cells

Priority: Required

Description: Before accepting a spawn, check that none of the piece's cells overlap with occupied cells on the field. Use `field.get(x, y)` for O(1) lookup per cell.

Rationale: Consistent with TASK-011 optimization pattern. All piece cells must be validated, not just the spawn position.

## D-014-2: GAME_OVER on Blocked Spawn

Priority: Required

Description: If the spawn position is blocked by occupied cells, transition to GAME_OVER instead of trying alternative positions.

Rationale: The spawn position is deterministic (`max(2, rightWall.x - 4)`). If this position is blocked, the field is too crowded for continued play. Trying random positions would create unpredictable gameplay.

## D-014-3: Maintain Existing API

Priority: Required

Description: The public API of Game must not change. Only internal logic of `spawnPiece()` may be modified.

Rationale: Other components (entry.ts, tests) depend on the existing interface.

---

# Implementation Notes

## Current Code (Game.ts:289-314)

```typescript
private spawnPiece(): boolean {
    const spawnX = Math.max(2, this.rightWall.getX() - 4);
    const spawnY = Math.floor(Field.ROWS / 2);

    // Check if there's space between spawn position and right wall
    if (spawnX >= this.rightWall.getX()) {
        this.state = 'GAME_OVER';
        return false;
    }

    // Random tetromino type (0-6)
    const type = Math.floor(Math.random() * 7);

    this.activePiece = new ActivePiece(
        this.field,
        type,
        spawnX,
        spawnY,
        0
    );

    // Link active piece to left wall for contact detection
    this.leftWall.setActivePiece(this.activePiece);

    return true;
}
```

## Required Change

After creating the ActivePiece but before linking it to the left wall, validate that none of the piece's cells overlap with occupied cells:

```typescript
private spawnPiece(): boolean {
    const spawnX = Math.max(2, this.rightWall.getX() - 4);
    const spawnY = Math.floor(Field.ROWS / 2);

    // Check if there's space between spawn position and right wall
    if (spawnX >= this.rightWall.getX()) {
        this.state = 'GAME_OVER';
        return false;
    }

    // Random tetromino type (0-6)
    const type = Math.floor(Math.random() * 7);

    this.activePiece = new ActivePiece(
        this.field,
        type,
        spawnX,
        spawnY,
        0
    );

    // Validate that spawn position doesn't overlap with existing blocks
    if (this.activePiece.cellsCollide()) {
        this.activePiece = null;
        this.state = 'GAME_OVER';
        return false;
    }

    // Link active piece to left wall for contact detection
    this.leftWall.setActivePiece(this.activePiece);

    return true;
}
```

## Key Points

- `ActivePiece.cellsCollide()` already exists and checks if any piece cell overlaps with occupied cells on the field (optimized in TASK-011 to use O(1) field.get())
- If collision is detected, null out the active piece and transition to GAME_OVER
- The existing Test 43 documents Risk-002. Update this test to verify the fix works correctly

## Test Strategy

Update Test 43 to verify:
1. When spawn position overlaps with existing blocks, spawnPiece returns false
2. Game transitions to GAME_OVER when spawn is blocked
3. When spawn position is clear, piece spawns normally (existing behavior preserved)

---

# Acceptance Criteria

- [ ] `npx tsc` compiles with no errors
- [ ] spawnPiece() validates collision before accepting spawn
- [ ] If spawn position overlaps with occupied cells, spawnPiece returns false
- [ ] If spawn is blocked, game transitions to GAME_OVER
- [ ] If spawn position is clear, piece spawns normally (existing behavior preserved)
- [ ] Test 43 updated to verify spawn collision validation
- [ ] All 257 existing tests pass

---

# Deliverables

- Modified: `src/Game.ts` (collision validation in spawnPiece)
- Modified: `src/main.ts` (Test 43 updated to verify fix)
- Tests: All tests pass (257 existing + updated Test 43)

---

# References

- Project State Risk-002: spawnPiece Collision with Occupied Cells
- Code Review CR-IT1-001: Renderer.drawScore() syntax error (unrelated but same iteration)
- TASK-009: Fix Wall Push Collision Validation (similar validation pattern)
- TASK-011: Optimize Collision Detection (cellsCollide() uses O(1) lookup)

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
