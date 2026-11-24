// ===========================================================================
// Component tests: RightWall vertical shift, vertical-shift regression.
// Verbatim split from src/main.ts (TASK-042). Tests 9, 10, 67, 69.
// Section order and assertions unchanged.
// ===========================================================================

import { assert, section } from './harness.js';
import { Field } from '../Field.js';
import { RightWall } from '../RightWall.js';

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
