// ===========================================================================
// Component tests: Game state machine, full-flow integration, restart, wall
// contact. Verbatim split from src/main.ts (TASK-042). Tests 1, 34, 36, 42,
// 43, 44, 45, 46, 64. Section order and assertions unchanged.
// ===========================================================================

import { assert, section } from './harness.js';
import { TestLeftWall, MockCanvas, MockGameCanvas, gameTick, gameTicks, rafCallbacks, shapeToKey, shapesEqual } from './mocks.js';
import { Field } from '../Field.js';
import { ActivePiece } from '../ActivePiece.js';
import { LeftWall } from '../LeftWall.js';
import { RightWall } from '../RightWall.js';
import { CompressionSystem } from '../CompressionSystem.js';
import { InputManager, type InputAction } from '../InputManager.js';
import { Renderer } from '../Renderer.js';
import { Game, type GameState } from '../Game.js';
import { EffectSystem } from '../EffectSystem.js';

// Module-scope scratch variable used by the InputManager-driven tests in this
// file (Test 45). Declared at the top per DEC-042-7 / F-IT9-07.
let actions: Set<InputAction>;

// ===========================================================================
// Test 1: Seven distinct Tetrimino shapes
// ===========================================================================

section('Test 1: Seven distinct Tetrimino shapes');

const I_SHAPE = ActivePiece.getBaseShape(0);
const O_SHAPE = ActivePiece.getBaseShape(1);
const T_SHAPE = ActivePiece.getBaseShape(2);
const S_SHAPE = ActivePiece.getBaseShape(3);
const Z_SHAPE = ActivePiece.getBaseShape(4);
const J_SHAPE = ActivePiece.getBaseShape(5);
const L_SHAPE = ActivePiece.getBaseShape(6);

assert(I_SHAPE.length === 4, 'I shape has 4 cells');
assert(O_SHAPE.length === 4, 'O shape has 4 cells');
assert(T_SHAPE.length === 4, 'T shape has 4 cells');
assert(S_SHAPE.length === 4, 'S shape has 4 cells');
assert(Z_SHAPE.length === 4, 'Z shape has 4 cells');
assert(J_SHAPE.length === 4, 'J shape has 4 cells');
assert(L_SHAPE.length === 4, 'L shape has 4 cells');

// I piece shape at rotation 0
assert(I_SHAPE[0].x === 0 && I_SHAPE[0].y === 0, 'I shape cell 0 at (0,0)');
assert(I_SHAPE[1].x === 1 && I_SHAPE[1].y === 0, 'I shape cell 1 at (1,0)');
assert(I_SHAPE[2].x === 2 && I_SHAPE[2].y === 0, 'I shape cell 2 at (2,0)');
assert(I_SHAPE[3].x === 3 && I_SHAPE[3].y === 0, 'I shape cell 3 at (3,0)');

// O piece shape at rotation 0
assert(O_SHAPE[0].x === 0 && O_SHAPE[0].y === 0, 'O shape cell 0 at (0,0)');
assert(O_SHAPE[1].x === 1 && O_SHAPE[1].y === 0, 'O shape cell 1 at (1,0)');
assert(O_SHAPE[2].x === 0 && O_SHAPE[2].y === 1, 'O shape cell 2 at (0,1)');
assert(O_SHAPE[3].x === 1 && O_SHAPE[3].y === 1, 'O shape cell 3 at (1,1)');

// All 7 shapes are distinct (compare cell sets)
const keys = [I_SHAPE, O_SHAPE, T_SHAPE, S_SHAPE, Z_SHAPE, J_SHAPE, L_SHAPE]
  .map(shapeToKey);
const uniqueKeys = new Set(keys);
assert(uniqueKeys.size === 7, 'All 7 tetromino shapes are unique');

// Invalid type returns empty shape
assert(ActivePiece.getBaseShape(-1).length === 0, 'Invalid type -1 returns empty shape');
assert(ActivePiece.getBaseShape(7).length === 0, 'Invalid type 7 returns empty shape');

// ===========================================================================
// Test 31: Game starts in PLAYING state with a spawned piece
// ===========================================================================

section('Test 31: Game starts in PLAYING state with a spawned piece');

