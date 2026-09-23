# TASK-032: BUG B — Invert WALL_UP/DOWN Mapping + RightWall JSDoc

## Objective

Make the right wall move in the correct on-screen direction for the arrow keys:
`ArrowUp` moves it **up** (toward smaller y), `ArrowDown` moves it **down**
(toward larger y). Only `Game.processInput`'s mapping and the `RightWall`
JSDoc change; `shiftVertical`'s mechanical behavior is frozen.

## Business Context

`Renderer.ts` (`Renderer.ts:118-119,160`) draws `y=0` at the **top** with `y`
growing **downward** (`fillRect(x*cs, y*cs, ...)`). `RightWall.shiftVertical(dy)`
does `y = wrapY(y + dy)`, so `dy=+1` moves the wall **down** on screen.
`Game.processInput` (`Game.ts:363-368`) currently maps `WALL_UP →
shiftVertical(1)` (down) and `WALL_DOWN → shiftVertical(-1)` (up) — inverted.

## Scope

### Files to Modify

1. **`src/Game.ts`** — `processInput()` (lines 363-369):
   - `WALL_UP` → `this.rightWall.shiftVertical(-1)`
   - `WALL_DOWN` → `this.rightWall.shiftVertical(1)`

2. **`src/RightWall.ts`** — `shiftVertical` JSDoc (line ~61): reword so the
   on-screen consequence is explicit.

### Files NOT Modified

- `shiftVertical` body (mechanical behavior unchanged).
- The direct unit tests Test 9 / Test 10 (`main.ts:507-566`) — they test the
  class's raw `y±dy` behavior and keep passing (see Assumptions).
- No other modules. `main.ts` Game-level test rewrite is TASK-033.

## Implementation

### Game.processInput — swap the signs

```ts
if (actions.has('WALL_UP')) {
  this.rightWall.shiftVertical(-1);   // up on screen
}

if (actions.has('WALL_DOWN')) {
  this.rightWall.shiftVertical(1);    // down on screen
}
```

### RightWall.ts JSDoc (line ~61) — reword

Replace:
```
* @param dy The vertical displacement (positive = up, negative = down).
```
With (mechanical + screen consequence, no behavior change):
```
* @param dy The vertical displacement in y-index units. dy>0 increases the
*   y-index; since the renderer draws y=0 at the top, dy>0 moves the wall
*   DOWN on screen and dy<0 moves it UP. `Game` maps ArrowUp to dy<0 and
*   ArrowDown to dy>0 accordingly.
```

## Constraints

- Do NOT change `shiftVertical`'s body or `moveBlocksVertical` (F10 accepted).
- Do NOT change `setY` / wrap semantics.
- The change is confined to the `Game` mapping + the JSDoc.
- No external libraries (Constraint-001).

## Acceptance Criteria

- [ ] `Game.processInput` maps `WALL_UP → shiftVertical(-1)` and
      `WALL_DOWN → shiftVertical(1)`.
- [ ] `RightWall.shiftVertical` body is unchanged (still `y = wrapY(y + dy)`).
- [ ] `RightWall.ts:61` JSDoc states the screen-direction consequence.
- [ ] Test 9 / Test 10 (direct `shiftVertical` unit tests) still pass unchanged.
- [ ] `npx tsc` produces 0 errors.

## Deliverables

- Updated `src/Game.ts`
- Updated `src/RightWall.ts` (JSDoc only)

## Edge Cases

1. **Wrap**: `shiftVertical` already wraps via `Field.wrapY`; the sign swap
   does not affect wrapping. `ArrowUp` at `y=0` wraps to `y=7` (top of screen),
   `ArrowDown` at `y=7` wraps to `y=0`.
2. **Direct unit tests**: Test 9/10 call `shiftVertical` directly and assert the
   class's internal convention (`dy>0 → y+1`); they are unaffected because they
   do not go through `Game.processInput`.
