// ===========================================================================
// Component tests: LeftWall horizontal movement, BFS chain push, dynamic
// speed, wall advancement. Verbatim split from src/main.ts (TASK-042).
// Tests 4, 5, 5b, 47-54, 56, 62, 66. Section order and assertions unchanged.
// ===========================================================================

import { assert, section } from './harness.js';
import { TestLeftWall, TestGame, MockGameCanvas, MockRenderContext, gameTick, gameTicks, rafCallbacks } from './mocks.js';
import { Field } from '../Field.js';
import { ActivePiece } from '../ActivePiece.js';
import { LeftWall, type ChainPushResult } from '../LeftWall.js';
import { RightWall } from '../RightWall.js';
import { CompressionSystem } from '../CompressionSystem.js';
import { Game } from '../Game.js';
import { EffectSystem } from '../EffectSystem.js';

// ===========================================================================
// Test 4: LeftWall horizontal movement
// ===========================================================================

section('Test 4: LeftWall horizontal movement');

const field5 = new Field();
const piece5 = new ActivePiece(field5, 8, 4, 0); // I piece at (8,4) rot 0
const wall = new TestLeftWall(field5, piece5);

assert(wall.getX() === 0, 'LeftWall starts at x=0');
assert(wall.toString().includes('x=0'), 'LeftWall toString shows x=0');

// Move the wall manually
wall.advance();
assert(wall.getX() === 1, 'LeftWall advances to x=1');

wall.advance();
wall.advance();
wall.advance();
assert(wall.getX() === 4, 'LeftWall advances to x=4 after 3 more advances');

// Test tick-based movement (TASK-027: tick() now takes game elapsed time)
const wall2 = new TestLeftWall(field5, piece5);

// tick(elapsedMs) returns null when the wall does not move, or the
// chain-push result when it does (TASK-028). A freshly constructed wall
// cannot have elapsed the 400ms initial interval, so no movement is
// expected.
const tickResult = wall2.tick(0);
assert(tickResult === null, 'tick() returns null when the interval has not elapsed (no movement)');
assert(wall2.getX() === 0, 'Wall still at x=0 after sub-interval tick');

// Test advance-based movement for deterministic behavior
const wall3 = new TestLeftWall(field5, piece5);
wall3.advance();
assert(wall3.getX() === 1, 'Wall advances to x=1 via advance()');
wall3.advance();
wall3.advance();
assert(wall3.getX() === 3, 'Wall advances to x=3 via 2 more advance() calls');

// Test isAtRightEdge
const wallEdge = new TestLeftWall(field5, piece5);
assert(wallEdge.isAtRightEdge() === false, 'Wall not at right edge at x=0');
wallEdge.setPosition(15);
assert(wallEdge.isAtRightEdge() === true, 'Wall at right edge at x=15 (COLS-1)');
wallEdge.setPosition(14);
assert(wallEdge.isAtRightEdge() === false, 'Wall not at right edge at x=14');

// ===========================================================================
// Test 5: LeftWall hits ActivePiece (contact -> fixed block)
// ===========================================================================

section('Test 5: LeftWall hits ActivePiece (contact -> fixed block)');

const field6 = new Field();
const piece6 = new ActivePiece(field6, 0, 5, 4, 0); // I piece (type 0) at (5,4) rot 0

// I piece at (5,4) rot 0: occupies (5,4)(6,4)(7,4)(8,4)
const pieceCells6 = piece6.getOccupiedCells();
assert(pieceCells6.length === 4, 'I piece at (5,4) has 4 cells');
assert(pieceCells6[0].x === 5 && pieceCells6[0].y === 4, 'Piece cell at (5,4)');
assert(pieceCells6[3].x === 8 && pieceCells6[3].y === 4, 'Piece cell at (8,4)');

const wall6 = new TestLeftWall(field6, piece6);

// Wall at x=0: no collision (piece starts at x=5)
assert(wall6.getX() === 0, 'Wall starts at x=0');
assert(piece6.isWallHit(0) === false, 'Wall at x=0 does not hit piece at x=5');

// Advance wall to x=4 (just before piece)
wall6.setPosition(4);
assert(piece6.isWallHit(4) === false, 'Wall at x=4 does not hit piece starting at x=5');

