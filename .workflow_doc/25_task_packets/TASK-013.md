# Task Packet

TASK-ID: TASK-013

Title: Fix Low-Severity Findings

Priority: Low

Dependencies: None

---

# Objective

Resolve the remaining low-severity findings from the Code Review:
- FINDING-004: Redundant Left Wall Reset in Game.updateCompressing()
- FINDING-005: InputManager Does Not preventDefault() on Arrow Keys
- FINDING-006: Game Loop Continues in GAME_OVER State
- FINDING-007: Stale Debug Files in dist/ (addressed by TASK-008)
- FINDING-008: Manual HTML Copy to dist/ (addressed by TASK-008)
- FINDING-009: Vite Dev Server Points to Tests (addressed by TASK-008)
- FINDING-010: Score Text Overlaps Grid Area

---

# Business Context

These findings are low-severity issues that do not affect gameplay but degrade code quality, developer experience, or visual polish. They are small, independent fixes that can be bundled into a single task.

Note: FINDING-007, FINDING-008, and FINDING-009 are addressed by TASK-008 (Build Process). This task focuses on FINDING-004, FINDING-005, FINDING-006, and FINDING-010.

---

# Scope

## In Scope

### Target

- `src/Game.ts` - Remove redundant setPosition(0), cancel animation frame in GAME_OVER
- `src/InputManager.ts` - Add preventDefault() for mapped keys
- `src/Renderer.ts` - Fix score text position to avoid grid overlap

## Out of Scope

- Major UI redesign
- Score text outside canvas (would require layout changes)
- Restart mechanism (Risk-003, deferred)
- Visual effects or animations

---

# Constraints

## D-013-1: Remove Redundant setPosition(0)

Priority: Required

Description: Remove the redundant `this.leftWall.setPosition(0)` call in `Game.updateCompressing()`. The reset callback already handles this.

Rationale: The callback approach is cleaner and avoids double-setting. This is a code quality improvement.

---

## D-013-2: Add preventDefault() for Mapped Keys

Priority: Required

Description: Add `event.preventDefault()` inside the keydown handler condition for mapped keys (Space, ArrowUp, ArrowDown).

Rationale: Prevents browser scrolling during gameplay, improving user experience.

---

## D-013-3: Cancel Animation Frame in GAME_OVER

Priority: Required

Description: Cancel the `requestAnimationFrame` in GAME_OVER state to stop the game loop.

Rationale: Prevents unnecessary CPU usage. The game loop should stop when the game is over.

---

## D-013-4: Fix Score Text Position

Priority: Required

Description: Draw the score text at a position that does not overlap with grid blocks. Options:
1. Draw score below the grid (outside canvas, using HTML overlay)
2. Increase canvas height to accommodate UI area
3. Draw score at the bottom of the canvas

Recommendation: Draw score at the bottom of the canvas (y = ROWS * cellSize - 20). This is the simplest fix that doesn't require layout changes.

Rationale: Score text overlapping grid blocks is visually confusing.

---

# Implementation Notes

## FINDING-004: Remove Redundant setPosition(0)

### Current Code (Game.ts:232-239)

```typescript
if (compressResult) {
    this.leftWall.setPosition(0);  // Redundant: already done by callback
    if (!this.spawnPiece()) {
        this.state = 'GAME_OVER';
        return;
    }
}
```

### Required Change

```typescript
if (compressResult) {
    if (!this.spawnPiece()) {
        this.state = 'GAME_OVER';
        return;
    }
}
```

## FINDING-005: Add preventDefault()

### Current Code (InputManager.ts:52-59)

```typescript
canvas.addEventListener('keydown', (event: KeyboardEvent) => {
    if (KEY_TO_ACTION.has(event.code)) {
        this.pressedKeys.add(event.code);
        // No preventDefault()
    }
});
```

### Required Change

```typescript
canvas.addEventListener('keydown', (event: KeyboardEvent) => {
    if (KEY_TO_ACTION.has(event.code)) {
        event.preventDefault();
        this.pressedKeys.add(event.code);
    }
});
```

## FINDING-006: Cancel Animation Frame in GAME_OVER

### Current Code (Game.ts:155-159)

```typescript
private gameLoop = (): void => {
    this.update();
    this.render();
    this.animFrameId = requestAnimationFrame(this.gameLoop);
};
```

### Required Change

```typescript
private gameLoop = (): void => {
    this.update();
    this.render();
    if (this.state !== 'GAME_OVER') {
        this.animFrameId = requestAnimationFrame(this.gameLoop);
    }
};
```

## FINDING-010: Fix Score Text Position

### Current Code (Renderer.ts:222-225)

```typescript
this.ctx.fillText(text, textX, 2);
```

### Required Change

```typescript
// Draw score at the bottom of the canvas, below the grid
const scoreY = Field.ROWS * this.cellSize - 10;
this.ctx.fillText(text, textX, scoreY);
```

Note: This moves the score from the top of the grid to the bottom. The grid area is now free of text overlap.

---

# Acceptance Criteria

- [ ] `npx tsc` compiles with no errors
- [ ] Redundant `setPosition(0)` removed from `Game.updateCompressing()`
- [ ] `preventDefault()` called for Space, ArrowUp, ArrowDown keys
- [ ] Animation frame cancelled in GAME_OVER state
- [ ] Score text drawn below the grid (no overlap)
- [ ] All 222 existing tests pass
- [ ] Game is still playable and functional

---

# Deliverables

- Modified: `src/Game.ts` (redundant setPosition, animation frame cancel)
- Modified: `src/InputManager.ts` (preventDefault)
- Modified: `src/Renderer.ts` (score text position)
- Tests: All 222 existing tests pass

---

# References

- Code Review FINDING-004: Redundant Left Wall Reset in Game.updateCompressing()
- Code Review FINDING-005: InputManager Does Not preventDefault() on Arrow Keys
- Code Review FINDING-006: Game Loop Continues in GAME_OVER State
- Code Review FINDING-010: Score Text Overlaps Grid Area
- Project State Debt-006: No preventDefault on Arrow Keys
- Project State Debt-007: Game Loop in GAME_OVER

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