const gameCanvas = new MockGameCanvas();
const game = new Game(gameCanvas as unknown as HTMLCanvasElement);

// Before start, game is in GAME_OVER state
assert(game.getState() === 'GAME_OVER', 'Game starts in GAME_OVER state before start()');
assert(game.getActivePiece() === null, 'No active piece before start()');

// Start the game
game.start();

// After start, game should be in PLAYING state with a spawned piece
assert(game.getState() === 'PLAYING', 'Game is in PLAYING state after start()');
assert(game.getActivePiece() !== null, 'Active piece exists after start()');
assert(game.getActivePiece()!.getType() >= 0 && game.getActivePiece()!.getType() <= 6, 'Piece type is valid (0-6)');

// TASK-025: default right wall at x=15 -> spawnX = max(2, 15-9) = 6 (was 11).
// spawnY = floor(ROWS/2) = 4 (unchanged).
assert(game.getActivePiece()!.getX() === 6, 'Default spawn position is x=6 (rightWall at x=15, TASK-025)');
assert(game.getActivePiece()!.getY() === 4, 'Spawn y position is floor(ROWS/2) = 4');

// Stop the game to prevent further loop execution
game.stop();

// TASK-025 edge cases: minimum spawn guard (spawnX >= 2).
// rightWall.x = 11 (edge case after compression) -> spawnX = max(2, 11-9) = 2.
(game.getRightWall() as any).x = 11;
(game as any).spawnPiece();
assert(game.getActivePiece() !== null, 'Piece spawns when rightWall at x=11');
assert(game.getActivePiece()!.getX() === 2, 'Spawn at x=2 when rightWall at x=11 (minimum)');

// rightWall.x = 10 -> spawnX = max(2, 10-9) = max(2, 1) = 2 (guard clamps).
(game.getRightWall() as any).x = 10;
(game as any).spawnPiece();
assert(game.getActivePiece() !== null, 'Piece spawns when rightWall at x=10');
assert(game.getActivePiece()!.getX() === 2, 'Spawn at x=2 when rightWall at x=10 (minimum guard clamps 1 to 2)');

// Restore the right wall to its default x for subsequent tests.
(game.getRightWall() as any).x = 15;

// ===========================================================================
// Test 32: Left Wall advances during PLAYING state
// ===========================================================================

section('Test 32: Left Wall advances during PLAYING state');

const game2Canvas = new MockGameCanvas();
const game2 = new Game(game2Canvas as unknown as HTMLCanvasElement);

// Use a subclass of LeftWall that we can control for deterministic testing
// Since we can't easily replace the internal LeftWall, we test by checking
// that tick() is called during game loop frames

game2.start();
const initialWallX = game2.getLeftWall().getX();

// Run several frames - wall should advance based on time
// (real time will pass, so wall should advance at least once)
gameTicks(10);
const wallXAfterTicks = game2.getLeftWall().getX();
assert(wallXAfterTicks >= initialWallX, `Left wall advanced from x=${initialWallX} to x=${wallXAfterTicks}`);

game2.stop();

// ===========================================================================
// Test 33: Player can rotate the active piece via input
// ===========================================================================

section('Test 33: Player can rotate the active piece via input');

const game3Canvas = new MockGameCanvas();
const game3 = new Game(game3Canvas as unknown as HTMLCanvasElement);

game3.start();
const gamePiece3 = game3.getActivePiece();
assert(gamePiece3 !== null, 'Active piece exists for rotation test');
if (!gamePiece3) throw new Error('No piece for rotation test');
const initialRotation = gamePiece3.getRotation();

// Simulate Space key press (ROTATE action)
(game3Canvas as MockGameCanvas).dispatchKey('Space');

// Run one frame to process input
gameTick();

const newRotation = gamePiece3.getRotation();
assert(
  newRotation === ((initialRotation + 1) % 4),
  `Piece rotated from ${initialRotation} to ${newRotation}`
);

game3.stop();

// ===========================================================================
// Test 34: Player can shift the Right Wall vertically via input
// ===========================================================================

section('Test 34: Player can shift the Right Wall vertically via input');

const game4Canvas = new MockGameCanvas();
const game4 = new Game(game4Canvas as unknown as HTMLCanvasElement);