// Wall at x=5: hits the leftmost cell of the piece
assert(piece6.isWallHit(5) === true, 'Wall at x=5 hits piece at x=5');

// Simulate contact: wall advances to piece, fixes it in place + chain push
wall6.setPosition(4);
wall6.advance(); // x=5, hits piece -> piece fixed, then chain-pushed right
assert(piece6.getX() === -100, 'Piece fixed (x=-100) after wall contact');
assert(piece6.getY() === -100, 'Piece fixed (y=-100) after wall contact');
assert(wall6.getX() === 5, 'Wall is at x=5 after advancing');

// After fix + chain push: I-piece cells at (6,4)(7,4)(8,4)(9,4)
assert(field6.get(6, 4) === true, 'Chain-pushed cell at (6,4)');
assert(field6.get(7, 4) === true, 'Chain-pushed cell at (7,4)');
assert(field6.get(8, 4) === true, 'Chain-pushed cell at (8,4)');
assert(field6.get(9, 4) === true, 'Chain-pushed cell at (9,4)');
assert(field6.countBlocks() === 4, 'Field has 4 chain-pushed blocks');

// isWallHit on cleared piece should be false
assert(piece6.isWallHit(5) === false, 'Cleared piece does not report wall hit');

// Full contact-to-fixed-block scenario: wall advances to contact position
// and the piece is fixed + chain-pushed in the same tick (no manual moveToFixed needed)
const field7 = new Field();
const piece7 = new ActivePiece(field7, 0, 5, 4, 0); // I piece at (5,4) rot 0
const wall7 = new TestLeftWall(field7, piece7);

// Advance wall to x=4 (just before piece)
wall7.setPosition(4);
// Advance one more step: wall moves to x=5, onWallAdvanced() detects contact,
// fixes the piece at (5,4)(6,4)(7,4)(8,4), then chain-pushes to (6,4)(7,4)(8,4)(9,4)
wall7.advance();
assert(piece7.getX() === -100, 'Piece fixed (x=-100) by wall contact');
assert(piece7.getY() === -100, 'Piece fixed (y=-100) by wall contact');
assert(wall7.getX() === 5, 'Wall is at x=5 after advancing');

// Verify the chain-pushed cells are at (6,4)(7,4)(8,4)(9,4)
assert(field7.get(6, 4) === true, 'Chain-pushed cell at (6,4)');
assert(field7.get(7, 4) === true, 'Chain-pushed cell at (7,4)');
assert(field7.get(8, 4) === true, 'Chain-pushed cell at (8,4)');
assert(field7.get(9, 4) === true, 'Chain-pushed cell at (9,4)');
assert(field7.countBlocks() === 4, 'Field has 4 chain-pushed blocks');

// isWallHit on cleared piece should be false
assert(piece7.isWallHit(wall7.getX()) === false, 'Cleared piece does not report wall hit');

// Also test: wall catches up to fixed blocks and advances them
const field9 = new Field();
field9.set(3, 4, true); // Place a fixed block at (3,4)
const wall9 = new TestLeftWall(field9, null); // No active piece
wall9.setPosition(2);
wall9.advance(); // x=3, hasOccupiedBlocksInColumn(3) is true, advances block to x=4
assert(wall9.getX() === 3, 'Wall advanced to x=3');
assert(field9.get(3, 4) === false, 'Block at (3,4) cleared');
assert(field9.get(4, 4) === true, 'Block moved to (4,4)');

// ===========================================================================
// Test 5b: LeftWall push blocked by occupied cell fixes piece in place
// ===========================================================================

section('Test 5b: LeftWall push blocked by occupied cell fixes piece in place');

const field6b = new Field();
// Place a fixed block one cell to the right of where the piece's leftmost
// cell will be pushed. O piece at (5,4): occupies (5,4),(6,4),(5,5),(6,5).
// When wall pushes right, target cells are (6,4),(7,4),(6,5),(7,5).
// Block (6,4) is occupied by the piece itself, so we use a different shape.
// Use O piece at (5,4): cells (5,4),(6,4),(5,5),(6,5).
// Place a fixed block at (7,4) so the push target (7,4) is occupied.
field6b.set(7, 4, true); // Blocker at (7,4) — push target for cell (6,4)

