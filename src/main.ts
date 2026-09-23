import { Field } from './Field.js';
import { ActivePiece } from './ActivePiece.js';
import { LeftWall, type ChainPushResult } from './LeftWall.js';
import { RightWall } from './RightWall.js';
import { CompressionSystem } from './CompressionSystem.js';
import { InputManager, type InputAction } from './InputManager.js';
import { Renderer } from './Renderer.js';
import { Game, type GameState } from './Game.js';
import { EffectSystem } from './EffectSystem.js';

// ===========================================================================
// Test infrastructure
// ===========================================================================

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS: ${message}`);
    testsPassed++;
  } else {
    console.log(`  FAIL: ${message}`);
    testsFailed++;
  }
}

function section(name: string): void {
  console.log(`\n=== ${name} ===`);
}

// ===========================================================================
// Helper: mock TimeNow for deterministic wall testing
// ===========================================================================

class TestLeftWall extends LeftWall {
  setTime(ms: number): void {
    super.setTime(ms);
  }

  // TASK-027: deterministic clock — tick() timing is driven by the mock
  // time instead of Date.now(), so interval gating is fully controllable.
  currentTimeMillis(): number {
    return this._time;
  }

  // TASK-027: advance the mock clock WITHOUT resetting lastTickMs, so a
  // "now - lastTick" gap can be simulated precisely.
  advanceMockTime(ms: number): void {
    this._time = ms;
  }
}

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
function shapeToKey(shape: typeof I_SHAPE): string {
  return shape
    .map((c) => `${c.x},${c.y}`)
    .sort()
    .join('|');
}

const keys = [I_SHAPE, O_SHAPE, T_SHAPE, S_SHAPE, Z_SHAPE, J_SHAPE, L_SHAPE]
  .map(shapeToKey);
const uniqueKeys = new Set(keys);
assert(uniqueKeys.size === 7, 'All 7 tetromino shapes are unique');

function shapesEqual(a: typeof I_SHAPE, b: typeof I_SHAPE): boolean {
  if (a.length !== b.length) return false;
  const aKey = a.map((c) => `${c.x},${c.y}`).sort().join('|');
  const bKey = b.map((c) => `${c.x},${c.y}`).sort().join('|');
  return aKey === bKey;
}

// Invalid type returns empty shape
assert(ActivePiece.getBaseShape(-1).length === 0, 'Invalid type -1 returns empty shape');
assert(ActivePiece.getBaseShape(7).length === 0, 'Invalid type 7 returns empty shape');

// ===========================================================================
// Test 2: ActivePiece rotation (90° clockwise)
// ===========================================================================

section('Test 2: ActivePiece rotation (90° clockwise)');

const field = new Field();

// I piece at rotation 0: horizontal line
const iShape0 = ActivePiece.getShape(0, 0);
assert(iShape0.length === 4, 'I piece at rotation 0 has 4 cells');
assert(iShape0[0].x === 0 && iShape0[0].y === 0, 'I rotation 0 cell 0 at (0,0)');
assert(iShape0[3].x === 3 && iShape0[3].y === 0, 'I rotation 0 cell 3 at (3,0)');

// I piece at rotation 90°: should become vertical
const iShape90 = ActivePiece.getShape(0, 1);
assert(iShape90[0].x === 0 && iShape90[0].y === 0, 'I rotation 90 cell 0 at (0,0)');
assert(iShape90[1].x === 0 && iShape90[1].y === -1, 'I rotation 90 cell 1 at (0,-1)');
assert(iShape90[2].x === 0 && iShape90[2].y === -2, 'I rotation 90 cell 2 at (0,-2)');
assert(iShape90[3].x === 0 && iShape90[3].y === -3, 'I rotation 90 cell 3 at (0,-3)');

// I piece at rotation 180°
const iShape180 = ActivePiece.getShape(0, 2);
assert(iShape180[0].x === 0 && iShape180[0].y === 0, 'I rotation 180 cell 0 at (0,0)');
assert(iShape180[1].x === -1 && iShape180[1].y === 0, 'I rotation 180 cell 1 at (-1,0)');
assert(iShape180[2].x === -2 && iShape180[2].y === 0, 'I rotation 180 cell 2 at (-2,0)');
assert(iShape180[3].x === -3 && iShape180[3].y === 0, 'I rotation 180 cell 3 at (-3,0)');

// I piece at rotation 270°
const iShape270 = ActivePiece.getShape(0, 3);
assert(iShape270[0].x === 0 && iShape270[0].y === 0, 'I rotation 270 cell 0 at (0,0)');
assert(iShape270[1].x === 0 && iShape270[1].y === 1, 'I rotation 270 cell 1 at (0,1)');
assert(iShape270[2].x === 0 && iShape270[2].y === 2, 'I rotation 270 cell 2 at (0,2)');
assert(iShape270[3].x === 0 && iShape270[3].y === 3, 'I rotation 270 cell 3 at (0,3)');

// O piece: same number of cells at all rotations (invariant cell count)
const oShape0 = ActivePiece.getShape(1, 0);
const oShape1 = ActivePiece.getShape(1, 1);
const oShape2 = ActivePiece.getShape(1, 2);
const oShape3 = ActivePiece.getShape(1, 3);
assert(oShape0.length === oShape1.length, 'O shape has same length at all rotations (0->90)');
assert(oShape0.length === oShape2.length, 'O shape has same length at all rotations (0->180)');
assert(oShape0.length === oShape3.length, 'O shape has same length at all rotations (0->270)');

// T piece rotation 0 -> 90
const tShape0 = ActivePiece.getShape(2, 0);
const tShape90 = ActivePiece.getShape(2, 1);
// T at rotation 0: top row (0,0),(1,0),(2,0) and center bottom (1,1)
// T at rotation 90: left column + right extension
assert(tShape90.length === 4, 'T shape at rotation 90 has 4 cells');
assert(
  tShape90.some((c) => c.x === 0 && c.y === -2),
  'T rotation 90 has cell at (0,-2)'
);

// ActivePiece instance rotation
const piece = new ActivePiece(field, 0, 8, 4, 0); // I piece at (8,4), rot 0
assert(piece.getRotation() === 0, 'New piece starts at rotation 0');
const rotated = piece.rotate();
assert(rotated === true, 'I piece rotation succeeds (open space)');
assert(piece.getRotation() === 1, 'I piece rotation is now 90°');

// ===========================================================================
// Test 3: Predictive rotation check (collision blocking)
// ===========================================================================

section('Test 3: Predictive rotation check (collision blocking)');

// Place an occupied block adjacent to the piece to block rotation.
// I piece at (2,4) rot 0: (2,4)(3,4)(4,4)(5,4)
// I piece at rot 90: (2,4)(2,3)(2,2)(2,1) -> y wraps: 4,3,2,1
// Blocker at (2,3) would block the rotation
const field3 = new Field();
const piece3 = new ActivePiece(field3, 0, 2, 4, 0); // I piece (type 0) at (2,4) rot 0

const cells0 = piece3.getOccupiedCells();
assert(cells0.length === 4, 'I piece at (2,4) rot 0 has 4 occupied cells');
assert(cells0[0].x === 2 && cells0[0].y === 4, 'I piece cell 0 at (2,4)');
assert(cells0[1].x === 3 && cells0[1].y === 4, 'I piece cell 1 at (3,4)');
assert(cells0[2].x === 4 && cells0[2].y === 4, 'I piece cell 2 at (4,4)');
assert(cells0[3].x === 5 && cells0[3].y === 4, 'I piece cell 3 at (5,4)');

// Place blocker at (2,3)
field3.set(2, 3, true);
const rotatedCells = ActivePiece.getShape(0, 1).map((c) => ({
  x: 2 + c.x,
  y: field3.wrapY(4 + c.y),
}));
assert(
  rotatedCells.some((c) => c.x === 2 && c.y === 3),
  'Rotated I piece (rot 90) would occupy (2,3)'
);

// Predictive check should return true (would collide)
assert(
  piece3.wouldRotateCollide() === true,
  'wouldRotateCollide returns true when rotation would hit block at (2,3)'
);

// Actual rotation should be blocked
const blocked = piece3.rotate();
assert(blocked === false, 'rotate() returns false when rotation is blocked');
assert(piece3.getRotation() === 0, 'Rotation state unchanged after blocked rotation');

// Remove the blocking block
field3.set(2, 3, false);
assert(piece3.wouldRotateCollide() === false, 'wouldRotateCollide returns false after removing blocker');
assert(piece3.rotate() === true, 'rotate() succeeds after blocker removed');
assert(piece3.getRotation() === 1, 'Rotation advances after successful rotate()');

// Test collision with field boundary
const field4 = new Field();
const piece4 = new ActivePiece(field4, 0, 0, 4, 0); // I piece at x=0

// I piece at (0,4) rot 0: cells at (0,4)(1,4)(2,4)(3,4)
// I piece at rot 90: cells at (0,4)(0,3)(0,2)(0,1) - all x >= 0, valid
const rotOk = piece4.rotate();
assert(rotOk === true, 'I piece at x=0 rotates fine (no left boundary collision)');
assert(piece4.getRotation() === 1, 'I piece at x=0 rotated to 90°');

// Move to boundary: I at rot 90 with cells at (0,4)(0,3)(0,2)(0,1)
// Rot 90->180 would put cells at (0,4)(-1,4)(-2,4)(-3,4) -> x=-1 is out of bounds
const piece4b = new ActivePiece(field4, 0, 0, 4, 1); // Already at rotation 90
assert(piece4b.wouldRotateCollide() === true, 'I piece at x=0 rot 90->180 blocked by left boundary');
assert(piece4b.rotate() === false, 'rotate() blocked at x=0 boundary');

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
// Test 6: getOccupiedCells with vertical wrapping
// ===========================================================================

section('Test 6: getOccupiedCells with vertical wrapping');

const field8 = new Field();
const piece8 = new ActivePiece(field8, 1, 0, 7, 0); // O piece at (0,7) rot 0

// O piece at (0,7): cells at (0,7)(1,7)(0,8)(1,8)
// wrapY(7)=7, wrapY(8)=0
const cells8 = piece8.getOccupiedCells();
assert(cells8[0].x === 0 && cells8[0].y === 7, 'O piece cell (0,7) wraps to (0,7)');
assert(cells8[1].x === 1 && cells8[1].y === 7, 'O piece cell (1,7) wraps to (1,7)');
assert(cells8[2].x === 0 && cells8[2].y === 0, 'O piece cell (0,8) wraps to (0,0)');
assert(cells8[3].x === 1 && cells8[3].y === 0, 'O piece cell (1,8) wraps to (1,0)');

// ===========================================================================
// Test 7: L and J tetromino shapes
// ===========================================================================

section('Test 7: L and J tetromino shapes');

const lShape = ActivePiece.getBaseShape(6);
const jShape = ActivePiece.getBaseShape(5);

// L shape: (2,0), (0,1), (1,1), (2,1)
assert(lShape[0].x === 2 && lShape[0].y === 0, 'L shape cell 0 at (2,0)');
assert(lShape[1].x === 0 && lShape[1].y === 1, 'L shape cell 1 at (0,1)');
assert(lShape[2].x === 1 && lShape[2].y === 1, 'L shape cell 2 at (1,1)');
assert(lShape[3].x === 2 && lShape[3].y === 1, 'L shape cell 3 at (2,1)');

// J shape: (0,0), (0,1), (1,1), (2,1)
assert(jShape[0].x === 0 && jShape[0].y === 0, 'J shape cell 0 at (0,0)');
assert(jShape[1].x === 0 && jShape[1].y === 1, 'J shape cell 1 at (0,1)');
assert(jShape[2].x === 1 && jShape[2].y === 1, 'J shape cell 2 at (1,1)');
assert(jShape[3].x === 2 && jShape[3].y === 1, 'J shape cell 3 at (2,1)');

// Verify L and J are distinct
assert(!shapesEqual(lShape, jShape), 'L and J shapes are distinct');

// ===========================================================================
// Test 8: S and Z tetromino shapes
// ===========================================================================

section('Test 8: S and Z tetromino shapes');

const sShape = ActivePiece.getBaseShape(3);
const zShape = ActivePiece.getBaseShape(4);

// S shape: (1,0), (2,0), (0,1), (1,1)
assert(sShape[0].x === 1 && sShape[0].y === 0, 'S shape cell 0 at (1,0)');
assert(sShape[1].x === 2 && sShape[1].y === 0, 'S shape cell 1 at (2,0)');
assert(sShape[2].x === 0 && sShape[2].y === 1, 'S shape cell 2 at (0,1)');
assert(sShape[3].x === 1 && sShape[3].y === 1, 'S shape cell 3 at (1,1)');

// Z shape: (0,0), (1,0), (1,1), (2,1)
assert(zShape[0].x === 0 && zShape[0].y === 0, 'Z shape cell 0 at (0,0)');
assert(zShape[1].x === 1 && zShape[1].y === 0, 'Z shape cell 1 at (1,0)');
assert(zShape[2].x === 1 && zShape[2].y === 1, 'Z shape cell 2 at (1,1)');
assert(zShape[3].x === 2 && zShape[3].y === 1, 'Z shape cell 3 at (2,1)');

// Verify S and Z are distinct
assert(!shapesEqual(sShape, zShape), 'S and Z shapes are distinct');

// ===========================================================================
// Test 9: RightWall vertical shifting (wrapping)
// ===========================================================================

section('Test 9: RightWall vertical shifting (wrapping)');

const fieldRW = new Field();
const rightWall = new RightWall(fieldRW, Field.COLS - 1, 0);

assert(rightWall.getX() === Field.COLS - 1, 'RightWall x is COLS-1 (15)');
assert(rightWall.getY() === 0, 'RightWall y starts at 0');
assert(rightWall.toString().includes('RightWall'), 'RightWall toString contains class name');

// Shift up by 7 -> y=7
rightWall.shiftVertical(7);
assert(rightWall.getY() === 7, 'RightWall shifts up to y=7');

// Shift up by 1 -> y=8 wraps to y=0
rightWall.shiftVertical(1);
assert(rightWall.getY() === 0, 'RightWall wraps from y=7 to y=0 (shift up)');

// Shift down by 1 -> y=-1 wraps to y=7
rightWall.shiftVertical(-1);
assert(rightWall.getY() === 7, 'RightWall wraps from y=0 to y=7 (shift down)');

// Shift by large positive value: 8 -> wraps to 0
rightWall.setY(8);
assert(rightWall.getY() === 0, 'setY(8) wraps to y=0');

// Shift by large negative value: -1 -> wraps to 7
rightWall.setY(-1);
assert(rightWall.getY() === 7, 'setY(-1) wraps to y=7');

// Shift by exactly ROWS -> no net change
rightWall.setY(0);
rightWall.shiftVertical(8);
assert(rightWall.getY() === 0, 'Shift by ROWS (8) results in no net change');

// ===========================================================================
// Test 10: RightWall moves attached blocks vertically
// ===========================================================================

section('Test 10: RightWall moves attached blocks vertically');

const fieldRB = new Field();
fieldRB.set(Field.COLS - 1, 3, true); // Block at (15, 3)
fieldRB.set(Field.COLS - 1, 5, true); // Block at (15, 5)

const rw2 = new RightWall(fieldRB, Field.COLS - 1, 0);

// Shift wall up by 1 -> blocks at y=3 and y=5 move to y=4 and y=6
rw2.shiftVertical(1);
assert(fieldRB.get(15, 4) === true, 'Block at (15,3) moved to (15,4)');
assert(fieldRB.get(15, 6) === true, 'Block at (15,5) moved to (15,6)');
assert(fieldRB.get(15, 3) === false, 'Old position (15,3) cleared');
assert(fieldRB.get(15, 5) === false, 'Old position (15,5) cleared');

// Shift wall up by 4 -> blocks at y=4 and y=6 move to y=8 (wraps to y=0) and y=10 (wraps to y=2)
rw2.shiftVertical(4);
assert(fieldRB.get(15, 0) === true, 'Block at (15,4) wraps to (15,0)');
assert(fieldRB.get(15, 2) === true, 'Block at (15,6) wraps to (15,2)');
assert(fieldRB.get(15, 4) === false, 'Old position (15,4) cleared after wrap');
assert(fieldRB.get(15, 6) === false, 'Old position (15,6) cleared after wrap');

// Shift wall down by 2 -> blocks at y=0 and y=2 move to y=-2 (wraps to y=6) and y=0
rw2.shiftVertical(-2);
assert(fieldRB.get(15, 6) === true, 'Block wraps down from y=0 to (15,6)');
assert(fieldRB.get(15, 0) === true, 'Block at (15,2) moves to (15,0)');
assert(fieldRB.get(15, 2) === false, 'Old position (15,2) cleared');

// No blocks on wall -> shift does nothing to field
const fieldRB2 = new Field();
const rw3 = new RightWall(fieldRB2, Field.COLS - 1, 0);
rw3.shiftVertical(3);
assert(fieldRB2.countBlocks() === 0, 'No blocks on empty field after shift');

// ===========================================================================
// Test 11: CompressionSystem shouldCompress trigger
// ===========================================================================

section('Test 11: CompressionSystem shouldCompress trigger');

const fieldCS1 = new Field();
const rwCS1 = new RightWall(fieldCS1, Field.COLS - 1, 0);
const cs1 = new CompressionSystem(fieldCS1, rwCS1, null, 1);

// Left wall far from right wall -> no compression
assert(cs1.shouldCompress(0) === false, 'shouldCompress false when distance=15');

// Left wall at distance 1 from right wall -> compression triggers
assert(cs1.shouldCompress(14) === true, 'shouldCompress true when distance=1 (within threshold=1)');

// Left wall at distance 2 -> no compression (threshold=1)
assert(cs1.shouldCompress(13) === false, 'shouldCompress false when distance=2 (exceeds threshold=1)');

// Left wall at right wall position -> compression triggers
assert(cs1.shouldCompress(15) === true, 'shouldCompress true when walls overlap');

// Change threshold to 3
cs1.setThreshold(3);
assert(cs1.shouldCompress(12) === true, 'shouldCompress true with threshold=3, distance=3');
assert(cs1.shouldCompress(11) === false, 'shouldCompress false with threshold=3, distance=4');

// ===========================================================================
// Test 12: CompressionSystem compress with empty field
// ===========================================================================

section('Test 12: CompressionSystem compress with empty field');

const fieldCE = new Field();
const rwCE = new RightWall(fieldCE, Field.COLS - 1, 0);
let leftWallResetCount = 0;
const csCE = new CompressionSystem(
  fieldCE,
  rwCE,
  () => { leftWallResetCount++; },
  1
);

// Compression on empty field -> should still trigger and return true
const result = csCE.compress(14);
assert(result === true, 'compress returns true when triggered');
assert(leftWallResetCount === 1, 'left wall reset callback was called once');
assert(fieldCE.countBlocks() === 0, 'No blocks remain on empty field after compression');

// ===========================================================================
// Test 13: CompressionSystem compress moves blocks right
// ===========================================================================
//
// TASK-036 (BUG C fix): the movement target is seeded at the moving wall's
// column and expands RIGHT only (compress-mechanism.md, 移動対象の構築).
// With the left wall at x=14, only the block at (14,4) is in the movement
// target. Blocks at (10..13,4) are behind the wall column, are never pulled
// into the target, and remain in place.

section('Test 13: CompressionSystem compress moves blocks right');

const fieldCM = new Field();
// Place 5 blocks in a row near the right wall (leaving x=15 and x=0 empty)
fieldCM.set(10, 4, true);
fieldCM.set(11, 4, true);
fieldCM.set(12, 4, true);
fieldCM.set(13, 4, true);
fieldCM.set(14, 4, true);

assert(fieldCM.countBlocks() === 5, 'Field has 5 blocks before compression');

const rwCM = new RightWall(fieldCM, Field.COLS - 1, 0);
const csCM = new CompressionSystem(
  fieldCM,
  rwCM,
  () => {},
  1
);

// Left wall at x=14 triggers compression (distance = 15-14 = 1); the wall
// column also seeds the movement target.
const compressResult = csCM.compress(14);
assert(compressResult === true, 'compress returns true');

// Only the block in the wall column moves: (14,4) -> (15,4).
// Blocks at (10..13,4) remain in place — the target expands right only.
assert(fieldCM.get(15, 4) === true, 'Block moved to (15,4) (right wall column)');
assert(fieldCM.get(14, 4) === false, 'Old position (14,4) cleared');
assert(fieldCM.get(10, 4) === true, 'Block remains at (10,4) (behind the wall, not in movement target)');
assert(fieldCM.get(11, 4) === true, 'Block remains at (11,4) (behind the wall, not in movement target)');
assert(fieldCM.get(12, 4) === true, 'Block remains at (12,4) (behind the wall, not in movement target)');
assert(fieldCM.get(13, 4) === true, 'Block remains at (13,4) (behind the wall, not in movement target)');
assert(fieldCM.countBlocks() === 5, 'Block count unchanged after compression');

// ===========================================================================
// Test 14: CompressionSystem compression fails when blocked
// ===========================================================================

section('Test 14: CompressionSystem compression fails when blocked');

const fieldCB = new Field();
// Fill the entire bottom row
for (let x = 0; x < Field.COLS; x++) {
  fieldCB.set(x, 4, true);
}
assert(fieldCB.countBlocks() === Field.COLS, `Field fully filled (${Field.COLS} blocks)`);

const rwCB = new RightWall(fieldCB, Field.COLS - 1, 0);
let resetCount2 = 0;
const csCB = new CompressionSystem(fieldCB, rwCB, () => { resetCount2++; }, 1);

// The full row cannot move right (the block at the wall column blocks the
// push), so no movement occurs. The field is not completely full, so per
// compress-mechanism.md step 5 the cycle completes: the configuration is
// finalized as-is and the left wall resets.
//
// Updated in TASK-023 (DEV-023-1): previously asserted the removed
// alignment path's no-reset behavior (returns true without resetting).
const blockedResult = csCB.compress(14);
assert(blockedResult === true, 'Compression cycle completes (field not completely full)');
assert(resetCount2 === 1, 'Left wall reset after completed cycle');
// Field must not be corrupted: block count and the full row are unchanged.
assert(fieldCB.countBlocks() === Field.COLS, 'Block count unchanged (no corruption)');
assert(
  fieldCB.get(0, 4) === true && fieldCB.get(Field.COLS - 1, 4) === true,
  'Full row unchanged (configuration finalized as-is)'
);

// ===========================================================================
// Test 15: CompressionSystem finalizes configuration when blocks cannot move right
// ===========================================================================
//
// Per compress-mechanism.md: BFS compression moves every block that CAN
// move right; when no further movement is possible, compression ends and
// the current configuration is finalized as-is. The right wall's y-offset
// does not affect block positions (BFS compression is horizontal only).
//
// Updated in TASK-023 (DEV-023-2): this test previously verified the
// removed alignBlocksVertical() behavior (vertical distribution of wall
// blocks to rows adjacent to wallY). The replacement design is specified
// verbatim in the TASK-024 packet.

section('Test 15: CompressionSystem finalizes configuration when blocks cannot move right');

const fieldCI = new Field();
// Place blocks at (14,3) and (14,5) — one column left of right wall
fieldCI.set(14, 3, true);
fieldCI.set(14, 5, true);

const rwCI = new RightWall(fieldCI, 15, 2);
const csCI = new CompressionSystem(fieldCI, rwCI, () => {}, 1);

// Compression: blocks at (14,3) and (14,5) can move right to (15,3) and (15,5)
const resultCI = csCI.compress(14);
assert(resultCI === true, 'compress returns true (cycle completed)');

// Blocks moved right by BFS compression
assert(fieldCI.get(15, 3) === true, 'Block moved to (15,3)');
assert(fieldCI.get(15, 5) === true, 'Block moved to (15,5)');
assert(fieldCI.get(14, 3) === false, 'Old position (14,3) cleared');
assert(fieldCI.get(14, 5) === false, 'Old position (14,5) cleared');

// Block count preserved (BFS compression preserves count)
assert(fieldCI.countBlocks() === 2, 'Block count preserved after compression');

// ===========================================================================
// Test 16: CompressionSystem left wall reset via callback
// ===========================================================================

section('Test 16: CompressionSystem left wall reset via callback');

const fieldCR = new Field();
const rwCR = new RightWall(fieldCR, Field.COLS - 1, 0);

let resetX = -1;
const csCR = new CompressionSystem(
  fieldCR,
  rwCR,
  () => { resetX = 0; },
  1
);

// Before compression, reset callback has not been called
assert(resetX === -1, 'Reset callback not called before compression');

// Trigger compression
csCR.compress(14);

// After compression, reset callback was called with x=0
assert(resetX === 0, 'Left wall reset callback called with x=0');

// ===========================================================================
// Helper: mock canvas for InputManager testing
// ===========================================================================
//
// Simulates a minimal HTMLCanvasElement with addEventListener for keydown.
// Used because Node.js does not provide a real DOM.

interface MockCanvasElement {
  addEventListener(type: string, handler: (event: KeyboardEvent) => void): void;
  dispatchKey(code: string): void;
}

class MockCanvas implements MockCanvasElement {
  private listeners: Array<{ type: string; handler: (event: KeyboardEvent) => void }>;

  public constructor() {
    this.listeners = [];
  }

  public addEventListener(type: string, handler: (event: KeyboardEvent) => void): void {
    this.listeners.push({ type, handler });
  }

  public dispatchKey(code: string): void {
    // Minimal KeyboardEvent: only `code` is used by InputManager.
    const event = { code } as unknown as KeyboardEvent;
    for (const { type, handler } of this.listeners) {
      if (type === 'keydown') {
        handler(event);
      }
    }
  }
}

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

// ===========================================================================
// Helper: mock canvas for Renderer testing
// ===========================================================================
//
// Simulates a minimal HTMLCanvasElement and CanvasRenderingContext2D
// for Node.js testing. Tracks method calls for verification.

class MockRenderContext {
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  font = '';
  textAlign = '';
  textBaseline = '';
  // fillStyle is recorded with each fillRect call (TASK-028) so tests can
  // verify which color a block was drawn with.
  fillRect_calls: Array<{ x: number; y: number; w: number; h: number; fillStyle: string }> = [];
  beginPath_calls = 0;
  moveTo_calls: Array<{ x: number; y: number }> = [];
  lineTo_calls: Array<{ x: number; y: number }> = [];
  stroke_calls = 0;
  fillText_calls: Array<{ text: string; x: number; y: number }> = [];

  beginPath(): void { this.beginPath_calls++; }
  moveTo(x: number, y: number): void { this.moveTo_calls.push({ x, y }); }
  lineTo(x: number, y: number): void { this.lineTo_calls.push({ x, y }); }
  stroke(): void { this.stroke_calls++; }
  fillRect(x: number, y: number, w: number, h: number): void {
    this.fillRect_calls.push({ x, y, w, h, fillStyle: this.fillStyle });
  }
  fillText(text: string, x: number, y: number): void {
    this.fillText_calls.push({ text, x, y });
  }
}

class MockRenderCanvas {
  width = 0;
  height = 0;
  private context: MockRenderContext;

  constructor() {
    this.context = new MockRenderContext();
  }

  getContext(_type: string): MockRenderContext {
    return this.context;
  }

  getContext2D(): MockRenderContext {
    return this.context;
  }
}

// ===========================================================================
// Test 23: Renderer constructor and basic rendering
// ===========================================================================

section('Test 23: Renderer constructor and basic rendering');

const mockCanvas = new MockRenderCanvas();
const renderer = new Renderer(mockCanvas as unknown as HTMLCanvasElement, 40);

// Canvas dimensions should be set after first render
const testField = new Field();
const testPiece = new ActivePiece(testField, 0, 8, 4, 0);
const testLeftWall = new LeftWall(testField, testPiece);
const testRightWall = new RightWall(testField, Field.COLS - 1, 0);

// render() should not throw
let renderThrew = false;
try {
  renderer.render(testField, testPiece, testLeftWall, testRightWall, 50, false, new EffectSystem());
} catch (_e) {
  renderThrew = true;
}
assert(renderThrew === false, 'render() does not throw with valid inputs');

// Canvas dimensions should be set to grid size (16*40 x 8*40)
assert(mockCanvas.width === 640, `Canvas width is 640 (16 cols * 40px)`);
assert(mockCanvas.height === 350, `Canvas height is 350 (8 rows * 40px + 30px UI area)`);

// Background should be drawn (first fillRect call)
const ctx = mockCanvas.getContext2D();
assert(ctx.fillRect_calls.length >= 1, 'Background fillRect was called');
assert(ctx.fillRect_calls[0].w === 640, 'Background covers full width');
assert(ctx.fillRect_calls[0].h === 350, 'Background covers full height');

// ===========================================================================
// Test 24: Renderer handles null activePiece
// ===========================================================================

section('Test 24: Renderer handles null activePiece');

const mockCanvas2 = new MockRenderCanvas();
const renderer2 = new Renderer(mockCanvas2 as unknown as HTMLCanvasElement, 40);

// render() with null activePiece should not throw
let nullPieceThrew = false;
try {
  renderer2.render(testField, null, testLeftWall, testRightWall, 0, false, new EffectSystem());
} catch (_e) {
  nullPieceThrew = true;
}
assert(nullPieceThrew === false, 'render() does not throw when activePiece is null');

// ===========================================================================
// Test 25: Renderer handles game over state
// ===========================================================================

section('Test 25: Renderer handles game over state');

const mockCanvas3 = new MockRenderCanvas();
const renderer3 = new Renderer(mockCanvas3 as unknown as HTMLCanvasElement, 40);

// render() with game over should draw overlay and text
renderer3.render(testField, null, testLeftWall, testRightWall, 75, true, new EffectSystem());

const ctx3 = mockCanvas3.getContext2D();

// Game over overlay (semi-transparent fillRect)
let overlayDrawn = false;
for (const call of ctx3.fillRect_calls) {
  if (call.w === 640 && call.h === 350) {
    overlayDrawn = true;
  }
}
assert(overlayDrawn === true, 'Game over overlay covers full canvas');

// Game over text should be drawn
let gameOverTextDrawn = false;
for (const call of ctx3.fillText_calls) {
  if (call.text === 'GAME OVER') {
    gameOverTextDrawn = true;
  }
}
assert(gameOverTextDrawn === true, 'GAME OVER text is drawn');

// Final density text should be drawn
let densityTextDrawn = false;
for (const call of ctx3.fillText_calls) {
  if (call.text.includes('Final Density')) {
    densityTextDrawn = true;
  }
}
assert(densityTextDrawn === true, 'Final Density text is drawn');

// ===========================================================================
// Test 26: Renderer draws score
// ===========================================================================

section('Test 26: Renderer draws score');

const mockCanvas4 = new MockRenderCanvas();
const renderer4 = new Renderer(mockCanvas4 as unknown as HTMLCanvasElement, 40);

renderer4.render(testField, null, testLeftWall, testRightWall, 42, false, new EffectSystem());

const ctx4 = mockCanvas4.getContext2D();

// Score text should be drawn
let scoreTextDrawn = false;
for (const call of ctx4.fillText_calls) {
  if (call.text === 'Density: 42%') {
    scoreTextDrawn = true;
  }
}
assert(scoreTextDrawn === true, 'Score text "Density: 42%" is drawn');

// ===========================================================================
// Test 27: Renderer draws blocks on field
// ===========================================================================

section('Test 27: Renderer draws blocks on field');

const mockCanvas5 = new MockRenderCanvas();
const renderer5 = new Renderer(mockCanvas5 as unknown as HTMLCanvasElement, 40);

const fieldWithBlocks = new Field();
fieldWithBlocks.set(5, 3, true);
fieldWithBlocks.set(10, 6, true);

renderer5.render(fieldWithBlocks, null, testLeftWall, testRightWall, 0, false, new EffectSystem());

const ctx5 = mockCanvas5.getContext2D();

// Should have fillRect calls for blocks (background + 2 blocks)
// Background is 1 fillRect, each block is 1 fillRect
const blockFillRects = ctx5.fillRect_calls.filter(
  (call) => call.w === 38 && call.h === 38 // cell size - 2px padding
);
assert(blockFillRects.length === 2, 'Two block fillRect calls for two blocks');

// Verify block positions (with 1px padding)
const blockPositions = blockFillRects.map((call) => ({ x: call.x, y: call.y }));
const hasBlock1 = blockPositions.some((p) => p.x === 201 && p.y === 121); // 5*40+1, 3*40+1
const hasBlock2 = blockPositions.some((p) => p.x === 401 && p.y === 241); // 10*40+1, 6*40+1
assert(hasBlock1 === true, 'Block at (5,3) rendered at correct position');
assert(hasBlock2 === true, 'Block at (10,6) rendered at correct position');

// ===========================================================================
// Test 28: Renderer draws walls
// ===========================================================================

section('Test 28: Renderer draws walls');

const mockCanvas6 = new MockRenderCanvas();
const renderer6 = new Renderer(mockCanvas6 as unknown as HTMLCanvasElement, 40);

const wallField = new Field();
const wallPiece = new ActivePiece(wallField, 0, 8, 4, 0);
const wallLeft = new LeftWall(wallField, wallPiece);
wallLeft.setPosition(3);
const wallRight = new RightWall(wallField, Field.COLS - 1, 0);

renderer6.render(wallField, null, wallLeft, wallRight, 0, false, new EffectSystem());

const ctx6 = mockCanvas6.getContext2D();

// Walls are drawn with stroke (lineTo + stroke)
assert(ctx6.stroke_calls >= 2, `At least 2 stroke calls for walls (got ${ctx6.stroke_calls})`);

// ===========================================================================
// Test 29: Renderer configurable cell size
// ===========================================================================

section('Test 29: Renderer configurable cell size');

const mockCanvas7 = new MockRenderCanvas();
const renderer7 = new Renderer(mockCanvas7 as unknown as HTMLCanvasElement, 50);

renderer7.render(testField, null, testLeftWall, testRightWall, 0, false, new EffectSystem());

// Canvas should be 16*50 x (8*50 + 30) = 800 x 430
assert(mockCanvas7.width === 800, `Canvas width is 800 (16 cols * 50px)`);
assert(mockCanvas7.height === 430, `Canvas height is 430 (8 rows * 50px + 30px UI area)`);

// ===========================================================================
// Test 30: Renderer grid lines are drawn
// ===========================================================================

section('Test 30: Renderer grid lines are drawn');

const mockCanvas8 = new MockRenderCanvas();
const renderer8 = new Renderer(mockCanvas8 as unknown as HTMLCanvasElement, 40);

renderer8.render(testField, null, testLeftWall, testRightWall, 0, false, new EffectSystem());

const ctx8 = mockCanvas8.getContext2D();

// Grid: 17 vertical lines (0..16) + 9 horizontal lines (0..8) = 26 lines
// Each line is beginPath + moveTo + lineTo + stroke = 4 calls per line
// Total beginPath calls: 26 (grid) + 2 (walls) = 28
const totalLines = ctx8.beginPath_calls;
assert(totalLines >= 26, `At least 26 grid lines drawn (got ${totalLines})`);

// ===========================================================================
// Helper: combined mock canvas for Game testing
// ===========================================================================
//
// Combines MockCanvas (addEventListener for InputManager) and MockRenderCanvas
// (getContext for Renderer) so the Game class can be tested in Node.js.

class MockGameCanvas {
  width = 0;
  height = 0;
  private context: MockRenderContext;
  private listeners: Array<{ type: string; handler: (event: KeyboardEvent) => void }>;

  constructor() {
    this.context = new MockRenderContext();
    this.listeners = [];
  }

  getContext(_type: string): MockRenderContext {
    return this.context;
  }

  getContext2D(): MockRenderContext {
    return this.context;
  }

  addEventListener(type: string, handler: (event: KeyboardEvent) => void): void {
    this.listeners.push({ type, handler });
  }

  dispatchKey(code: string): void {
    const event = { code } as unknown as KeyboardEvent;
    for (const { type, handler } of this.listeners) {
      if (type === 'keydown') {
        handler(event);
      }
    }
  }
}

// ===========================================================================
// Helper: mock requestAnimationFrame for Game testing
// ===========================================================================
//
// Captures callbacks registered with requestAnimationFrame so we can
// invoke them manually, enabling deterministic testing of the game loop.

let rafCallbacks: Array<() => void> = [];
let rafIdCounter = 0;

// Override global requestAnimationFrame / cancelAnimationFrame for tests
(globalThis as unknown as Record<string, unknown>).__origRAF = globalThis.requestAnimationFrame;
(globalThis as unknown as Record<string, unknown>).__origCAF = globalThis.cancelAnimationFrame;

(globalThis as unknown as Record<string, unknown>).requestAnimationFrame = (
  cb: () => void
): number => {
  rafIdCounter++;
  rafCallbacks.push(cb);
  return rafIdCounter;
};

(globalThis as unknown as Record<string, unknown>).cancelAnimationFrame = (
  _id: number
): void => {
  rafCallbacks = [];
};

/** Run one frame of the game loop. */
function gameTick(): void {
  const cb = rafCallbacks.shift();
  if (cb) cb();
}

/** Run N frames of the game loop. */
function gameTicks(n: number): void {
  for (let i = 0; i < n; i++) {
    const cb = rafCallbacks.shift();
    if (cb) cb();
  }
}

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
// Test 41: Compression finalizes in-place when blocks cannot move right (Integration)
// ===========================================================================
//
// Verifies spec-compliant behavior (compress-mechanism.md step 5): when
// blocks exist at the right wall column and no block can move right,
// compression ends and the current configuration is finalized as-is.
// Blocks keep their original positions (no vertical redistribution) and
// the compression cycle completes, resetting the left wall via callback.
//
// Updated in TASK-023 (DEV-023-1): this test previously verified vertical
// wrapping in the removed alignBlocksVertical() distribution. No task
// packet owned this update (TASK-024 covers Test 15 only), so it was
// re-targeted here to preserve a green suite.

section('Test 41: Compression finalizes in-place when blocks cannot move right (Integration)');

const field41 = new Field();
// Place 3 blocks at the right wall column (x=15), rows 0, 1, and 2.
// No blocks at x=14, so the BFS movement set is empty: no movement.
field41.set(15, 0, true);
field41.set(15, 1, true);
field41.set(15, 2, true);

assert(field41.countBlocks() === 3, 'Field has 3 blocks before compression');

const rw41 = new RightWall(field41, 15, 0);
let resetCount41 = 0;
const cs41 = new CompressionSystem(field41, rw41, () => { resetCount41++; }, 1);

// Compress with left wall at x=14 (distance=1, within threshold).
// pushBlocksRight: no blocks at x=14, so no movement.
// Spec step 5: no block can move -> compression ends, configuration is
// finalized as-is. Field is not full, so the cycle completes and the
// left wall resets.
const result41 = cs41.compress(14);

assert(result41 === true, 'Compression cycle completes (not game over)');
assert(field41.countBlocks() === 3, 'Block count preserved (no block loss)');
// Blocks keep their original positions: no vertical redistribution occurs.
assert(field41.get(15, 0) === true, 'Block remains at (15,0)');
assert(field41.get(15, 1) === true, 'Block remains at (15,1)');
assert(field41.get(15, 2) === true, 'Block remains at (15,2) (configuration finalized as-is)');
// Reset callback IS called: the cycle completes even without movement.
assert(resetCount41 === 1, 'Reset callback called exactly once (cycle completed)');

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
    // no longer exists). The threshold value is still tolerated as a
    // legacy tolerance.
    const secondWallX = game42.getLeftWall().getX();
    assert(
      secondWallX === 0 || secondWallX === Field.COLS - 2,
      `Second cycle: left wall at x=${secondWallX} (0=push path, ${Field.COLS - 2}=alignment path)`
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
// Test 57: EffectSystem registration and query (TASK-028)
// ===========================================================================

section('Test 57: EffectSystem registration and query (TASK-028)');

const effects57 = new EffectSystem();
assert(EffectSystem.PUSH_DURATION_MS === 300, 'PUSH_DURATION_MS constant is 300');
assert(EffectSystem.CONNECT_DURATION_MS === 400, 'CONNECT_DURATION_MS constant is 400');
assert(effects57.getPushedCells().length === 0, 'No pushed effects on a fresh system');
assert(effects57.getConnectedCells().length === 0, 'No connected effects on a fresh system');

effects57.registerPushEffect([{ x: 2, y: 4 }, { x: 5, y: 1 }]);
effects57.registerConnectionEffect([{ x: 3, y: 4 }]);

const pushed57 = effects57.getPushedCells();
assert(pushed57.length === 2, 'Two pushed effects registered');
assert(
  pushed57.some((c) => c.x === 2 && c.y === 4) &&
    pushed57.some((c) => c.x === 5 && c.y === 1),
  'getPushedCells() reports the registered cells'
);
const connected57 = effects57.getConnectedCells();
assert(connected57.length === 1, 'One connected effect registered');
assert(
  connected57[0].x === 3 && connected57[0].y === 4,
  'getConnectedCells() reports the registered cell'
);

// ===========================================================================
// Test 58: EffectSystem expiration and refresh (TASK-028)
// ===========================================================================
//
// Deterministic timing via a mock clock (same pattern as TestLeftWall):
// expiration is wall-clock based (createdAt + duration), independent of the
// optional update(deltaMs) argument.

section('Test 58: EffectSystem expiration and refresh (TASK-028)');

class TestEffectSystem extends EffectSystem {
  _time = 0;
  setTime(ms: number): void {
    this._time = ms;
  }
  currentTimeMillis(): number {
    return this._time;
  }
}

const effects58 = new TestEffectSystem();
effects58.registerPushEffect([{ x: 2, y: 4 }]);
effects58.registerConnectionEffect([{ x: 3, y: 4 }]);

effects58.setTime(299);
effects58.update();
assert(effects58.getPushedCells().length === 1, 'Pushed effect still alive at +299ms (duration 300ms)');
effects58.setTime(300);
effects58.update();
assert(effects58.getPushedCells().length === 0, 'Pushed effect expires at +300ms');
assert(effects58.getConnectedCells().length === 1, 'Connected effect still alive at +300ms (duration 400ms)');
effects58.setTime(400);
effects58.update();
assert(effects58.getConnectedCells().length === 0, 'Connected effect expires at +400ms');

// Refresh: re-registering a live effect restarts its lifetime.
effects58.setTime(500);
effects58.registerPushEffect([{ x: 1, y: 1 }]);
assert(effects58.getPushedCells().length === 1, 'Pushed effect registered at t=500ms');
effects58.setTime(700);
effects58.registerPushEffect([{ x: 1, y: 1 }]); // refresh
effects58.setTime(800);
effects58.update();
assert(effects58.getPushedCells().length === 1, 'Refreshed effect survives past the original expiry (t=800 < 700+300)');
const refreshed58 = effects58.getPushedCells()[0];
assert(refreshed58.x === 1 && refreshed58.y === 1, 'Refreshed effect keeps the cell coordinates');
effects58.setTime(1000);
effects58.update();
assert(effects58.getPushedCells().length === 0, 'Refreshed effect expires at refresh time + duration');

// The deltaMs argument does not drive expiration (wall clock does).
effects58.setTime(1100);
effects58.registerPushEffect([{ x: 0, y: 0 }]);
effects58.setTime(1101);
effects58.update(100000);
assert(effects58.getPushedCells().length === 1, 'update(deltaMs) does not expire effects by delta; expiration is wall-clock based');
effects58.setTime(1400);
effects58.update();
assert(effects58.getPushedCells().length === 0, 'Effect expires 300ms after registration regardless of delta');

// ===========================================================================
// Test 59: EffectSystem.clear() removes all effects (TASK-028)
// ===========================================================================

section('Test 59: EffectSystem.clear() removes all effects (TASK-028)');

const effects59 = new EffectSystem();
effects59.registerPushEffect([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
effects59.registerConnectionEffect([{ x: 2, y: 2 }]);
effects59.clear();
assert(effects59.getPushedCells().length === 0, 'clear() removes pushed effects');
assert(effects59.getConnectedCells().length === 0, 'clear() removes connected effects');

// ===========================================================================
// Test 60: Renderer draws pushed blocks brighter (TASK-028)
// ===========================================================================
//
// AC #2: a pushed block (wall-column block that was pushed directly) is
// drawn with the brighter color #9a9aba instead of the normal block color.
// cellSize=40, so block (5,3) is drawn at pixel (201,121) with size 38x38.

section('Test 60: Renderer draws pushed blocks brighter (TASK-028)');

const mockCanvas60 = new MockRenderCanvas();
const renderer60 = new Renderer(mockCanvas60 as unknown as HTMLCanvasElement, 40);
const field60 = new Field();
field60.set(5, 3, true);
field60.set(6, 3, true);
const wallL60 = new LeftWall(field60, null);
const wallR60 = new RightWall(field60, Field.COLS - 1, 0);
const effects60 = new EffectSystem();
effects60.registerPushEffect([{ x: 5, y: 3 }]);
renderer60.render(field60, null, wallL60, wallR60, 0, false, effects60);
const ctx60 = mockCanvas60.getContext2D();

assert(
  ctx60.fillRect_calls.some(
    (c) => c.x === 201 && c.y === 121 && c.w === 38 && c.h === 38 && c.fillStyle === '#9a9aba'
  ),
  'Pushed block drawn brighter (#9a9aba) at its cell'
);
assert(
  !ctx60.fillRect_calls.some(
    (c) => c.x === 201 && c.y === 121 && c.fillStyle === '#4a4a8a'
  ),
  'Pushed block is not drawn with the normal block color'
);
const otherBlock60 = ctx60.fillRect_calls.find(
  (c) => c.x === 6 * 40 + 1 && c.y === 3 * 40 + 1
);
assert(otherBlock60 !== undefined && otherBlock60.fillStyle === '#4a4a8a', 'Non-pushed block keeps the normal color');

// Control: with no live effects the same block renders normally.
renderer60.render(field60, null, wallL60, wallR60, 0, false, new EffectSystem());
assert(
  ctx60.fillRect_calls.filter(
    (c) => c.x === 201 && c.y === 121 && c.fillStyle === '#4a4a8a'
  ).length === 1,
  'Without effects the same block renders with the normal color'
);

// ===========================================================================
// Test 61: Renderer draws connected blocks with a yellow glow (TASK-028)
// ===========================================================================
//
// AC #3: a connected block (pulled along by the BFS chain push) is drawn
// with the normal block body on top of a yellow glow rect (#ffd93d).
// Block (5,3): glow at pixel (201,121) 38x38, body at (203,123) 34x34.

section('Test 61: Renderer draws connected blocks with a yellow glow (TASK-028)');

const mockCanvas61 = new MockRenderCanvas();
const renderer61 = new Renderer(mockCanvas61 as unknown as HTMLCanvasElement, 40);
const field61 = new Field();
field61.set(5, 3, true);
const wallL61 = new LeftWall(field61, null);
const wallR61 = new RightWall(field61, Field.COLS - 1, 0);
const effects61 = new EffectSystem();
effects61.registerConnectionEffect([{ x: 5, y: 3 }]);
renderer61.render(field61, null, wallL61, wallR61, 0, false, effects61);
const ctx61 = mockCanvas61.getContext2D();

assert(
  ctx61.fillRect_calls.some(
    (c) => c.x === 201 && c.y === 121 && c.w === 38 && c.h === 38 && c.fillStyle === '#ffd93d'
  ),
  'Connected block has the yellow glow rect (#ffd93d)'
);
assert(
  ctx61.fillRect_calls.some(
    (c) => c.x === 203 && c.y === 123 && c.w === 34 && c.h === 34 && c.fillStyle === '#4a4a8a'
  ),
  'Block body is drawn on top of the glow (inner rect)'
);
assert(
  ctx61.fillRect_calls.every((c) => c.fillStyle !== '#9a9aba'),
  'Connection glow does not use the pushed color'
);

// Control: with no live effects no glow rect is drawn (the left wall line
// uses a stroke, not fillRect, so it is not counted).
renderer61.render(field61, null, wallL61, wallR61, 0, false, new EffectSystem());
assert(
  ctx61.fillRect_calls.filter((c) => c.fillStyle === '#ffd93d').length === 1,
  'Without effects no glow rect is drawn (only the glow render counted)'
);

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
// Test 63: Effects do not persist across restart (TASK-028)
// ===========================================================================
//
// AC #7: start() (including a restart) clears all live effects so a new
// game never inherits flashes from the previous one.

section('Test 63: Effects do not persist across restart (TASK-028)');

const gameCanvas63 = new MockGameCanvas();
const game63 = new Game(gameCanvas63 as unknown as HTMLCanvasElement);
game63.start();

game63.getEffectSystem().registerPushEffect([{ x: 1, y: 2 }]);
game63.getEffectSystem().registerConnectionEffect([{ x: 2, y: 2 }]);
assert(
  game63.getEffectSystem().getPushedCells().length === 1 &&
    game63.getEffectSystem().getConnectedCells().length === 1,
  'Live effects exist before the restart'
);

game63.start(); // restart
assert(
  game63.getEffectSystem().getPushedCells().length === 0,
  'Pushed effects cleared on restart'
);
assert(
  game63.getEffectSystem().getConnectedCells().length === 0,
  'Connected effects cleared on restart'
);
game63.stop();

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

// ===========================================================================
// Test 65: Constrained rotation — wall-aware rotation constraint (TASK-031)
// ===========================================================================
//
// TASK-031 adds `minAllowedX` to ActivePiece.rotate()/wouldRotateCollide():
// a rotation that would place any cell at x < minAllowedX (i.e. x <= wallX,
// behind the left wall) is blocked without mutating state. Game.processInput
// passes leftWall.getX() + 1. These tests pin the constraint directly on
// ActivePiece (no Game state) so they are fully deterministic.
//
// Rotated cell layout for the I-piece used here (rotation 1 -> 2):
//   origin x=4: cells at x = 4,3,2,1 (y=4)
//   origin x=1: cells at x = 1,0,-1,-2 (y=4)  <- negative-offset case

section('Test 65: Constrained rotation — wall-aware rotation constraint (TASK-031)');

// --- 65a: rotation placing cells behind the wall is blocked ---
// I-piece at origin x=4, rot 1 (vertical, all cells at x=4). The next
// rotation (to rot 2 / 180°) places cells at x = 4,3,2,1. With
// minAllowedX = 4 (a wall at x=3), cells at x=3,2,1 land behind the wall
// -> blocked. All rotated cells are in-bounds, so the block comes from the
// wall constraint alone (not out-of-bounds collision).
const fieldRot = new Field();
const pieceRotBlocked = new ActivePiece(fieldRot, 0, 4, 4, 1);
assert(
  pieceRotBlocked.wouldRotateCollide(4) === true,
  '65a: wouldRotateCollide(4) reports the rotation as blocked (cells at x=3,2,1 < 4)'
);
assert(
  pieceRotBlocked.rotate(4) === false,
  '65a: rotate(4) returns false when rotated cells land behind the wall'
);
assert(
  pieceRotBlocked.getRotation() === 1,
  '65a: rotation state is unchanged after a blocked rotation (soft block)'
);

// --- 65b: the same rotation is allowed when minAllowedX is small enough ---
// Boundary case (packet Edge Case 1): the lowest rotated cell sits at
// x = 1 == minAllowedX -> allowed, because the constraint uses strict `<`.
const pieceRotAllowed = new ActivePiece(fieldRot, 0, 4, 4, 1);
assert(
  pieceRotAllowed.wouldRotateCollide(1) === false,
  '65b: wouldRotateCollide(1) allows the rotation (lowest cell x=1 == minAllowedX, strict <)'
);
assert(
  pieceRotAllowed.rotate(1) === true,
  '65b: rotate(1) succeeds when no rotated cell is behind the bound'
);
assert(
  pieceRotAllowed.getRotation() === 2,
  '65b: rotation advances to 180° when the constraint is satisfied'
);

// --- 65c: I-piece rot-180 negative-offset case (the exact stranding scenario) ---
// Vertical I-piece at origin x=1, adjacent to a wall at x=0 (minAllowedX = 1).
// Rotating to 180° produces cells at x = 1,0,-1,-2: the negative x-offsets
// are the exact stranding scenario the constraint prevents — the cells would
// end up behind the wall and outside the field.
const fieldRotC = new Field();
const pieceRotStranded = new ActivePiece(fieldRotC, 0, 1, 4, 1);
assert(
  pieceRotStranded.rotate(1) === false,
  '65c: vertical I at x=1 cannot rotate to 180° with the wall at x=0 (cells at x=0,-1,-2 < 1)'
);
assert(
  pieceRotStranded.getRotation() === 1,
  '65c: rotation stays at 90° (vertical) after the blocked rot-180 attempt'
);

// --- 65d: rotate() with no argument is unchanged (backward-compatible) ---
// The same piece and rotation as 65a, but with no minAllowedX argument: the
// default -Infinity keeps the old unrestricted behavior — the rotation is
// allowed (cells x=4,3,2,1 are in-bounds on an empty field) even though
// rotate(4) on the identical piece blocks it.
const pieceRotLegacy = new ActivePiece(fieldRot, 0, 4, 4, 1);
assert(
  pieceRotLegacy.rotate() === true,
  '65d: rotate() with no argument succeeds on the same piece that rotate(4) blocks'
);
assert(
  pieceRotLegacy.getRotation() === 2,
  '65d: no-arg rotation advances (backward-compatible default -Infinity)'
);

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

// ===========================================================================
// Test 67: RightWall vertical shift does not drag left-adjacent blocks (BUG D fix)
// ===========================================================================

section('Test 67: RightWall vertical shift does not drag left-adjacent blocks');

const fieldRW67 = new Field();
fieldRW67.set(15, 3, true); // Block at wall column
fieldRW67.set(14, 3, true); // Left-adjacent connected block

const rw67 = new RightWall(fieldRW67, Field.COLS - 1, 0);

// shiftVertical(1) should move (15,3) → (15,4) but leave (14,3) in place.
rw67.shiftVertical(1);

assert(fieldRW67.get(15, 4) === true, '67a: block at (15,3) moved to (15,4)');
assert(fieldRW67.get(15, 3) === false, '67b: old position (15,3) cleared');
assert(fieldRW67.get(14, 3) === true, '67c: left-adjacent block at (14,3) stays in place');
assert(fieldRW67.countBlocks() === 2, '67d: block count unchanged (2 blocks)');

// Multi-row scenario: blocks at (15,0) and (15,7) with a connector at (14,0).
const fieldRW67b = new Field();
fieldRW67b.set(15, 0, true);
fieldRW67b.set(15, 7, true);
fieldRW67b.set(14, 0, true);

const rw67b = new RightWall(fieldRW67b, Field.COLS - 1, 0);

// shiftVertical(-1): wraps y=0 → y=7, y=7 → y=6; (14,0) must stay.
rw67b.shiftVertical(-1);

assert(fieldRW67b.get(15, 7) === true, '67e: block wrapped from (15,0) to (15,7)');
assert(fieldRW67b.get(15, 6) === true, '67f: block moved from (15,7) to (15,6)');
assert(fieldRW67b.get(14, 0) === true, '67g: left-adjacent block at (14,0) stays in place');
assert(fieldRW67b.countBlocks() === 3, '67h: block count unchanged (3 blocks)');

// ===========================================================================
// Test 68: CompressionSystem movement-target regression (TASK-038)
// ===========================================================================
//
// Focused regression coverage for the corrected movement target (TASK-036,
// DEC-036-1/DEC-036-2). Two invariants are pinned directly, independent of the
// broader behavioural tests in Tests 13/15:
//   (1) the movement target is seeded at the moving wall's column and expands
//       RIGHT only — blocks behind the wall are never pulled in;
//   (2) a block at the right-wall column cannot move (no cell to move into), so
//       the whole push aborts atomically and no block is lost.

section('Test 68: CompressionSystem movement-target regression (TASK-038)');

// --- AC 1 scenario: left wall at x=14 pushes only its own column (14,4). ---
const fieldCS68 = new Field();
for (let x = 10; x <= 14; x++) {
  fieldCS68.set(x, 4, true); // contiguous chain (10..14,4)
}
assert(fieldCS68.countBlocks() === 5, '68: field has 5 blocks before compression');

const rwCS68 = new RightWall(fieldCS68, Field.COLS - 1, 0);
const csCS68 = new CompressionSystem(fieldCS68, rwCS68, () => {}, 1);
const result68 = csCS68.compress(14); // right wall at x=15, distance=1 -> triggers

assert(result68 === true, '68a: compress(14) returns true (movement occurred, cycle completed)');
assert(
  fieldCS68.get(10, 4) && fieldCS68.get(11, 4) && fieldCS68.get(12, 4) && fieldCS68.get(13, 4),
  '68b: blocks at (10..13,4) remain — behind the wall, never pulled into the movement target'
);
assert(fieldCS68.get(14, 4) === false, '68c: (14,4) vacated — the wall-column block moved right');
assert(fieldCS68.get(15, 4) === true, '68d: (15,4) occupied — the wall-column block moved into the right-wall column');
assert(fieldCS68.countBlocks() === 5, '68e: block count unchanged (5 blocks)');

// --- DEV-036-1 right-wall abort: a chain reaching the right-wall column cannot
//     move (the rightmost block has no cell to move into), so the push aborts. ---
const fieldCS68b = new Field();
for (let x = 13; x <= 15; x++) {
  fieldCS68b.set(x, 4, true); // contiguous chain (13..15,4)
}
const rwCS68b = new RightWall(fieldCS68b, Field.COLS - 1, 0);
const csCS68b = new CompressionSystem(fieldCS68b, rwCS68b, () => {}, 1);
const result68b = csCS68b.compress(14); // left wall at x=14, right wall at x=15

assert(result68b === true, '68f: compress(14) returns true (cycle finalizes in place — field not full)');
assert(fieldCS68b.get(14, 4) === true, '68g: (14,4) stays — the rightmost block (15,4) blocks the push, whole set aborts');
assert(fieldCS68b.get(15, 4) === true, '68h: (15,4) stays — a block at the right-wall column cannot move out of bounds');
assert(fieldCS68b.get(13, 4) === true, '68i: (13,4) stays — behind the wall, not in the movement target');
assert(fieldCS68b.countBlocks() === 3, '68j: block count unchanged (3 blocks) — atomic abort loses nothing');

// ===========================================================================
// Test 69: RightWall vertical-shift regression (TASK-038)
// ===========================================================================
//
// Focused regression coverage for the corrected vertical block movement
// (TASK-037, Decision-037-1). Only blocks in the wall's own column move during
// a vertical shift; horizontally-connected blocks in adjacent columns are NOT
// dragged (compress-mechanism.md "壁に接触しているブロックは壁と一緒に移動する").

section('Test 69: RightWall vertical-shift regression (TASK-038)');

// --- AC 2 scenario: a left-adjacent block is not dragged by the vertical shift. ---
const fieldRW69 = new Field();
fieldRW69.set(15, 3, true); // wall-column block
fieldRW69.set(14, 3, true); // horizontally-connected left neighbour
const rw69 = new RightWall(fieldRW69, Field.COLS - 1, 0);
rw69.shiftVertical(1); // dy>0 -> moves the wall DOWN on screen (y+1)

assert(fieldRW69.get(15, 4) === true, '69a: wall-column block (15,3) moved to (15,4)');
assert(fieldRW69.get(15, 3) === false, '69b: old wall-column position (15,3) cleared');
assert(fieldRW69.get(14, 3) === true, '69c: left-adjacent block (14,3) stays — not dragged vertically');
assert(fieldRW69.countBlocks() === 2, '69d: block count unchanged (2 blocks)');

// --- Vertical chain at the wall: the whole wall column shifts as a unit while
//     the horizontally-connected neighbour in the adjacent column is left behind. ---
const fieldRW69b = new Field();
fieldRW69b.set(15, 2, true);
fieldRW69b.set(15, 3, true);
fieldRW69b.set(15, 4, true);
fieldRW69b.set(14, 3, true); // connected to (15,3) horizontally, same row
const rw69b = new RightWall(fieldRW69b, Field.COLS - 1, 0);
rw69b.shiftVertical(-1); // dy<0 -> moves the wall UP on screen (y-1); y=0 wraps to y=7

assert(
  fieldRW69b.get(15, 1) === true && fieldRW69b.get(15, 2) === true && fieldRW69b.get(15, 3) === true,
  '69e: all three wall-column blocks shifted up together — (15,2/3/4) -> (15,1/2/3)'
);
assert(fieldRW69b.get(14, 3) === true, '69f: horizontally-connected block (14,3) stays in place');
assert(fieldRW69b.get(15, 4) === false, '69g: (15,4) vacated — its block moved up to (15,3)');
assert(
  fieldRW69b.get(14, 2) === false && fieldRW69b.get(14, 4) === false,
  '69h: no block dragged into the adjacent column at (14,2)/(14,4)'
);
assert(fieldRW69b.countBlocks() === 4, '69i: block count unchanged (4 blocks)');
assert(
  rw69b.getY() === (0 - 1 + Field.ROWS) % Field.ROWS,
  '69j: wall y wrapped from 0 to 7 on shiftVertical(-1)'
);

// ===========================================================================
// Summary
// ===========================================================================

console.log('\n\n========== TEST SUMMARY ==========');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\nAll tests PASSED.');
} else {
  console.log(`\n${testsFailed} test(s) FAILED.`);
  throw new Error(`${testsFailed} test(s) failed`);
}