game4.start();
const rw4 = game4.getRightWall();
const initialY = rw4.getY();

// Shift wall up via ArrowUp (smaller y = up on screen)
(game4Canvas as MockGameCanvas).dispatchKey('ArrowUp');
gameTick();
assert(rw4.getY() === (initialY - 1 + Field.ROWS) % Field.ROWS, 'Right wall shifts UP (smaller y) by ArrowUp');

// Shift wall down via ArrowDown (larger y = down on screen)
const yAfterUp = rw4.getY();
(game4Canvas as MockGameCanvas).dispatchKey('ArrowDown');
gameTick();
assert(rw4.getY() === (yAfterUp + 1) % Field.ROWS, 'Right wall shifts DOWN (larger y) by ArrowDown');

game4.stop();

// ===========================================================================
// Test 35: Compression triggers when Left Wall reaches Right Wall
// ===========================================================================

section('Test 35: Compression triggers when Left Wall reaches Right Wall');

const game5Canvas = new MockGameCanvas();
const game5 = new Game(game5Canvas as unknown as HTMLCanvasElement);

// Verify shouldCompress works correctly
assert(
  game5.getCompressionSystem().shouldCompress(Field.COLS - 2) === true,
  'Compression should trigger when walls are within threshold'
);

// Start the game, then immediately stop to prevent auto-ticks
game5.start();
game5.stop();

// Now force the left wall to compression threshold
game5.getLeftWall().setPosition(Field.COLS - 2);

// Restart game loop (start resets walls, so we need to re-set after)
game5.start();
game5.getLeftWall().setPosition(Field.COLS - 2);

// Run one frame: PLAYING state detects compression -> COMPRESSING
gameTick();
assert(game5.getState() === 'COMPRESSING', 'Game transitions to COMPRESSING when walls meet');

// Next frame: compression runs on empty field -> succeeds -> PLAYING
gameTick();
assert(
  game5.getState() === 'PLAYING' || game5.getState() === 'GAME_OVER',
  `After compression, game is in ${game5.getState()}`
);

game5.stop();

// ===========================================================================
// Test 36: After compression, Left Wall resets and new piece spawns
// ===========================================================================

section('Test 36: After compression, Left Wall resets and new piece spawns');

const game7Canvas = new MockGameCanvas();
const game7 = new Game(game7Canvas as unknown as HTMLCanvasElement);

// Start the game, place blocks, then force compression
game7.start();
game7.stop();

// Place some blocks on the field (not full, so compression succeeds)
game7.getField().set(5, 4, true);
game7.getField().set(6, 4, true);

// Restart and force wall to compression threshold
game7.start();
game7.getLeftWall().setPosition(Field.COLS - 2);

// Run frames
gameTick(); // Enters COMPRESSING
gameTick(); // Compression runs, should succeed -> PLAYING or GAME_OVER

// After compression, the game may be in PLAYING (spawn succeeded) or
// GAME_OVER (spawn collision detected, which is correct behavior per TASK-014).
// The left wall should always reset regardless of spawn outcome.
assert(
  game7.getState() === 'PLAYING' || game7.getState() === 'GAME_OVER',
  `After compression, game is in ${game7.getState()} (PLAYING or GAME_OVER expected)`
);
assert(game7.getLeftWall().getX() === 0, 'Left wall reset to x=0 after compression');

// If PLAYING: verify piece spawned successfully
if (game7.getState() === 'PLAYING') {
  assert(game7.getActivePiece() !== null, 'New piece spawned after compression');
}
// If GAME_OVER: spawn collision was detected (valid per TASK-014 fix)
// The active piece should be null since spawn failed
if (game7.getState() === 'GAME_OVER') {
  assert(game7.getActivePiece() === null, 'No piece spawned due to spawn collision');
}

game7.stop();

// ===========================================================================
// Test 37: Game transitions to GAME_OVER when piece cannot spawn
// ===========================================================================

section('Test 37: Game transitions to GAME_OVER when piece cannot spawn');

const game8Canvas = new MockGameCanvas();
const game8 = new Game(game8Canvas as unknown as HTMLCanvasElement);

// Start the game, then fill the field completely so compression fails
game8.start();