const piece6b = new ActivePiece(field6b, 1, 5, 4, 0); // O piece (type 1) at (5,4)
// O piece cells: (5,4),(6,4),(5,5),(6,5)
// Push targets: (6,4),(7,4),(6,5),(7,5)
// (7,4) is occupied -> push should be blocked

const wall6b = new TestLeftWall(field6b, piece6b);

// Wall at x=4: no contact yet
wall6b.setPosition(4);
assert(piece6b.isWallHit(4) === false, 'Wall at x=4 does not hit piece at x=5');

// Advance wall to x=5: contacts piece, attempts push
// Push targets include (7,4) which is occupied -> piece should be fixed
wall6b.advance();

// Piece should be fixed in place, not pushed
assert(piece6b.getX() === -100, 'Piece x cleared to -100 (fixed in place, not pushed)');
assert(piece6b.getY() === -100, 'Piece y cleared to -100 (fixed in place, not pushed)');

// Field has 5 blocks: 4 piece cells + 1 blocker (all chain-pushed right)
assert(field6b.countBlocks() === 5, 'Field has 5 blocks: 4 piece cells + 1 blocker');

// The blocker at (7,4) was dragged to (8,4) by the chain push
assert(field6b.get(8, 4) === true, 'Blocker moved to (8,4) by chain push');

// Piece cells after chain push: (6,4)(6,5)(7,4)(7,5)
assert(field6b.get(6, 4) === true, 'Piece cell at (6,4) after chain push');
assert(field6b.get(6, 5) === true, 'Piece cell at (6,5) after chain push');
assert(field6b.get(7, 4) === true, 'Piece cell at (7,4) after chain push');
assert(field6b.get(7, 5) === true, 'Piece cell at (7,5) after chain push');

// Contact always fixes (no "free push" case under the corrected behavior)
const field6c = new Field();
const piece6c = new ActivePiece(field6c, 0, 5, 4, 0); // I piece at (5,4)
const wall6c = new TestLeftWall(field6c, piece6c);
wall6c.setPosition(4);
wall6c.advance(); // x=5, contacts piece -> fixed + chain-pushed
assert(piece6c.getX() === -100, 'Piece fixed (x=-100) at contact');
assert(piece6c.getY() === -100, 'Piece fixed (y=-100) at contact');
assert(field6c.get(6, 4) === true, 'Chain-pushed cell at (6,4)');
assert(field6c.get(7, 4) === true, 'Chain-pushed cell at (7,4)');
assert(field6c.get(8, 4) === true, 'Chain-pushed cell at (8,4)');
assert(field6c.get(9, 4) === true, 'Chain-pushed cell at (9,4)');
assert(field6c.countBlocks() === 4, 'Field has 4 chain-pushed blocks');
// ===========================================================================
// Test 47: LeftWall BFS chain push — connected mass moves as a unit (TASK-026)
// ===========================================================================
//
// Verifies the TASK-026 chain push: when the wall advances into a column
// of fixed blocks, blocks connected to those blocks via horizontal
// adjacency (right neighbor, same row) are pulled along. A 2x2 block
// mass at (3,0), (4,0), (3,1), (4,1) with the wall advancing into x=3
// moves the entire mass one column right: (4,0), (5,0), (4,1), (5,1).

section('Test 47: LeftWall BFS chain push — connected mass moves as a unit (TASK-026)');

const field47 = new Field();
// 2x2 mass: rows 0-1, columns 3-4.
field47.set(3, 0, true);
field47.set(4, 0, true);
field47.set(3, 1, true);
field47.set(4, 1, true);
assert(field47.countBlocks() === 4, 'Field has 4 blocks before chain push');

const wall47 = new TestLeftWall(field47, null);
wall47.setPosition(2);
wall47.advance(); // x=3: wall column contains the left half of the mass

