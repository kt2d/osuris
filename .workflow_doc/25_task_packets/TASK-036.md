# TASK-036: Fix CompressionSystem Movement Target

Task ID: TASK-036
Date: 2026-09-03
Status: DONE (implemented 2026-09-08; report in .workflow_doc/30_implement.md)
Priority: High
Depends On: none

---

# Objective

Fix the movement-target construction in `CompressionSystem` so it follows the compression spec: seed at the moving left wall and expand only to the right.

---

# Business Context

The left wall is the wall that advances rightward and pushes blocks. The right wall is the vertical anchor. The current compression system uses the right wall's adjacent column as the seed and expands left, which pulls blocks behind the moving wall into the movement target. That causes the reported left-wall compression/deformation behavior.

---

# Scope

## Files To Modify

- `src/CompressionSystem.ts`
- `src/main.ts`

## Files Not Modified

- `src/LeftWall.ts`
- `src/RightWall.ts`
- `src/ActivePiece.ts`
- `src/Game.ts`
- `src/Renderer.ts`
- `src/EffectSystem.ts`

---

# Acceptance Criteria

## AC 1: Movement target uses the left wall column

Status:

Evidence:

- `CompressionSystem.compress(leftWallX)` must pass `leftWallX` into the movement-target builder.
- The movement target must start from occupied cells in column `leftWallX`.
- It must not seed from `rightWall.x - 1`.

---

## AC 2: Movement target expands only to the right

Status:

Evidence:

- For each block in the movement target, inspect `(x + 1, y)`.
- If `(x + 1, y)` is occupied and not already in the movement target, add it and continue.
- Do not add blocks at `(x - 1, y)`.

---

## AC 3: Existing compression movement test encodes corrected behavior

Status:

Evidence:

- With blocks at `(10,4)` through `(14,4)` and the left wall at `x=14`, compression moves only the block at `(14,4)` to `(15,4)`.
- Blocks at `(10,4)` through `(13,4)` remain in place.
- Block count remains 5.

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
// seedX = rightWall.x - 1
// expand left

// After:
// seedX = leftWallX
// expand right
```

The movement target should be recalculated each compression step and moved simultaneously one column right until a block cannot move.

---

# Deliverables

- Updated `src/CompressionSystem.ts`.
- Updated `src/main.ts` compression movement-path test.
- Verification output from `npx tsc --noEmit && node dist/main.js`.