// Fill the field completely (overwriting the active piece cells too)
// so that compress() returns false (field is full)
for (let y = 0; y < Field.ROWS; y++) {
  for (let x = 0; x < Field.COLS; x++) {
    game8.getField().set(x, y, true);
  }
}

// Force wall to compression threshold
game8.getLeftWall().setPosition(Field.COLS - 2);

// Run frames
gameTick(); // Enters COMPRESSING
gameTick(); // Compression runs on full field -> should fail -> GAME_OVER

assert(game8.getState() === 'GAME_OVER', 'Game transitions to GAME_OVER when field is full');

game8.stop();

game8.stop();

// ===========================================================================
// Test 38: Score reflects block density as percentage
// ===========================================================================

section('Test 38: Score reflects block density as percentage');

const game9Canvas = new MockGameCanvas();
const game9 = new Game(game9Canvas as unknown as HTMLCanvasElement);

game9.start();
game9.stop();

// Empty field: 0% density
assert(game9.getScore() === 0, 'Empty field has 0% density');

// Place some blocks: 128 total cells, place 12.8 blocks for exactly 10%
// 128 * 0.10 = 12.8, so 13 blocks ~= 10%
for (let i = 0; i < 13; i++) {
  game9.getField().set(i % Field.COLS, Math.floor(i / Field.COLS), true);
}
const score13 = game9.getScore();
assert(score13 >= 9 && score13 <= 11, `13 blocks gives ~10% density (got ${score13}%)`);

// Fill entire field: 100% density
for (let y = 0; y < Field.ROWS; y++) {
  for (let x = 0; x < Field.COLS; x++) {
    game9.getField().set(x, y, true);
  }
}
assert(game9.getScore() === 100, 'Full field has 100% density');

// ===========================================================================
// Test 39: Renderer is called each frame
// ===========================================================================

section('Test 39: Renderer is called each frame');

const game10Canvas = new MockGameCanvas();
const game10 = new Game(game10Canvas as unknown as HTMLCanvasElement);

// Track render calls by checking canvas dimensions after each tick
let renderCallCount = 0;
const origWidth = game10Canvas.width;

game10.start();

// Run 3 frames
gameTick();
if (game10Canvas.width > 0) renderCallCount++;
gameTick();
if (game10Canvas.width > 0) renderCallCount++;
gameTick();
if (game10Canvas.width > 0) renderCallCount++;

assert(renderCallCount >= 3, `Renderer was called at least 3 times (got ${renderCallCount})`);

game10.stop();

// ===========================================================================
// Test 40: Game stop cancels animation frame
// ===========================================================================

section('Test 40: Game stop cancels animation frame');

const game11Canvas = new MockGameCanvas();
const game11 = new Game(game11Canvas as unknown as HTMLCanvasElement);

game11.start();
assert(rafCallbacks.length > 0, 'Game loop registers animation frame callback');

game11.stop();
assert(rafCallbacks.length === 0, 'Game stop clears animation frame callbacks');

// After stop, no more frames should be scheduled
gameTick();
assert(rafCallbacks.length === 0, 'No callbacks after stop');

// ===========================================================================
// Test 42: Multiple consecutive compression cycles (Integration)
// ===========================================================================
//
// Verifies that the Game state machine correctly handles multiple
// consecutive compression cycles: each cycle transitions from
// PLAYING -> COMPRESSING -> PLAYING, with left wall reset and new
// piece spawn after each cycle.

section('Test 42: Multiple consecutive compression cycles (Integration)');

const game42Canvas = new MockGameCanvas();
const game42 = new Game(game42Canvas as unknown as HTMLCanvasElement);

// --- First compression cycle ---
game42.start();
game42.stop();
// Force left wall to compression threshold
game42.getLeftWall().setPosition(Field.COLS - 2);

// Restart (resets field, spawns piece, resets wall) then re-position wall
game42.start();
game42.getLeftWall().setPosition(Field.COLS - 2);

// Frame 1: PLAYING -> COMPRESSING (walls within threshold)
gameTick();
assert(game42.getState() === 'COMPRESSING', 'First cycle: PLAYING -> COMPRESSING');

