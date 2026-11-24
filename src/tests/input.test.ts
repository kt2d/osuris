// ===========================================================================
// Component tests: InputManager key-to-action mapping, poll/reset semantics.
// Verbatim split from src/main.ts (TASK-042). Tests 17-22. The `actions`
// scratch variable is declared at the top of this file (DEC-042-7).
// ===========================================================================

import { assert, section } from './harness.js';
import { MockCanvas } from './mocks.js';
import { InputManager, type InputAction } from '../InputManager.js';

// ===========================================================================
// Test 17: InputManager key-to-action mapping
// ===========================================================================

section('Test 17: InputManager key-to-action mapping');

const testCanvas = new MockCanvas();
const inputManager = new InputManager(testCanvas as unknown as HTMLCanvasElement);

// Initially no pending actions
let actions = inputManager.poll();
assert(actions.size === 0, 'poll() returns empty set when no keys pressed');

// Space -> ROTATE
testCanvas.dispatchKey('Space');
actions = inputManager.poll();
assert(actions.has('ROTATE'), 'Space triggers ROTATE action');
assert(actions.size === 1, 'Only one action from single key press');

// ArrowUp -> WALL_UP
testCanvas.dispatchKey('ArrowUp');
actions = inputManager.poll();
assert(actions.has('WALL_UP'), 'ArrowUp triggers WALL_UP action');
assert(actions.size === 1, 'Only one action from single key press');

// ArrowDown -> WALL_DOWN
testCanvas.dispatchKey('ArrowDown');
actions = inputManager.poll();
assert(actions.has('WALL_DOWN'), 'ArrowDown triggers WALL_DOWN action');
assert(actions.size === 1, 'Only one action from single key press');
// ===========================================================================
// Test 18: InputManager poll clears state (idempotent)
// ===========================================================================

section('Test 18: InputManager poll clears state (idempotent)');

// After poll, subsequent poll should return empty
actions = inputManager.poll();
assert(actions.size === 0, 'poll() returns empty set after state cleared');

// Press a key, poll once, then poll again
testCanvas.dispatchKey('Space');
actions = inputManager.poll();
assert(actions.has('ROTATE'), 'First poll returns ROTATE');
actions = inputManager.poll();
assert(actions.size === 0, 'Second poll returns empty (state cleared)');
// ===========================================================================
// Test 19: InputManager multiple keys in one frame
// ===========================================================================

section('Test 19: InputManager multiple keys in one frame');

// Press multiple keys before polling
testCanvas.dispatchKey('Space');
testCanvas.dispatchKey('ArrowUp');
actions = inputManager.poll();
assert(actions.has('ROTATE'), 'Multiple keys: ROTATE present');
assert(actions.has('WALL_UP'), 'Multiple keys: WALL_UP present');
assert(actions.size === 2, 'Multiple keys: exactly 2 actions');

// All three keys
testCanvas.dispatchKey('Space');
testCanvas.dispatchKey('ArrowUp');
testCanvas.dispatchKey('ArrowDown');
actions = inputManager.poll();
assert(actions.has('ROTATE'), 'Three keys: ROTATE present');
assert(actions.has('WALL_UP'), 'Three keys: WALL_UP present');
assert(actions.has('WALL_DOWN'), 'Three keys: WALL_DOWN present');
assert(actions.size === 3, 'Three keys: exactly 3 actions');
// ===========================================================================
// Test 20: InputManager unknown keys are ignored
// ===========================================================================

section('Test 20: InputManager unknown keys are ignored');

testCanvas.dispatchKey('KeyA');
testCanvas.dispatchKey('Tab');
testCanvas.dispatchKey('Escape');
actions = inputManager.poll();
assert(actions.size === 0, 'Unknown keys produce no actions');

// Unknown key mixed with known key
testCanvas.dispatchKey('KeyZ');
testCanvas.dispatchKey('Space');
testCanvas.dispatchKey('Escape');
actions = inputManager.poll();
assert(actions.has('ROTATE'), 'Known key among unknown keys still triggers action');
assert(actions.size === 1, 'Only the known key produces an action');
// ===========================================================================
// Test 21: InputManager reset clears all pending input
// ===========================================================================

section('Test 21: InputManager reset clears all pending input');

testCanvas.dispatchKey('Space');
testCanvas.dispatchKey('ArrowDown');
inputManager.reset();
actions = inputManager.poll();
assert(actions.size === 0, 'reset() clears all pending input');

// After reset, new key presses still work
testCanvas.dispatchKey('ArrowUp');
actions = inputManager.poll();
assert(actions.has('WALL_UP'), 'Key presses after reset still work');
// ===========================================================================
// Test 22: InputManager no input flooding (deduplication)
// ===========================================================================

section('Test 22: InputManager no input flooding (deduplication)');

// Same key pressed multiple times should only produce one action
testCanvas.dispatchKey('Space');
testCanvas.dispatchKey('Space');
testCanvas.dispatchKey('Space');
actions = inputManager.poll();
assert(actions.size === 1, 'Same key pressed 3 times produces only 1 action');
assert(actions.has('ROTATE'), 'The action is ROTATE');