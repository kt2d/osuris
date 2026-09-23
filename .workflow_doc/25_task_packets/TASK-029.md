# TASK-029: Test Updates

## Objective

Update existing tests to accommodate changes from Iteration 6 and add new tests for new functionality.

## Business Context

All previous changes (spawn position, BFS wall push, dynamic speed, effects) require test updates to verify correct behavior and prevent regressions.

## Scope

### Files to Modify

1. **`src/main.ts`** — All test updates

### Tests to Update

#### Spawn Position Tests (TASK-025)

| Test | Current Assertion | New Assertion |
|------|------------------|---------------|
| Test 31 (spawn) | `getActivePiece().getX() === 11` | `getActivePiece().getX() === 6` |
| Any other spawn position checks | `=== 11` | `=== 6` |

#### BFS Chain Push Tests (TASK-026)

Add new tests for:
- Single column push (existing behavior, should still work)
- Chain push: 2-column connected blocks
- Chain push: 2x2 block
- Blocked chain: no blocks move when chain is blocked
- Chain at right edge: push fails
- Empty gap in chain: only first column moves

#### Dynamic Speed Tests (TASK-027)

Add new tests for:
- At elapsed=0ms, tick interval is 400ms
- At elapsed=10000ms, tick interval is 200ms
- At elapsed=5000ms, tick interval is 300ms (midpoint)
- Linear interpolation between endpoints

#### Effect System Tests (TASK-028)

Add new tests for:
- `EffectSystem.registerPushEffect()` registers effects
- `EffectSystem.registerConnectionEffect()` registers effects
- `EffectSystem.update()` removes expired effects
- `EffectSystem.getPushedCells()` returns correct cells
- `EffectSystem.getConnectedCells()` returns correct cells
- Effects do not persist across `clear()`

#### Integration Tests

Add integration tests for:
- Full game flow: spawn → wall advance with chain push → compression → new spawn
- Dynamic speed: wall advances faster as time progresses
- Effect visibility: pushed blocks flash during wall advance

## Test Structure

### New Tests to Add

```
Test 47: BFS chain push — single column (baseline)
Test 48: BFS chain push — 2-column connected
Test 49: BFS chain push — blocked chain
Test 50: Dynamic speed — interval at 0ms = 400ms
Test 51: Dynamic speed — interval at 10000ms = 200ms
Test 52: Effect system — push effect registration
Test 53: Effect system — effect expiration
Test 54: Integration — full game flow with chain push and effects
```

### Tests to Modify

```
Test 31: Update spawn position assertion (x=11 → x=6)
Test 32: Update wall advance test (tick() now takes elapsedMs parameter)
Test 36: Update spawn position after compression (x=11 → x=6)
Test 42: Update any spawn position references
```

## Acceptance Criteria

1. All 280+ existing tests pass (Failed: 0)
2. New tests added for BFS chain push (minimum 3 tests)
3. New tests added for dynamic speed (minimum 2 tests)
4. New tests added for effect system (minimum 2 tests)
5. Total test count: 280+ assertions (may be higher with new tests)
6. `npx tsc` produces 0 errors
7. No test uses `tick()` without the `elapsedMs` parameter

## Deliverables

- Updated `src/main.ts` with all test updates and additions

## Test Update Checklist

- [ ] Test 31: spawn position x=11 → x=6
- [ ] Test 32: wall advance — tick() signature update
- [ ] Test 36: spawn after compression x=11 → x=6
- [ ] Test 42: any spawn position references
- [ ] New Test 47: BFS chain push — single column
- [ ] New Test 48: BFS chain push — 2-column connected
- [ ] New Test 49: BFS chain push — blocked chain
- [ ] New Test 50: Dynamic speed — interval at 0ms
- [ ] New Test 51: Dynamic speed — interval at 10000ms
- [ ] New Test 52: Effect system — push effect
- [ ] New Test 53: Effect system — expiration
- [ ] New Test 54: Integration — full game flow

## Notes on Test Compatibility

### TestLeftWall Subclass

The existing `TestLeftWall` subclass overrides `currentTimeMillis()`. The new `tick(elapsedMs)` signature means tests must pass `elapsedMs` explicitly. For tests that don't need dynamic speed, pass `0` or use `setPosition()` directly.

### Mock Game Canvas

The `MockGameCanvas` class is used for testing. No changes needed — it provides a canvas element and key dispatch.

### Assertion Count Variability

Test 42 has path-dependent conditional assertions (random piece spawns). The total assertion count may vary between runs (like the existing pattern with Test 42). Document the expected range.