// Frame 2: COMPRESSING -> PLAYING or GAME_OVER
// After compression, spawnPiece may succeed (PLAYING) or fail due to spawn
// collision (GAME_OVER). Both are valid outcomes per TASK-014.
gameTick();
assert(
  game42.getState() === 'PLAYING' || game42.getState() === 'GAME_OVER',
  `First cycle: state is ${game42.getState()} (PLAYING or GAME_OVER expected)`
);
assert(game42.getLeftWall().getX() === 0, 'First cycle: left wall reset to x=0');

if (game42.getState() === 'PLAYING') {
  assert(game42.getActivePiece() !== null, 'First cycle: new piece spawned after compression');
}

const blocksAfterFirstCycle = game42.getField().countBlocks();
assert(blocksAfterFirstCycle >= 0, `First cycle: ${blocksAfterFirstCycle} blocks on field`);

// --- Second compression cycle ---
// Only run if the game is still playing (not GAME_OVER from spawn collision)
if (game42.getState() === 'PLAYING') {
  game42.getLeftWall().setPosition(Field.COLS - 2);

  // Frame 3: PLAYING -> COMPRESSING
  gameTick();
  assert(game42.getState() === 'COMPRESSING', 'Second cycle: PLAYING -> COMPRESSING');

  // Frame 4: COMPRESSING -> PLAYING (or GAME_OVER if field is full or spawn blocked)
  gameTick();
  const secondCycleState = game42.getState();
  assert(
    secondCycleState === 'PLAYING' || secondCycleState === 'GAME_OVER',
    `Second cycle: state is ${secondCycleState} (PLAYING or GAME_OVER expected)`
  );

  if (secondCycleState === 'PLAYING') {
    assert(game42.getActivePiece() !== null, 'Second cycle: new piece spawned');
    // Since TASK-023, every no-movement path resets the left wall to x=0
    // (the pre-TASK-023 alignment-only path that left the wall at threshold
    // no longer exists).
    const secondWallX = game42.getLeftWall().getX();
    assert(
      secondWallX === 0,
      `Second cycle: left wall reset to x=${secondWallX} after compression`
    );
  }

  // --- Third compression cycle (verify game does not degrade) ---
  if (game42.getState() === 'PLAYING') {
    game42.getLeftWall().setPosition(Field.COLS - 2);

    gameTick(); // COMPRESSING
    gameTick(); // PLAYING or GAME_OVER

    assert(
      game42.getState() === 'PLAYING' || game42.getState() === 'GAME_OVER',
      `Third cycle: state is ${game42.getState()} (game handles multiple cycles)`
    );
  }
}

game42.stop();

// ===========================================================================
// Test 43: Spawn collision with occupied cells (Integration)
// ===========================================================================
//
// Verifies that Game.spawnPiece() validates against occupied cells on
// the field. If the spawn position overlaps with existing fixed blocks,
// spawnPiece returns false and the game transitions to GAME_OVER.
//
// The spawn position is (spawnX, spawnY) = (max(2, rightWall.x - 9),
// floor(ROWS/2)) = (6, 4) since TASK-025 (was (11, 4)). An I-piece
// (type 0) at (6, 4) occupies (6,4), (7,4), (8,4), (9,4).
// The 1x4 row of blocks at (6..9, 4) overlaps at least one cell of
// every tetromino type at this spawn position, so the blocked-spawn
// assertion below is deterministic regardless of the random piece type.

section('Test 43: Spawn collision with occupied cells (Integration)');

// --- Part A: Blocked spawn triggers GAME_OVER ---
const game43Canvas = new MockGameCanvas();
const game43 = new Game(game43Canvas as unknown as HTMLCanvasElement);

// Start and stop to initialize the game
game43.start();
game43.stop();

// Fill the spawn area with blocks.
// spawnX = max(2, 15-9) = 6, spawnY = floor(8/2) = 4
// An I-piece at (6, 4) occupies (6,4), (7,4), (8,4), (9,4)
game43.getField().set(6, 4, true);
game43.getField().set(7, 4, true);
game43.getField().set(8, 4, true);
game43.getField().set(9, 4, true);

assert(game43.getField().countBlocks() === 4, 'Spawn area has 4 occupied cells');

