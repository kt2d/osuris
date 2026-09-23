# TASK-035: Doc-Sync — game-design.md Push Speed Wording

## Objective

Correct the stale "一定速度" (constant speed) wording in `game-design.md` to
reflect that the left wall now uses a **dynamic** push speed (400ms/tick ramping
to 200ms/tick over 10 seconds), implemented in TASK-027.

## Business Context

`game-design.md` still describes the left wall advancing at a constant speed.
Iteration 6 (TASK-027) changed it to a dynamic interval (400ms → 200ms over 10s
of elapsed game time). The doc should match the implemented behavior so the
spec remains the source of truth for future agents.

## Scope

### Files to Modify

- **`game-design.md`** — the line(s) describing the left wall's movement speed
  (the "一定速度" / constant-speed wording).

### Files NOT Modified

- All other files. This is a documentation-only change.

## Implementation

Locate the passage describing the left wall's speed. Replace the constant-speed
statement with the dynamic-speed description, e.g.:

> 左壁は一定速度ではなく、ゲーム開始時 400ms/tick から 10 秒かけて 200ms/tick
> へ線形加速する動的速度で進む（TASK-027）。

(Adjust to match the surrounding sentence structure; keep it in Japanese to be
consistent with the rest of the doc.)

## Constraints

- Documentation-only; no source or test changes.
- Keep the doc's existing style/language.
- Do not change any other spec content.

## Acceptance Criteria

- [ ] `game-design.md` no longer states the left wall moves at a constant speed.
- [ ] `game-design.md` states the dynamic interval (400ms → 200ms over 10s).
- [ ] No source/test files are modified.

## Deliverables

- Updated `game-design.md`

## Edge Cases

1. If the doc describes the speed in multiple places, update all of them for
   consistency.
