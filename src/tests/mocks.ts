// ===========================================================================
// Shared test doubles, mock canvas/context, RAF overrides, and pure shape helpers.
// TASK-042: extracted from src/main.ts. The RAF overrides are module-scope side
// effects: they execute at mocks.js evaluation time (imported first by main.ts),
// before any component test body runs.
// ===========================================================================

import { LeftWall } from '../LeftWall.js';
import { Game } from '../Game.js';
import type { TetriminoShape } from '../ActivePiece.js';

// --- Deterministic LeftWall clock seam (TestLeftWall) ---
export class TestLeftWall extends LeftWall {
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

// --- Deterministic RNG seam (TestGame) ---
// TASK-040: deterministic RNG seam — overrides randomSource() with a seeded LCG
// so future tests that depend on piece-kind sequence are reproducible.
export class TestGame extends Game {
  private _seed: number;
  constructor(canvas: MockGameCanvas, seed = 12345) {
    super(canvas as unknown as HTMLCanvasElement);
    this._seed = seed;
  }
  protected randomSource(): number {
    // Deterministic LCG (Numerical Recipes constants)
    this._seed = (this._seed * 1103515245 + 12345) & 0x7fffffff;
    return this._seed / 0x7fffffff;
  }
}

// --- Pure shape helpers (shared across component test files) ---
// Moved from the Test 1 block in src/main.ts (DEV-042-2). These are pure
// functions used across component file boundaries (shapeToKey in game.test.ts,
// shapesEqual in compression.test.ts). The parameter type annotation that was
// `typeof I_SHAPE` in the monolithic file is expressed with the exported
// TetriminoShape type (identical type; the I_SHAPE consts are not in this file).
export function shapeToKey(shape: TetriminoShape): string {
  return shape
    .map((c) => `${c.x},${c.y}`)
    .sort()
    .join('|');
}

export function shapesEqual(a: TetriminoShape, b: TetriminoShape): boolean {
  if (a.length !== b.length) return false;
  const aKey = a.map((c) => `${c.x},${c.y}`).sort().join('|');
  const bKey = b.map((c) => `${c.x},${c.y}`).sort().join('|');
  return aKey === bKey;
}

// --- Mock canvas for InputManager testing (MockCanvasElement + MockCanvas) ---
export interface MockCanvasElement {
  addEventListener(type: string, handler: (event: KeyboardEvent) => void): void;
  dispatchKey(code: string): void;
}

export class MockCanvas implements MockCanvasElement {
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

// --- Mock canvas/context for Renderer & Game testing ---
export class MockRenderContext {
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

export class MockRenderCanvas {
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

// --- Combined mock canvas for Game testing + RAF override + frame helpers ---
// ===========================================================================
// Helper: combined mock canvas for Game testing
// ===========================================================================
//
// Combines MockCanvas (addEventListener for InputManager) and MockRenderCanvas
// (getContext for Renderer) so the Game class can be tested in Node.js.

export class MockGameCanvas {
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

export let rafCallbacks: Array<() => void> = [];
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
export function gameTick(): void {
  const cb = rafCallbacks.shift();
  if (cb) cb();
}

/** Run N frames of the game loop. */
export function gameTicks(n: number): void {
  for (let i = 0; i < n; i++) {
    const cb = rafCallbacks.shift();
    if (cb) cb();
  }
}