assert(wall47.getX() === 3, 'Wall advanced to x=3');
assert(field47.get(3, 0) === false, 'Block (3,0) left its old position');
assert(field47.get(3, 1) === false, 'Block (3,1) left its old position');
assert(field47.get(4, 0) === true, 'Connected block moved to (4,0)');
assert(field47.get(4, 1) === true, 'Connected block moved to (4,1)');
assert(field47.get(5, 0) === true, 'Chain block moved to (5,0)');
assert(field47.get(5, 1) === true, 'Chain block moved to (5,1)');
assert(field47.countBlocks() === 4, 'No blocks lost in chain push (4 remain)');
// ===========================================================================
// Test 48: LeftWall BFS chain push — gaps break the chain (TASK-026)
// ===========================================================================
//
// Blocks at (3,4) and (5,4) with (4,4) empty: the wall-column block (3,4)
// has no occupied right neighbor, so BFS stops immediately. The
// disconnected block at (5,4) is NOT pushed (no adjacency through the
// empty column).

section('Test 48: LeftWall BFS chain push — gaps break the chain (TASK-026)');

const field48 = new Field();
field48.set(3, 4, true);
field48.set(5, 4, true); // NOT adjacent to (3,4): (4,4) is empty
const wall48 = new TestLeftWall(field48, null);
wall48.setPosition(2);
wall48.advance(); // x=3

assert(field48.get(3, 4) === false, 'Wall-column block (3,4) moved');
assert(field48.get(4, 4) === true, 'Block pushed to (4,4)');
assert(field48.get(5, 4) === true, 'Disconnected block (5,4) stays in place (gap breaks chain)');
assert(field48.countBlocks() === 2, 'Both blocks preserved (2 remain)');
// ===========================================================================
// Test 49: LeftWall BFS chain push — atomic abort when chain is blocked (TASK-026)
// ===========================================================================
//
// A contiguous row filling columns 3..15 cannot move: the rightmost
// block at x=15 has no valid target (x=16 is outside the field). The
// push must abort atomically — NO block moves, and the return value
// reports no pushed/connected cells.

section('Test 49: LeftWall BFS chain push — atomic abort when chain is blocked (TASK-026)');

const field49 = new Field();
for (let x = 3; x <= Field.COLS - 1; x++) {
  field49.set(x, 4, true);
}
const countBefore49 = field49.countBlocks();

const wall49 = new TestLeftWall(field49, null);
wall49.setPosition(2);
wall49.advance(); // x=3: chain spans 3..15, rightmost target out of bounds -> abort

assert(wall49.getX() === 3, 'Wall advanced to x=3');
assert(field49.get(3, 4) === true, 'Leftmost block (3,4) unmoved (atomic abort)');
assert(field49.get(8, 4) === true, 'Middle block (8,4) unmoved (atomic abort)');
assert(field49.get(15, 4) === true, 'Rightmost block (15,4) unmoved (no valid target at x=16)');
assert(field49.countBlocks() === countBefore49, `No blocks lost on aborted push (${countBefore49} remain)`);

// Return value of the aborted push is empty (direct call, same field state).
const result49 = (wall49 as any).advanceOccupiedBlocksInColumn(3);
assert(result49.pushedCells.length === 0, 'Aborted push returns empty pushedCells');
assert(result49.connectedCells.length === 0, 'Aborted push returns empty connectedCells');
// ===========================================================================
// Test 50: LeftWall BFS chain push — pushed/connected return value (TASK-026)
// ===========================================================================
//
// A row of 3 blocks at (3,4), (4,4), (5,4): the wall-column block is the
// pushed cell; (4,4) and (5,4) are connection points (added during BFS).
// All returned coordinates are POST-move positions.

section('Test 50: LeftWall BFS chain push — pushed/connected return value (TASK-026)');

const field50 = new Field();
field50.set(3, 4, true);
field50.set(4, 4, true);
field50.set(5, 4, true);
const wall50 = new TestLeftWall(field50, null);
wall50.setPosition(3); // wall sits on the row's first column
const result50 = (wall50 as any).advanceOccupiedBlocksInColumn(3);

