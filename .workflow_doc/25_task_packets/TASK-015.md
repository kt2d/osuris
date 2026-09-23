# Task Packet

TASK-ID: TASK-015

Title: Add Restart Mechanism

Priority: High

Dependencies: None

---

# Objective

Allow players to restart the game from GAME_OVER state using keyboard input. The restart is triggered by pressing Enter, and the game over screen displays the restart instruction.

---

# Business Context

Risk-003 documents that once the game reaches GAME_OVER state, there is no way to restart. The player must refresh the browser page. This is a poor user experience that prevents players from playing multiple games in a single session. Adding a restart mechanism makes the game self-contained and re-playable.

---

# Scope

## In Scope

### Target

- `src/InputManager.ts` - Add 'Enter' key mapping to 'RESTART' action
- `src/Game.ts` - Handle RESTART action in GAME_OVER state; call start() to restart
- `src/Renderer.ts` - Display "Press Enter to restart" in game over screen
- `src/main.ts` - Add test for restart mechanism

## Out of Scope

- Confirmation dialog before restart
- Multiple restart keys (Enter only)
- Restart from states other than GAME_OVER
- Score persistence across restarts

---

# Constraints

## D-015-1: Enter Key for Restart

Priority: Required

Description: Map the Enter key (code: 'Enter') to a 'RESTART' action in InputManager. This is the standard "confirm" key and is natural for restart.

Rationale: Enter is universally recognized as a confirmation/action key. It's distinct from gameplay keys (Space, ArrowUp, ArrowDown) and won't be pressed accidentally during gameplay.

## D-015-2: Restart Only in GAME_OVER

Priority: Required

Description: The restart action is only processed when the game is in GAME_OVER state. During PLAYING or COMPRESSING states, Enter is ignored.

Rationale: Restarting during active gameplay would be disruptive and unexpected. Players should only restart when the game is over.

## D-015-3: Full State Reset on Restart

Priority: Required

Description: Restart calls Game.start() which already handles full state reset: field.clear(), leftWall.setPosition(0), rightWall.setY(0), inputManager.reset(), and spawns a new piece.

Rationale: Reusing start() ensures consistent reset behavior. No additional reset logic is needed.

## D-015-4: Game Loop Restart

Priority: Required

Description: When restarting from GAME_OVER, the game loop must resume. Game.start() calls gameLoop() which schedules a new animation frame.

Rationale: The game loop was stopped in GAME_OVER state (TASK-013 fix). Restart must resume the loop.

---

# Implementation Notes

## Current Code (InputManager.ts)

The InputManager uses a Map to convert key codes to actions:

```typescript
private readonly KEY_TO_ACTION = new Map<string, string>([
    ['Space', 'ROTATE'],
    ['ArrowUp', 'WALL_UP'],
    ['ArrowDown', 'WALL_DOWN'],
]);
```

## Required Change (InputManager.ts)

Add Enter key mapping:

```typescript
private readonly KEY_TO_ACTION = new Map<string, string>([
    ['Space', 'ROTATE'],
    ['ArrowUp', 'WALL_UP'],
    ['ArrowDown', 'WALL_DOWN'],
    ['Enter', 'RESTART'],
]);
```

## Current Code (Game.ts processInput)

```typescript
private processInput(): void {
    if (this.state !== 'PLAYING') return;

    const actions = this.inputManager.poll();

    if (actions.has('ROTATE') && this.activePiece) {
        this.activePiece.rotate();
    }

    if (actions.has('WALL_UP')) {
        this.rightWall.shiftVertical(1);
    }

    if (actions.has('WALL_DOWN')) {
        this.rightWall.shiftVertical(-1);
    }
}
```

## Required Change (Game.ts processInput)

Handle RESTART action in GAME_OVER state:

```typescript
private processInput(): void {
    const actions = this.inputManager.poll();

    if (this.state === 'PLAYING') {
        if (actions.has('ROTATE') && this.activePiece) {
            this.activePiece.rotate();
        }

        if (actions.has('WALL_UP')) {
            this.rightWall.shiftVertical(1);
        }

        if (actions.has('WALL_DOWN')) {
            this.rightWall.shiftVertical(-1);
        }
    } else if (this.state === 'GAME_OVER') {
        if (actions.has('RESTART')) {
            this.start();
        }
    }
}
```

Note: The `if (this.state !== 'PLAYING') return;` guard is removed to allow input processing in GAME_OVER state. The COMPRESSING state doesn't need input handling.

## Current Code (Renderer.ts drawGameOver)

```typescript
this.ctx.fillText('GAME OVER', w / 2, h / 2 - cs);
this.ctx.fillText(`Final Density: ${score}%`, w / 2, h / 2 + cs);
```

## Required Change (Renderer.ts drawGameOver)

Add restart instruction:

```typescript
this.ctx.fillText('GAME OVER', w / 2, h / 2 - cs);
this.ctx.fillText(`Final Density: ${score}%`, w / 2, h / 2 + cs);

// Restart instruction
this.ctx.font = `${Math.floor(cs * 0.5)}px monospace`;
this.ctx.fillText('Press Enter to restart', w / 2, h / 2 + cs * 2.5);
```

## Test Strategy

Add a new test that:
1. Creates a game and lets it reach GAME_OVER state
2. Simulates Enter key press via InputManager
3. Verifies game transitions back to PLAYING state
4. Verifies a new piece is spawned after restart

## Key Points

- The game loop is stopped in GAME_OVER state (TASK-013 fix). Restart must resume it via Game.start()
- Game.start() already handles full state reset, so no additional reset logic is needed
- preventDefault is already handled for mapped keys (TASK-013 fix)

---

# Acceptance Criteria

- [ ] `npx tsc` compiles with no errors
- [ ] Enter key is mapped to 'RESTART' action in InputManager
- [ ] RESTART action triggers game restart when in GAME_OVER state
- [ ] RESTART action is ignored during PLAYING and COMPRESSING states
- [ ] Game over screen displays "Press Enter to restart" instruction
- [ ] After restart, game is in PLAYING state with a new piece
- [ ] New test added for restart mechanism
- [ ] All 257 existing tests pass

---

# Deliverables

- Modified: `src/InputManager.ts` (Enter key mapping)
- Modified: `src/Game.ts` (restart handling in processInput)
- Modified: `src/Renderer.ts` (restart instruction in game over screen)
- Modified: `src/main.ts` (new test for restart mechanism)
- Tests: All tests pass (257 existing + new restart test)

---

# References

- Project State Risk-003: No Restart Mechanism
- TASK-013: Fix Low-Severity Findings (game loop stopped in GAME_OVER)
- TASK-004: Input Handling & Control (InputManager architecture)

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
