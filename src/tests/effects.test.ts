// ===========================================================================
// Component tests: EffectSystem registration, expiration/refresh, clear,
// renderer effect drawing, full-game-flow integration.
// Verbatim split from src/main.ts (TASK-042). Tests 57, 58, 59, 63.
// ===========================================================================

import { assert, section } from './harness.js';
import { MockGameCanvas, gameTick } from './mocks.js';
import { Field } from '../Field.js';
import { ActivePiece } from '../ActivePiece.js';
import { LeftWall } from '../LeftWall.js';
import { RightWall } from '../RightWall.js';
import { Game } from '../Game.js';
import { EffectSystem } from '../EffectSystem.js';

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