// Post-move positions: (3,4)->(4,4), (4,4)->(5,4), (5,4)->(6,4)
assert(field50.get(3, 4) === false, 'Column 3 cleared after chain push');
assert(field50.get(4, 4) === true && field50.get(5, 4) === true && field50.get(6, 4) === true, 'Row advanced to (4,4), (5,4), (6,4)');
assert(result50.pushedCells.length === 1, 'Exactly one pushed cell (wall-column block)');
assert(result50.pushedCells[0].x === 4 && result50.pushedCells[0].y === 4, 'pushedCells reports post-move position (4,4)');
assert(result50.connectedCells.length === 2, 'Two connected cells (blocks added during BFS)');
const connKeys50 = result50.connectedCells.map((c: { x: number; y: number }) => `${c.x},${c.y}`).sort();
assert(connKeys50.join(';') === '5,4;6,4', 'connectedCells reports post-move positions (5,4) and (6,4)');
// ===========================================================================
// Test 51: LeftWall BFS chain push — no cross-row or wrap connections (TASK-026)
// ===========================================================================
//
// BFS only checks the right neighbor in the SAME row. A block at (4,0)
// is NOT connected to (3,7) even though rows 7 and 0 are adjacent via
// vertical wrap; only (4,7) (same row as (3,7)) connects.

section('Test 51: LeftWall BFS chain push — no cross-row or wrap connections (TASK-026)');

const field51 = new Field();
field51.set(3, 7, true); // wall-column block in the bottom row
field51.set(4, 7, true); // same-row right neighbor: connected
field51.set(4, 0, true); // top row at x=4: NOT adjacent to (3,7) (different row)
const wall51 = new TestLeftWall(field51, null);
wall51.setPosition(3);
const result51 = (wall51 as any).advanceOccupiedBlocksInColumn(3);

assert(field51.get(3, 7) === false, 'Wall-column block (3,7) moved');
assert(field51.get(4, 7) === true, 'Connected same-row block present at (4,7)');
assert(field51.get(5, 7) === true, 'Chain tip moved to (5,7)');
assert(field51.get(4, 0) === true, 'Unconnected block (4,0) stays in place (no cross-row connection)');
assert(field51.countBlocks() === 3, 'All 3 blocks preserved');
assert(result51.pushedCells.length === 1 && result51.pushedCells[0].x === 4 && result51.pushedCells[0].y === 7, 'pushedCells = [(4,7)] (post-move)');
assert(result51.connectedCells.length === 1 && result51.connectedCells[0].x === 5 && result51.connectedCells[0].y === 7, 'connectedCells = [(5,7)] (only same-row neighbor)');
// ===========================================================================
// Test 52: LeftWall dynamic tick interval formula (TASK-027)
// ===========================================================================
//
// getTickInterval() implements the approved ramp (Decision-026-3):
// 400ms at elapsed 0ms, linear to 200ms at 10s, then flat at 200ms.
// The ramp-table values from the Task Packet:
//   0s -> 400ms, 2.5s -> 350ms, 5s -> 300ms, 7.5s -> 250ms, 10s+ -> 200ms.

section('Test 52: LeftWall dynamic tick interval formula (TASK-027)');

const field52 = new Field();
const wall52 = new TestLeftWall(field52, null);

// AC #2: at elapsed 0ms the tick interval is 400ms
assert(wall52.getTickInterval(0) === 400, 'Interval at elapsed 0ms is 400ms');
// AC #3: at 10000ms+ the tick interval is 200ms
assert(wall52.getTickInterval(10000) === 200, 'Interval at elapsed 10000ms is 200ms');
assert(wall52.getTickInterval(30000) === 200, 'Interval stays 200ms beyond the ramp (30000ms)');
// AC #4: the ramp is linear (Task Packet ramp-table points)
assert(wall52.getTickInterval(2500) === 350, 'Interval at 2.5s is 350ms (linear ramp)');
assert(wall52.getTickInterval(5000) === 300, 'Interval at 5s is 300ms (linear ramp)');
assert(wall52.getTickInterval(7500) === 250, 'Interval at 7.5s is 250ms (linear ramp)');
// Interval never increases as the game progresses
assert(
  wall52.getTickInterval(0) >= wall52.getTickInterval(5000) &&
    wall52.getTickInterval(5000) >= wall52.getTickInterval(10000) &&
    wall52.getTickInterval(10000) >= wall52.getTickInterval(30000),
  'Interval is monotonically non-increasing over elapsed time'
);
// No magic numbers: the ramp is defined by named constants
assert(LeftWall.INITIAL_TICK_INTERVAL_MS === 400, 'INITIAL_TICK_INTERVAL_MS constant is 400');
assert(LeftWall.MINIMUM_TICK_INTERVAL_MS === 200, 'MINIMUM_TICK_INTERVAL_MS constant is 200');
assert(LeftWall.TICK_RAMP_DURATION_MS === 10000, 'TICK_RAMP_DURATION_MS constant is 10000');
// ===========================================================================
// Test 53: LeftWall.tick() gates movement on the dynamic interval (TASK-027)
// ===========================================================================
//
// Deterministic timing via TestLeftWall mock clock: the wall starts at
// lastTick=0 and must wait the full interval for the first movement.
// After each movement the interval re-evaluates at the new elapsed game
// time, so the gate tightens as the game progresses.

