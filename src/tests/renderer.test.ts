// ===========================================================================
// Component tests: Renderer construction, drawing (blocks, walls, grid, score,
// game-over), pushed/connected effects. Verbatim split from src/main.ts
// (TASK-042). Tests 23-30, 60, 61. The shared testField/testPiece/testLeftWall/
// testRightWall consts are declared at the top of this file (DEC-042-7).
// ===========================================================================

import { assert, section } from './harness.js';
import { MockRenderContext, MockRenderCanvas } from './mocks.js';
import { Field } from '../Field.js';
import { ActivePiece } from '../ActivePiece.js';
import { LeftWall } from '../LeftWall.js';
import { RightWall } from '../RightWall.js';
import { Renderer } from '../Renderer.js';
import { EffectSystem } from '../EffectSystem.js';

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