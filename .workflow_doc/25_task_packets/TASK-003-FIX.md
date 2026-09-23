# Task Packet

TASK-ID: TASK-003-FIX

Title: Fix CompressionSystem Test Failures

Priority: High

Dependencies: None

---

# Objective

Fix 4 failing tests in `CompressionSystem.compress()` by correcting the method's logic for empty fields and full fields.

---

# Business Context

The CompressionSystem is the core mechanic of the game. When the Left Wall reaches the Right Wall, compression should occur and the cycle should advance. Currently, 4 tests fail because `compress()` does not handle two important cases correctly:

1. **Empty field**: When walls meet with no blocks between them, the cycle should still complete (reset callback fires, returns true). Currently returns false.
2. **Full field**: When the field is completely full and no blocks can move, `compress()` should not call the reset callback. Currently it calls `alignBlocksVertical()` + `resetLeftWall()` even when no useful compression occurred.

These bugs prevent the game loop from functioning correctly.

---

# Scope

## In Scope

### Target

- File: `src/CompressionSystem.ts` - Fix the `compress()` method
- File: `src/main.ts` - Tests already exist; they should pass after the fix

## Out of Scope

- Adding new tests (existing 156 assertions cover the required behavior)
- Changing the CompressionSystem constructor or public API
- Modifying any other source files

---

# Constraints

## D-001: Compression Always Completes Cycle on Trigger

Priority: Required

Description: When `shouldCompress(leftWallX)` returns true, `compress()` must always call the reset callback and return true. The compression of blocks is a best-effort operation within the cycle.

Rationale: The cycle is triggered by wall proximity, not by block movement. An empty field between walls still represents a valid cycle completion.

---

## D-002: Full Field Does Not Reset

Priority: Required

Description: When the field is completely full and no blocks can move, `compress()` should restore the field state and return false. The reset callback must NOT be called.

Rationale: A full field means the game should end, not continue with a reset. The current code calls `alignBlocksVertical()` when blocks exist at the wall position, which incorrectly triggers a reset on a full field.

---

## D-003: Preserve Existing API

Priority: Required

Description: The public API of CompressionSystem must not change. Only the internal logic of `compress()` may be modified.

Rationale: Downstream components (Game state machine) depend on the existing interface.

---

# Implementation Notes

## Current Failure Analysis

The 4 failing tests are:

| Test | Assertion | Current Result | Expected |
|------|-----------|---------------|----------|
| Test 12 | `compress returns true when triggered` | false | true |
| Test 12 | `left wall reset callback was called once` | 0 calls | 1 call |
| Test 14 | `Compression does not corrupt field when blocked` | compress=true, reset=1 | compress=false, reset=0 |
| Test 16 | `Left wall reset callback called with x=0` | resetX=-1 | resetX=0 |

## Root Cause

The `compress()` method currently follows this logic:

```
1. shouldCompress(leftWallX) -> must be true to proceed
2. Save preState
3. pushBlocksRight() -> moves blocks rightward via BFS
4. hasAnyMovement(preState) -> true if blocks moved
5. If movement occurred: resetLeftWall(), return true
6. If no movement: hasBlocksAtWallX()?
   - If yes: alignBlocksVertical(), resetLeftWall(), return true
   - If no: restoreGrid(preState), return false
```

The problem is in step 6: when the field is empty, both `hasAnyMovement()` and `hasBlocksAtWallX()` return false, so the method returns false without calling the reset callback. When the field is full, `hasBlocksAtWallX()` returns true (blocks at wall position), so it calls `alignBlocksVertical()` + `resetLeftWall()` even though no useful compression happened.

## Recommended Fix

Restructure `compress()` to:

```
1. shouldCompress(leftWallX) -> must be true to proceed
2. Save preState
3. pushBlocksRight() -> moves blocks rightward via BFS
4. hasAnyMovement(preState) -> true if blocks moved
5. If movement occurred: resetLeftWall(), return true
6. If no movement:
   a. Check if field is full (countBlocks() == COLS * ROWS)
   b. If full: restoreGrid(preState), return false
   c. If not full: resetLeftWall(), return true
```

This ensures:
- Empty field: no movement, not full -> reset + return true (Tests 12, 16 fixed)
- Full field: no movement, full -> restore + return false (Test 14 fixed)
- Partial field with movement: movement detected -> reset + return true (unchanged)

## Validation

Run: `npx tsc && node dist/main.js`

Expected: All 156 tests pass (0 failures).

---

# Acceptance Criteria

- [ ] `npx tsc` compiles with no errors
- [ ] `node dist/main.js` runs all 156 tests with 0 failures
- [ ] Test 12 (empty field compression) passes: compress returns true, callback called once
- [ ] Test 14 (full field compression) passes: compress returns false, callback not called
- [ ] Test 16 (reset callback) passes: reset callback fires on empty field compression
- [ ] The public API of CompressionSystem is unchanged
- [ ] No other source files were modified

---

# Deliverables

- Modified: `src/CompressionSystem.ts`
- Tests: All 156 existing assertions pass

---

# References

- `src/CompressionSystem.ts` - Current implementation
- `src/main.ts` - Test suite (Tests 12, 14, 16)
- `compress-mechanism.md` - Compression algorithm specification

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
