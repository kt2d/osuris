# Task Packet

TASK-ID: TASK-004

Title: Input Handling & Control

Priority: High

Dependencies: TASK-003-FIX

---

# Objective

Implement `InputManager` that captures keyboard events and translates them into game actions: piece rotation and Right Wall vertical movement.

---

# Business Context

The player interacts with the game through keyboard input. Without input handling, the game is unplayable. The InputManager serves as the bridge between raw keyboard events and game logic, ensuring inputs are processed correctly and consistently.

---

# Scope

## In Scope

### Target

- New file: `src/InputManager.ts` - InputManager class
- Modified: `src/main.ts` - Add tests for InputManager

## Out of Scope

- Mouse/touch input
- Configurable key bindings (hardcoded for MVP)
- Input buffering or queuing
- Gamepad support

---

# Constraints

## D-004-1: Key Mapping

Priority: Required

Description: Keys are mapped as follows:

| Key | Action |
|-----|--------|
| Space | Rotate Active Piece 90° CW |
| Arrow Up | Shift Right Wall up 1 cell |
| Arrow Down | Shift Right Wall down 1 cell |

Rationale: Simple, intuitive mapping. Space is a natural rotation key. Arrow keys for vertical movement.

---

## D-004-2: Input Processing Model

Priority: Required

Description: InputManager uses a poll-based model. It records key press state and provides a `poll()` method that returns pending actions. Actions are cleared after polling.

Rationale: Poll-based input avoids race conditions with the game loop and ensures one action per frame per key.

---

## D-004-3: No Input Flooding

Priority: Required

Description: Each key can trigger at most one action per poll cycle. Key repeat events do not cause multiple actions.

Rationale: Prevents input flooding from keyboard auto-repeat.

---

# Implementation Notes

## Class Design

```typescript
export type InputAction = 'ROTATE' | 'WALL_UP' | 'WALL_DOWN';

export class InputManager {
  constructor(canvas: HTMLCanvasElement);
  
  poll(): Set<InputAction>;
  reset(): void;
}
```

## Behavior

1. `constructor(canvas)`: Attaches `keydown` event listener to the canvas element. Records which keys were pressed.
2. `poll()`: Maps pressed keys to InputAction values. Returns a Set of actions. Clears the pressed state after polling.
3. `reset()`: Clears all pending input state.

## Key-to-Action Mapping

```
Space (code = "Space") -> 'ROTATE'
ArrowUp (code = "ArrowUp") -> 'WALL_UP'
ArrowDown (code = "ArrowDown") -> 'WALL_DOWN'
```

## Test Strategy

Tests should verify:
- Key press records the correct action
- Multiple key presses in one frame return multiple actions
- poll() clears the state (subsequent poll returns empty)
- Unknown keys are ignored
- reset() clears all state

---

# Acceptance Criteria

- [ ] `InputManager` class exists in `src/InputManager.ts`
- [ ] Space key triggers 'ROTATE' action
- [ ] Arrow Up key triggers 'WALL_UP' action
- [ ] Arrow Down key triggers 'WALL_DOWN' action
- [ ] `poll()` returns a Set of InputAction values
- [ ] `poll()` clears input state after returning (idempotent)
- [ ] `reset()` clears all pending input
- [ ] Unknown keys are ignored
- [ ] `npx tsc` compiles with no errors
- [ ] All tests pass (existing + new InputManager tests)

---

# Deliverables

- New: `src/InputManager.ts`
- Modified: `src/main.ts` (added tests)

---

# References

- `game-design.md` - Operation section: rotation key, wall up/down keys
- `10_plan.md` - D-004 Input Debouncing

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
