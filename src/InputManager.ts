// ===========================================================================
// InputManager
// ===========================================================================
//
// Captures keyboard events and translates them into game actions.
// Uses a poll-based model: records key presses, then poll() retrieves
// pending actions. Each key triggers at most one action per poll cycle,
// preventing input flooding from keyboard auto-repeat.
//
// Key mapping:
//   Space     -> ROTATE  (rotate active piece 90° CW)
//   ArrowUp   -> WALL_UP (shift right wall up 1 cell)
//   ArrowDown -> WALL_DOWN (shift right wall down 1 cell)
// ===========================================================================

/** Actions that can be triggered by keyboard input. */
export type InputAction = 'ROTATE' | 'WALL_UP' | 'WALL_DOWN' | 'RESTART';

/** Internal mapping from keyboard event codes to game actions. */
const KEY_TO_ACTION: ReadonlyMap<string, InputAction> = new Map([
  ['Space', 'ROTATE'],
  ['ArrowUp', 'WALL_UP'],
  ['ArrowDown', 'WALL_DOWN'],
  ['Enter', 'RESTART'],
]);

/**
 * Manages keyboard input for the game.
 *
 * Attaches a keydown listener to the provided canvas element and records
 * which mapped keys were pressed. The poll() method returns a set of
 * pending actions and clears the recorded state, ensuring each key
 * triggers at most one action per poll cycle.
 */
export class InputManager {
  /** Keys that have been pressed since the last poll. */
  private pressedKeys: Set<string>;

  /**
   * Creates an InputManager that listens for keyboard events on the given canvas.
   *
   * @param canvas - The canvas element to attach the keydown listener to.
   */
  public constructor(canvas: HTMLCanvasElement) {
    this.pressedKeys = new Set();
    this.attachListener(canvas);
  }

  /**
   * Attaches the keydown event listener to the canvas.
   * Separated for testability (allows injecting listeners in tests).
   */
  private attachListener(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('keydown', (event: KeyboardEvent) => {
      // Only record keys that map to a known action.
      // Unknown keys are silently ignored.
      if (KEY_TO_ACTION.has(event.code)) {
        event.preventDefault?.();
        this.pressedKeys.add(event.code);
      }
    });
  }

  /**
   * Returns the set of pending input actions and clears the recorded state.
   *
   * Calling poll() multiple times without new key presses returns an empty
   * Set on subsequent calls, ensuring idempotent behavior.
   *
   * @returns A Set of InputAction values representing pending actions.
   */
  public poll(): Set<InputAction> {
    const actions = new Set<InputAction>();
    for (const code of this.pressedKeys) {
      const action = KEY_TO_ACTION.get(code);
      if (action !== undefined) {
        actions.add(action);
      }
    }
    this.pressedKeys.clear();
    return actions;
  }

  /**
   * Clears all pending input state.
   * Useful for resetting input between game states (e.g., after game over).
   */
  public reset(): void {
    this.pressedKeys.clear();
  }
}
