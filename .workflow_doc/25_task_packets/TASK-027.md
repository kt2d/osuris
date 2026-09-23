# TASK-027: Dynamic Push Speed

## Objective

Implement progressive difficulty: the left wall starts at 400ms per tick (half the current 200ms) and gradually accelerates to 200ms/tick over 10 seconds of elapsed game time.

## Business Context

A constant wall speed feels static. A progressive speed increase creates tension as the game goes on. Starting slower gives players time to adapt; accelerating creates urgency.

## Scope

### Files to Modify

1. **`src/Game.ts`**
   - Add `startTime: number` property (set in `start()`)
   - Add `elapsedTime(): number` method
   - Pass elapsed time to `LeftWall.tick(elapsedMs)`

2. **`src/LeftWall.ts`**
   - Modify `tick(elapsedMs: number)`: compute dynamic interval from elapsed time
   - Add `getTickInterval(elapsedMs: number): number` method

### Files NOT Modified

- No new files
- No changes to Field, ActivePiece, RightWall, CompressionSystem, Renderer, InputManager

## Implementation

### Game.ts Changes

```typescript
// Add property
private startTime: number = 0;

// In start():
this.startTime = this.currentTimeMillis();

// New method
private currentTimeMillis(): number {
  return Date.now();
}

private elapsedTime(): number {
  return Date.now() - this.startTime;
}

// In updatePlaying():
this.leftWall.tick(this.elapsedTime());
```

### LeftWall.ts Changes

```typescript
// Modify tick signature
tick(elapsedMs: number): boolean {
  const now = this.currentTimeMillis();
  const elapsed = now - this.lastTickMs;

  if (elapsed >= this.tickIntervalMs) {
    // Compute dynamic interval based on elapsed game time
    const dynamicInterval = this.getDynamicInterval(elapsedMs);
    
    // Use dynamicInterval for next tick timing
    this.lastTickMs = now;
    this.x++;
    this.onWallAdvanced();
    return true;
  }
  return false;
}

private getDynamicInterval(elapsedMs: number): number {
  // Formula: starts at 400ms, ramps down to 200ms over 10 seconds
  const rampDuration = 10000; // 10 seconds
  const maxInterval = 400;    // ms at start
  const minInterval = 200;    // ms after ramp completes
  
  const progress = Math.min(elapsedMs / rampDuration, 1);
  return maxInterval - progress * (maxInterval - minInterval);
}
```

### Speed Ramp Curve

| Elapsed Time | Tick Interval | Speed (ticks/sec) |
|---|---|---|
| 0s | 400ms | 2.5 |
| 2.5s | 350ms | 2.86 |
| 5s | 300ms | 3.33 |
| 7.5s | 250ms | 4.0 |
| 10s+ | 200ms | 5.0 |

### Wall Reset After Compression

When the left wall resets (compresses), the `startTime` should NOT reset. The speed is based on total elapsed game time, not time since last wall reset. This means the wall continues accelerating across compression cycles.

**Rationale**: The speed increase is a game-wide difficulty ramp, not a per-cycle timer. This creates increasing tension throughout the game.

## Constraints

- `npx tsc` must produce 0 errors
- All 280+ existing tests must pass (Failed: 0)
- The `tick()` method signature changes from `tick(): boolean` to `tick(elapsedMs: number): boolean`
- This is a breaking change for any code that calls `tick()` — update all call sites

## Acceptance Criteria

1. `LeftWall.tick(elapsedMs)` computes dynamic interval from elapsed game time
2. At elapsed time 0ms, tick interval is 400ms
3. At elapsed time 10000ms+, tick interval is 200ms
4. The ramp is linear (interpolates between 400ms and 200ms)
5. Wall reset after compression does NOT reset the speed ramp
6. `Game.elapsedTime()` returns correct elapsed ms since game start
7. All 280+ existing tests pass (Failed: 0)
8. `npx tsc` produces 0 errors

## Deliverables

- Updated `src/Game.ts`
- Updated `src/LeftWall.ts`
- Updated `src/main.ts` (dynamic speed tests)

## Implementation Notes

### Test Compatibility

The existing tests use a `TestLeftWall` subclass that overrides `currentTimeMillis()`. The new `tick(elapsedMs)` signature requires updating test call sites.

For tests that don't care about dynamic speed, pass `elapsedMs = 0` (or any value) — the interval will be 400ms at elapsed=0, but if the test uses `setPosition()` to control wall position directly, the tick interval doesn't matter.

### Mock Time in Tests

Tests that need deterministic timing should either:
1. Pass a fixed `elapsedMs` value to `tick()`, or
2. Use `setPosition()` to set wall position directly (bypassing tick entirely)

### Edge Cases

1. **Wall blocked for a long time**: If the wall is blocked (can't advance), elapsed time keeps accumulating. When the wall unblocks, the interval may already be below 200ms. This is correct — speed is based on elapsed game time, not wall progress.

2. **Very fast games**: If a player completes many compression cycles quickly, the wall could reach 200ms/tick early. This is acceptable — it rewards skilled play with faster progression.

3. **Restart after game over**: The `startTime` is reset in `start()`, so the speed ramp restarts from 400ms. This is correct — each game is a fresh experience.