section('Test 53: LeftWall.tick() gates movement on the dynamic interval (TASK-027)');

const field53 = new Field();
const wall53 = new TestLeftWall(field53, null);
wall53.setTime(0); // lastTick=0, mock clock=0

// Elapsed game time 0ms -> interval 400ms
wall53.advanceMockTime(399);
assert(wall53.tick(0) === null, 'No movement at +399ms (interval is 400ms at elapsed 0)');
wall53.advanceMockTime(400);
assert(wall53.tick(0) !== null, 'Movement at +400ms (initial interval elapsed)');
assert(wall53.getX() === 1, 'Wall advanced to x=1 after the first tick');

// Elapsed game time 400ms -> interval = 400 - (400/10000)*200 = 392ms
wall53.advanceMockTime(791);
assert(wall53.tick(400) === null, 'No movement at +391ms (interval is 392ms at elapsed 400ms)');
wall53.advanceMockTime(792);
assert(wall53.tick(400) !== null, 'Movement at +392ms (ramped interval elapsed)');
assert(wall53.getX() === 2, 'Wall advanced to x=2 after the second tick');

// Elapsed game time 5000ms -> interval = 300ms
wall53.setTime(5000);
wall53.advanceMockTime(5299);
assert(wall53.tick(5000) === null, 'No movement at +299ms (interval is 300ms at elapsed 5000ms)');
wall53.advanceMockTime(5300);
assert(wall53.tick(5000) !== null, 'Movement at +300ms (ramped interval elapsed)');
assert(wall53.getX() === 3, 'Wall advanced to x=3 after the third tick');
// ===========================================================================
// Test 54: Wall reset after compression does not reset the speed ramp (TASK-027)
// ===========================================================================
//
// AC #5: after a compression the wall resets to x=0 (setPosition(0) also
// refreshes lastTickMs), but the interval must still be the ramp value for
// the TOTAL elapsed game time — not 400ms again.

section('Test 54: Wall reset after compression does not reset the speed ramp (TASK-027)');

const field54 = new Field();
const wall54 = new TestLeftWall(field54, null);
wall54.setTime(8000); // pretend the game is 8000ms old (lastTick=8000)
wall54.setPosition(0); // simulate the post-compression wall reset
assert(wall54.getX() === 0, 'Wall reset to x=0');

// Interval at 8000ms elapsed = 400 - (8000/10000)*200 = 240ms (NOT 400ms)
wall54.advanceMockTime(8239);
assert(wall54.tick(8000) === null, 'No movement at +239ms after reset (interval is 240ms at 8s elapsed)');
wall54.advanceMockTime(8240);
assert(wall54.tick(8000) !== null, 'Movement at +240ms after reset (ramp NOT reset to 400ms)');
assert(wall54.getX() === 1, 'Wall moved x=0 -> x=1 using the ramped interval');
// ===========================================================================
// Test 55: Game.elapsedTime() and ramp restart on start() (TASK-027)
// ===========================================================================
//
// AC #6: elapsedTime() reports ms since the most recent start(). Edge
// case 3 from the Task Packet: restart after game over resets the ramp
// (startTime is set in start()), so each game starts at 400ms cadence.