// spawnPiece() now validates against occupied cells (Risk-002 fix).
// If any piece cell overlaps with an occupied cell, spawn fails.
const spawned43 = (game43 as any).spawnPiece();
assert(spawned43 === false, 'spawnPiece returns false when spawn position is blocked');
assert(game43.getActivePiece() === null, 'No piece spawned when spawn position is blocked');
assert(game43.getState() === 'GAME_OVER', 'Game transitions to GAME_OVER when spawn is blocked');

// --- Part B: Clear spawn preserves existing behavior ---
const game43bCanvas = new MockGameCanvas();
const game43b = new Game(game43bCanvas as unknown as HTMLCanvasElement);

// Start with a clean field (no blocks in spawn area)
game43b.start();
game43b.stop();

// Clear any active piece and try spawning again on a clean field
(game43b as any).activePiece = null;
const spawned43b = (game43b as any).spawnPiece();
assert(spawned43b === true, 'spawnPiece returns true when spawn position is clear');
assert(game43b.getActivePiece() !== null, 'Piece spawns normally when spawn position is clear');
assert(game43b.getState() !== 'GAME_OVER', 'Game remains in PLAYING state when spawn succeeds');

// ===========================================================================
// Test 44: Restart mechanism (GAME_OVER -> PLAYING via Enter key)
// ===========================================================================
//
// Verifies that pressing Enter in GAME_OVER state restarts the game.
// The game transitions from GAME_OVER to PLAYING, the field is cleared,
// and a new piece is spawned.

section('Test 44: Restart mechanism (GAME_OVER -> PLAYING via Enter key)');

const game44Canvas = new MockGameCanvas();
const game44 = new Game(game44Canvas as unknown as HTMLCanvasElement);

// Start the game (clears field, spawns piece, starts loop)
game44.start();

// Fill the field completely to force GAME_OVER on next compression.
// The active piece is not yet on the field, so all cells are freely settable.
for (let y = 0; y < Field.ROWS; y++) {
  for (let x = 0; x < Field.COLS; x++) {
    game44.getField().set(x, y, true);
  }
}
assert(game44.getField().countBlocks() === Field.COLS * Field.ROWS, 'Field is full before compression');

// Force wall to compression threshold
game44.getLeftWall().setPosition(Field.COLS - 2);

// Frame 1: PLAYING -> COMPRESSING (walls within threshold)
gameTick();
assert(game44.getState() === 'COMPRESSING', 'Game enters COMPRESSING before GAME_OVER');

// Frame 2: COMPRESSING -> GAME_OVER (field is full, compression fails)
gameTick();
assert(game44.getState() === 'GAME_OVER', 'Game transitions to GAME_OVER when field is full');

// Verify game over state
assert(game44.getActivePiece() === null, 'No active piece in GAME_OVER');
// After full-field compression failure, the field state is restored by compress().
// The field remains full (all cells occupied).
assert(game44.getField().countBlocks() === Field.COLS * Field.ROWS, 'Field is still full after compression failure');

// Enter key in GAME_OVER should trigger restart.
// Clear the field first so that spawnPiece() can succeed after restart.
game44.getField().clear();

// Dispatch Enter key (RESTART action)
(game44Canvas as MockGameCanvas).dispatchKey('Enter');

// Run one frame to process input (GAME_OVER state processes input for restart)
gameTick();

// After restart, game should be in PLAYING state
assert(game44.getState() === 'PLAYING', 'Game transitions to PLAYING after restart');
assert(game44.getActivePiece() !== null, 'New piece spawned after restart');
assert(game44.getField().countBlocks() === 0, 'Field is cleared after restart');
assert(game44.getLeftWall().getX() === 0, 'Left wall reset to x=0 after restart');

// Verify that Enter key is ignored during PLAYING state
(game44Canvas as MockGameCanvas).dispatchKey('Enter');
gameTick();
assert(game44.getState() === 'PLAYING', 'Enter key is ignored during PLAYING state');
assert(game44.getActivePiece() !== null, 'Active piece still exists after Enter in PLAYING');

game44.stop();

// ===========================================================================
// Test 45: InputManager Enter key maps to RESTART action
// ===========================================================================

section('Test 45: InputManager Enter key maps to RESTART action');

