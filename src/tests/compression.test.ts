// ===========================================================================
// Component tests: CompressionSystem movement target, no-movement path,
// movement-target regression. Verbatim split from src/main.ts (TASK-042).
// Tests 7, 8, 13, 41, 68, 70. Section order and assertions unchanged.
// ===========================================================================

import { assert, section } from './harness.js';
import { TestGame, shapeToKey, shapesEqual } from './mocks.js';
import { Field } from '../Field.js';
import { ActivePiece } from '../ActivePiece.js';
import { RightWall } from '../RightWall.js';
import { CompressionSystem } from '../CompressionSystem.js';

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
// Test 70: compress() one-column invariant and no-movement idempotency
// ===========================================================================

section('Test 70: compress() one-column invariant and no-movement idempotency');

// --- (a) Single-step compression pin: only one column moves per compress() call. ---
const field70a = new Field();
field70a.set(11, 4, true);
field70a.set(12, 4, true);
field70a.set(13, 4, true);
field70a.set(14, 4, true);
const rw70a = new RightWall(field70a, Field.COLS - 1, 0); // x=15
const cs70a = new CompressionSystem(field70a, rw70a, null, 1);
const result70a = cs70a.compress(14);

assert(result70a === true, '70a: compress(14) returns true (movement occurred)');
assert(field70a.get(15, 4) === true, '70b: block moved from (14,4) to (15,4)');
assert(field70a.get(14, 4) === false, '70c: (14,4) vacated');
assert(field70a.get(11, 4) === true, '70d: block at (11,4) unchanged');
assert(field70a.get(12, 4) === true, '70e: block at (12,4) unchanged');
assert(field70a.get(13, 4) === true, '70f: block at (13,4) unchanged');
assert(field70a.countBlocks() === 4, '70g: total block count = 4 (no blocks lost or created)');

// --- (b) No-movement idempotency: compress() at a wall position with no blocks
//     at the wall column is a safe no-op (returns true, field unchanged). ---
const field70b = new Field();
field70b.set(15, 4, true); // block at x=15, but leftWallX=14 → no blocks at x=14
const rw70b = new RightWall(field70b, Field.COLS - 1, 0); // x=15
const cs70b = new CompressionSystem(field70b, rw70b, null, 1); // onLeftWallReset = null
const result70b = cs70b.compress(14);

assert(result70b === true, '70h: compress(14) returns true (no-movement path, field not full)');
assert(field70b.get(15, 4) === true, '70i: block at (15,4) unchanged (no movement occurred)');
assert(field70b.countBlocks() === 1, '70j: total block count = 1 (unchanged)');