section('Test 55: Game.elapsedTime() and ramp restart on start() (TASK-027)');

const origDateNow = Date.now;
let fakeNow = 1000000;
Date.now = () => fakeNow;
try {
  const game55 = new Game(new MockGameCanvas() as unknown as HTMLCanvasElement);
  game55.start();
  assert(game55.elapsedTime() === 0, 'elapsedTime() is 0 immediately after start()');

  fakeNow += 5000;
  assert(game55.elapsedTime() === 5000, 'elapsedTime() is 5000ms after 5s of game time');
  fakeNow += 1234;
  assert(game55.elapsedTime() === 6234, 'elapsedTime() tracks the clock (6234ms)');

  // Restart (start() again) resets the ramp start point.
  game55.start();
  assert(game55.elapsedTime() === 0, 'Restart resets elapsedTime() to 0 (fresh speed ramp)');
  game55.stop();
} finally {
  Date.now = origDateNow;
}
// ===========================================================================
// Test 56: Game.updatePlaying() passes game elapsed time to LeftWall.tick (TASK-027)
// ===========================================================================
//
// AC #1 wiring: the Game feeds the TOTAL game elapsed time (not
// wall-local time) into tick(). A spy wall records the argument.

section('Test 56: Game.updatePlaying() passes game elapsed time to LeftWall.tick (TASK-027)');

class SpyLeftWall extends TestLeftWall {
  tickArgs: number[] = [];
  tick(elapsedMs: number): ChainPushResult | null {
    this.tickArgs.push(elapsedMs);
    return null; // record only; do not move
  }
}

const game56 = new Game(new MockGameCanvas() as unknown as HTMLCanvasElement);
const spy56 = new SpyLeftWall(game56.getField(), null);
(game56 as any).leftWall = spy56;
game56.start(); // runs one synchronous frame: updatePlaying -> tick(elapsed)

assert(spy56.tickArgs.length === 1, 'tick() called once during the PLAYING frame');
assert(spy56.tickArgs[0] >= 0, 'tick() receives a non-negative game elapsed time');
assert(
  spy56.tickArgs[0] <= game56.elapsedTime(),
  'tick() receives the game elapsed time (elapsed game time, not wall-local time)'
);
game56.stop();
// ===========================================================================
// Test 62: Game registers effects when the wall advances (TASK-028)
// ===========================================================================
//
// AC #5 + #6 integration: a wall tick that chain-pushes fixed blocks
// registers a pushed flash on the wall-column block and a connection glow
// on the BFS-connected blocks, and the Renderer draws both in the same
// frame.
//
// Setup: blocks at (1,4),(2,4),(3,4); wall at x=0. One tick advances the
// wall to x=1 and pushes the chain: (1,4)->(2,4) [pushed],
// (2,4)->(3,4) and (3,4)->(4,4) [connected].

section('Test 62: Game registers effects when the wall advances (TASK-028)');

const gameCanvas62 = new MockGameCanvas();
const game62 = new Game(gameCanvas62 as unknown as HTMLCanvasElement);
game62.start(); // runs one synchronous frame (PLAYING); no wall movement yet
(game62 as any).activePiece = null; // wall interacts with fixed blocks only

const field62 = game62.getField();
field62.set(1, 4, true);
field62.set(2, 4, true);
field62.set(3, 4, true);

const wall62 = new TestLeftWall(field62, null);
wall62.setTime(0);
wall62.setPosition(0);
(game62 as any).leftWall = wall62;
wall62.advanceMockTime(400); // 400ms >= initial interval -> the tick moves

gameTick(); // frame: updatePlaying -> tick -> register effects -> render

assert(wall62.getX() === 1, 'Wall advanced to x=1');
assert(field62.get(1, 4) === false, 'Chain push vacated the original cell (1,4)');
assert(field62.get(4, 4) === true, 'Chain push moved the chain end to (4,4)');

const effects62 = game62.getEffectSystem();
assert(
  effects62.getPushedCells().some((c) => c.x === 2 && c.y === 4),
  'Pushed effect registered on the wall-column block at (2,4)'
);
const connected62 = effects62.getConnectedCells();
assert(
  connected62.some((c) => c.x === 3 && c.y === 4) &&
    connected62.some((c) => c.x === 4 && c.y === 4),
  'Connection effects registered on the BFS-connected blocks (3,4) and (4,4)'
);