const testCanvas45 = new MockCanvas();
const inputManager45 = new InputManager(testCanvas45 as unknown as HTMLCanvasElement);

// Enter -> RESTART
testCanvas45.dispatchKey('Enter');
actions = inputManager45.poll();
assert(actions.has('RESTART'), 'Enter triggers RESTART action');
assert(actions.size === 1, 'Only one action from Enter key press');

// ===========================================================================
// Test 46: No overlapping game loops on restart (CR-IT2-003)
// ===========================================================================
//
// Verifies the TASK-020 fix: restarting from GAME_OVER via Enter must not
// leave two concurrent requestAnimationFrame loops running.
//
// Before the fix, Game.start() was invoked from inside an in-flight
// gameLoop() iteration (processInput -> RESTART -> start()). start() scheduled
// a new frame, and the in-flight iteration then scheduled yet another frame at
// the end of its call stack. Two pending callbacks => the browser runs both
// per frame => double game speed and double input processing.
//
// The rAF mock above records every scheduled callback in `rafCallbacks`, so
// the number of pending/concurrent loops is directly observable.

section('Test 46: No overlapping game loops on restart (CR-IT2-003)');

const game46Canvas = new MockGameCanvas();
const game46 = new Game(game46Canvas as unknown as HTMLCanvasElement);

/**
 * Emulate one browser frame: run every rAF callback that is pending when the
 * frame starts (a real browser executes all callbacks scheduled for the
 * frame). Callbacks scheduled during the drain remain for the next frame.
 * Returns how many callbacks ran in this frame.
 */
const runBrowserFrame = (): number => {
  const pending = rafCallbacks.length;
  const callbacks = rafCallbacks.splice(0, pending);
  for (const cb of callbacks) {
    cb();
  }
  return pending;
};

// Start the game: exactly one loop must be scheduled
game46.start();
assert(rafCallbacks.length === 1, 'Exactly one game loop scheduled after start()');

// Force GAME_OVER via full-field compression failure (setup mirrors Test 44)
for (let y = 0; y < Field.ROWS; y++) {
  for (let x = 0; x < Field.COLS; x++) {
    game46.getField().set(x, y, true);
  }
}
game46.getLeftWall().setPosition(Field.COLS - 2);

runBrowserFrame(); // Frame 1: PLAYING -> COMPRESSING
runBrowserFrame(); // Frame 2: COMPRESSING -> GAME_OVER
assert(game46.getState() === 'GAME_OVER', 'Game reaches GAME_OVER before restart');
assert(rafCallbacks.length === 1, 'Single loop still running in GAME_OVER');

// Clear the field so spawnPiece() succeeds on restart, then press Enter
game46.getField().clear();
(game46Canvas as MockGameCanvas).dispatchKey('Enter');

// Frame 3 processes RESTART and calls start() from inside the loop
const restartFrameRuns = runBrowserFrame();
assert(restartFrameRuns === 1, 'Restart frame executes exactly one loop callback');
assert(game46.getState() === 'PLAYING', 'Game restarts to PLAYING');

// Regression check (CR-IT2-003): the in-flight loop iteration that called
// start() must not schedule a second frame; exactly one loop callback may
// remain pending (before the fix this assertion finds 2).
assert(rafCallbacks.length === 1, 'Exactly one game loop pending after restart (no overlapping loops)');

// Count wall tick calls across one more frame: a single loop updates the game
// exactly once per frame (double speed would call tick twice per frame).
const wall46 = game46.getLeftWall();
const originalTick = wall46.tick;
let tickCallCount = 0;
wall46.tick = (elapsedMs: number) => {
  tickCallCount++;
  return originalTick.call(wall46, elapsedMs);
};
const nextFrameRuns = runBrowserFrame();
wall46.tick = originalTick;
assert(nextFrameRuns === 1, 'One loop callback runs per frame after restart (no double speed)');
assert(tickCallCount === 1, 'update() runs exactly once per frame after restart');

// The loop count remains stable over subsequent frames
runBrowserFrame();
runBrowserFrame();
assert(rafCallbacks.length === 1, 'Loop count stays at one over subsequent frames');

game46.stop();

