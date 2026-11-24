// ===========================================================================
// Component tests: ActivePiece shapes, rotation, predictive rotation check.
// Verbatim split from src/main.ts (TASK-042). Tests 2, 3, 6, 14, 15, 65
// (Test 6 merged in per F-IT9-06). Section order and assertions unchanged.
// ===========================================================================

import { assert, section } from './harness.js';
import { Field } from '../Field.js';
import { ActivePiece } from '../ActivePiece.js';
import { RightWall } from '../RightWall.js';
import { CompressionSystem } from '../CompressionSystem.js';

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