const ctx62 = (gameCanvas62 as any).getContext('2d') as MockRenderContext;
assert(
  ctx62.fillRect_calls.some(
    (c) => c.x === 81 && c.y === 161 && c.w === 38 && c.h === 38 && c.fillStyle === '#9a9aba'
  ),
  'Canvas shows the pushed flash on (2,4): brighter block at pixel (81,161)'
);
assert(
  ctx62.fillRect_calls.some(
    (c) => c.x === 121 && c.y === 161 && c.w === 38 && c.h === 38 && c.fillStyle === '#ffd93d'
  ),
  'Canvas shows the connection glow on (3,4): yellow glow at pixel (121,161)'
);
game62.stop();
// ===========================================================================
// Test 66: Fix-at-contact disintegrates the piece into individually-pushed blocks (TASK-030)
// ===========================================================================
//
// Decision-030-3 sign-off test (Challenge F4): when the wall fixes the
// active piece at contact, the piece's cells are then pushed individually
// by the fall-through BFS chain push — a rigid T-piece disintegrates.
// T-piece (type 2) at origin x=6, rot 0: cells (6,4)(7,4)(8,4)(7,5). The
// wall advances from x=5 to x=6 (contact at the leftmost cell (6,4)).
// The row-4 chain {(6,4),(7,4),(8,4)} is pushed to (7,4)(8,4)(9,4); the
// (7,5) arm is not in the move set (BFS expansion is same-row horizontal
// only, and (7,5) has no occupied right neighbor) and stays at (7,5).
// Resting field: (7,4)(8,4)(9,4)(7,5). The old rigid-push behavior would
// have left the arm at (8,5) — pinned as NOT occupied here.

section('Test 66: Fix-at-contact disintegrates the piece into individually-pushed blocks (TASK-030)');

const fieldScramble = new Field();
const pieceScramble = new ActivePiece(fieldScramble, 2, 6, 4, 0);
const wallScramble = new TestLeftWall(fieldScramble, pieceScramble);
wallScramble.setPosition(5);

const pushResult = wallScramble.advance(); // x: 5 -> 6; contact -> fix -> chain push

assert(wallScramble.getX() === 6, '66: wall advanced from x=5 to x=6 (contact column)');
assert(
  pieceScramble.getX() === -100,
  '66: active piece was fixed at contact (cleared to -100), not pushed as a rigid body'
);
assert(
  fieldScramble.get(7, 4) === true && fieldScramble.get(8, 4) === true &&
    fieldScramble.get(9, 4) === true && fieldScramble.get(7, 5) === true,
  '66: resting shape is (7,4)(8,4)(9,4)(7,5) — the row-4 chain pushed, the arm stayed'
);
assert(
  fieldScramble.countBlocks() === 4,
  '66: no block loss through fix-at-contact + chain push'
);
assert(
  fieldScramble.getOccupiedCells().map((c) => `${c.x},${c.y}`).sort().join('|') === '7,4|7,5|8,4|9,4',
  '66: the exact resting field is (7,4)(7,5)(8,4)(9,4) and nothing else'
);
assert(
  fieldScramble.get(8, 5) === false,
  '66: (8,5) is NOT occupied — the rigid-push arm position does not exist'
);
assert(
  fieldScramble.get(6, 4) === false,
  '66: the seeded wall-column cell (6,4) was vacated by the push'
);
assert(
  pushResult.pushedCells.length === 1 && pushResult.pushedCells[0].x === 7 && pushResult.pushedCells[0].y === 4,
  '66: pushedCells reports the pushed seed at its post-move position (7,4)'
);
assert(
  pushResult.connectedCells.length === 2 &&
    pushResult.connectedCells.some((c) => c.x === 8 && c.y === 4) &&
    pushResult.connectedCells.some((c) => c.x === 9 && c.y === 4),
  '66: connectedCells reports the BFS-connected blocks at post-move positions (8,4),(9,4)'
);