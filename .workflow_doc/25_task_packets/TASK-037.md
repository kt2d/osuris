# TASK-037: Fix RightWall Vertical Block Movement

Task ID: TASK-037
Date: 2026-09-03
Status: READY
Priority: High
Depends On: none

---

# Objective

Make the right wall move only blocks directly contacting its own column when it shifts vertically.

---

# Business Context

The reported bug is that moving the right wall vertically causes blocks to compress vertically. The current implementation drags all horizontally connected blocks with the wall. The spec only requires blocks contacting the wall to move with it during a vertical slide.

---

# Scope

## Files To Modify

- `src/RightWall.ts`
- `src/main.ts`

## Files Not Modified

- `src/CompressionSystem.ts`
- `src/LeftWall.ts`
- `src/ActivePiece.ts`
- `src/Game.ts`
- `src/Renderer.ts`
- `src/EffectSystem.ts`

---

# Acceptance Criteria

## AC 1: `moveBlocksVertical` moves only the wall column

Status:

Evidence:

- Iterate `y = 0..Field.ROWS - 1`.
- Move a block only when `field.get(this.x, y)` is true.
- Do not expand to `(x - 1, y)` or any other connected block.

---

## AC 2: A left-adjacent connected block stays in place during a vertical shift

Status:

Evidence:

- With a block at `(15,3)` and another at `(14,3)`, calling `shiftVertical(1)` moves the `(15,3)` block to `(15,4)`.
- The `(14,3)` block remains at `(14,3)`.
- Block count is unchanged.

---

## AC 3: Existing right-wall unit tests remain valid

Status:

Evidence:

- Test 9 still verifies wrap behavior for the wall itself.
- Test 10 still verifies that blocks at the right-wall column move by `dy`.
- Test 34 still verifies the corrected `ArrowUp` / `ArrowDown` mapping through `Game.processInput()`.

---

## AC 4: Build and test suite pass

Status:

Evidence:

- `npx tsc --noEmit` exits with status 0.
- `node dist/main.js` reports `Failed: 0`.

---

# Expected Post-Change Behavior

```ts
// Before:
// seed wall column, then expand left through connected blocks.

// After:
// move only occupied cells at this.x; no horizontal expansion.
```

---

# Deliverables

- Updated `src/RightWall.ts`.
- Updated or additional `src/main.ts` right-wall tests.
- Verification output from `npx tsc --noEmit && node dist/main.js`.