// ===========================================================================
// Test 64: Full game flow — spawn -> chain push -> compression -> new spawn (TASK-029)
// ===========================================================================
//
// TASK-029 integration test: one continuous game flow that exercises every
// Iteration 6 feature end to end:
//   1. start() spawns a piece at x=6 (TASK-025)
//   2. one wall tick advances x=0 -> x=1 and chain-pushes fixed blocks
//      (1,4),(2,4),(3,4) -> (2,4),(3,4),(4,4) (TASK-026), registering the
//      pushed/connected effects (TASK-028)
//   3. the wall reaching the compression threshold transitions to COMPRESSING
//   4. compression finalizes the blocks in place (they are not adjacent to
//      the right wall, so no block moves), resets the left wall to x=0, and
//      spawns a new piece at x=6 -> PLAYING
//
// The active piece is nulled between phases so the wall only interacts with
// fixed blocks (same pattern as Test 62). Spawn safety: at rotation 0 every
// tetromino occupies x >= 6 while the blocks stay at x <= 4, so the
// post-compression spawn cannot collide regardless of the random piece type.

section('Test 64: Full game flow — spawn -> chain push -> compression -> new spawn (TASK-029)');

const gameCanvas64 = new MockGameCanvas();
const game64 = new Game(gameCanvas64 as unknown as HTMLCanvasElement);

// --- Phase 1: start() -> PLAYING with a piece at the TASK-025 spawn position ---
game64.start();
assert(game64.getState() === 'PLAYING', 'Flow: game is PLAYING after start()');
assert(game64.getActivePiece() !== null, 'Flow: first piece spawned at start()');
assert(game64.getActivePiece()!.getX() === 6, 'Flow: spawn at x=6 (rightWall at x=15, TASK-025)');

// From here on the wall interacts with fixed blocks only (Test 62 pattern).
(game64 as any).activePiece = null;

const field64 = game64.getField();
field64.set(1, 4, true);
field64.set(2, 4, true);
field64.set(3, 4, true);

const wall64 = new TestLeftWall(field64, null);
wall64.setTime(0);
wall64.setPosition(0);
(game64 as any).leftWall = wall64;
wall64.advanceMockTime(400); // 400ms >= initial interval -> the tick moves

// --- Phase 2: wall advances x=0 -> x=1 and chain-pushes the 3-block chain ---
gameTick();

assert(wall64.getX() === 1, 'Flow: wall advanced to x=1');
assert(field64.get(1, 4) === false, 'Flow: chain push vacated the original cell (1,4)');
assert(field64.get(2, 4) === true, 'Flow: pushed block now at (2,4)');
assert(field64.get(3, 4) === true, 'Flow: connected block now at (3,4)');
assert(field64.get(4, 4) === true, 'Flow: chain push moved the chain end to (4,4)');

const effects64 = game64.getEffectSystem();
assert(
  effects64.getPushedCells().some((c) => c.x === 2 && c.y === 4),
  'Flow: pushed effect registered on the wall-column block (2,4) (TASK-028)'
);
assert(
  effects64.getConnectedCells().some((c) => c.x === 3 && c.y === 4) &&
    effects64.getConnectedCells().some((c) => c.x === 4 && c.y === 4),
  'Flow: connection effects registered on the BFS-connected blocks (3,4),(4,4) (TASK-028)'
);

// --- Phase 3: wall reaches the compression threshold -> COMPRESSING ---
wall64.setPosition(Field.COLS - 2); // x=14: 15-14=1 <= threshold 1

gameTick();
assert(game64.getState() === 'COMPRESSING', 'Flow: PLAYING -> COMPRESSING when the walls meet');

// --- Phase 4: compression finalizes blocks, resets the wall, spawns a new piece ---
gameTick();
assert(game64.getState() === 'PLAYING', 'Flow: COMPRESSING -> PLAYING after compression');
assert(game64.getActivePiece() !== null, 'Flow: new piece spawned after compression');
assert(wall64.getX() === 0, 'Flow: left wall reset to x=0 after compression');
assert(
  field64.get(2, 4) === true && field64.get(3, 4) === true && field64.get(4, 4) === true,
  'Flow: chain-pushed blocks kept in place (not adjacent to the right wall)'
);
assert(field64.countBlocks() === 3, 'Flow: no block loss through the full flow');

game64.stop();
