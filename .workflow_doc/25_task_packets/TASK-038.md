# TASK-038: Add Regression Coverage For Corrected Movement Targets

Task ID: TASK-038
Date: 2026-09-03
Status: DONE (implemented 2026-09-13; report in .workflow_doc/30_implement.md)
Priority: Medium
Depends On: TASK-036, TASK-037

---

# Objective

Add focused regression tests that pin the corrected movement-target behavior for both the left-wall compression system and the right-wall vertical shift.

---

# Business Context

The existing suite encodes the old behavior in several places. After the fixes, it needs deterministic tests that prove:

1. The left wall pushes only its own column and blocks to its right, not blocks behind/left of it.
2. The right wall moves only its own column vertically, not horizontally connected chains.

---

# Scope

## Files To Modify

- `src/main.ts`

## Files Not Modified

- `src/CompressionSystem.ts`
- `src/RightWall.ts`
- `src/Game.ts`
- `src/Field.ts`
- `src/LeftWall.ts`
- `src/ActivePiece.ts`
- `src/Renderer.ts`
- `src/EffectSystem.ts`

---

# Acceptance Criteria

## AC 1: CompressionSystem movement-set regression test

Status:

Evidence:

- Create a field with a horizontal chain at `(10,4)` through `(14,4)`.
- Call `compress(14)`.
- Assert blocks remain at `(10,4)` through `(13,4)`.
- Assert `(14,4)` is vacated and `(15,4)` is occupied.
- Assert total block count remains 5.

---

## AC 2: RightWall vertical-shift regression test

Status:

Evidence:

- Create a field with a block at `(15,3)` and another at `(14,3)`.
- Create a right wall at x=15, y=0.
- Call `shiftVertical(1)`.
- Assert `(15,3)` moves to `(15,4)`.
- Assert `(14,3)` remains occupied.
- Assert total block count remains 2.

---

## AC 3: Existing movement tests remain semantically correct

Status:

Evidence:

- Existing LeftWall chain-push tests still assert that the wall-column block and same-row right-neighbor blocks move together.
- Existing right-wall tests still assert direct wall-column movement.
- No test asserts that blocks left of the moving left wall are dragged during compression.

---

## AC 4: Full suite passes

Status:

Evidence:

- `npx tsc --noEmit` exits with status 0.
- `node dist/main.js` reports `Failed: 0`.

---

# Deliverables

- Updated `src/main.ts`.
- Verification output from `npx tsc --noEmit && node dist/main.js`.
