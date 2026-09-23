# Task Packet

TASK-ID: TASK-012

Title: Add Integration Tests

Priority: Medium

Dependencies: TASK-009, TASK-010

---

# Objective

Add integration tests to cover the three identified gaps in test coverage:
1. Vertical wrapping during compression
2. Multiple consecutive compression cycles
3. Spawn collision with occupied cells

---

# Business Context

The current test suite covers unit-level scenarios well but has gaps in integration testing. These gaps were identified by the Code Review and Bird's Eye Review. Adding these tests ensures that complex interactions between components are properly validated.

---

# Scope

## In Scope

### Target

- `src/main.ts` - Add integration tests (new test sections)

## Out of Scope

- Changes to existing tests (except where explicitly noted)
- Changes to source code (this is a test-only task)
- New game features or logic

---

# Constraints

## D-012-1: Use Existing Test Harness

Priority: Required

Description: All new tests must use the existing assert-based test harness in `src/main.ts`. No new testing framework should be added.

Rationale: The project convention is to use the simple assert-based harness. Adding a framework would increase complexity and dependencies.

---

## D-012-2: Tests Must Be Deterministic

Priority: Required

Description: Integration tests must be deterministic and reproducible. Use TestLeftWall subclass for time-dependent behavior.

Rationale: Non-deterministic tests are unreliable and fragile. The TestLeftWall subclass already provides deterministic timing.

---

## D-012-3: Mock-Based Testing

Priority: Required

Description: Tests should use mock/stub objects for components that require browser APIs (Renderer, InputManager). Only test game logic.

Rationale: Tests run in Node.js, not the browser. Browser-dependent components must be mocked.

---

# Implementation Notes

## Test 1: Vertical Wrapping During Compression

### Scenario

1. Create a field with blocks at y=7 (bottom row) and y=0 (top row)
2. Set RightWall at y=0
3. Trigger compression
4. Verify blocks at y=7 wrap to y=0 during compression BFS movement

### Verification

- Blocks that wrap during compression are correctly positioned
- No blocks are lost during wrapping
- Field state after compression is correct

### Implementation

```typescript
// Test: Vertical wrapping during compression
{
    const field = new Field();
    const rightWall = new RightWall(15, 0);
    const compressionSystem = new CompressionSystem(field, rightWall, () => {});

    // Place blocks at y=7 and y=0 at x=14
    field.set(14, 7, true);
    field.set(14, 0, true);

    // Compress with wall at x=15, y=0
    const result = compressionSystem.compress(15);

    assert(result === true, "Compression should succeed");
    // Verify blocks are at expected positions after compression
    assert(field.get(15, 0) === true, "Block should be at wall position");
    // Verify no blocks lost
    assert(field.countBlocks() === 2, "No blocks should be lost during wrapping");
}
```

## Test 2: Multiple Consecutive Compression Cycles

### Scenario

1. Start a game with a compressed field
2. Trigger compression multiple times
3. Verify game state transitions correctly between PLAYING and COMPRESSING

### Verification

- Left Wall resets after each compression
- New piece spawns after each compression
- Game does not enter GAME_OVER prematurely

### Implementation

```typescript
// Test: Multiple consecutive compressions
{
    const canvas = { addEventListener: () => {}, removeEventListener: () => {} } as any;
    const game = new Game(canvas);

    // Manually set up a compressible state
    game.field.set(14, 3, true);
    game.field.set(15, 3, true);
    game.rightWall.setPosition(15, 3);

    // First compression
    game.update(); // Trigger compression
    assert(game.getState() === 'PLAYING' || game.getState() === 'GAME_OVER',
           "Game should be in PLAYING or GAME_OVER after compression");

    // Second compression (if game is still playing)
    if (game.getState() === 'PLAYING') {
        game.field.set(14, 3, true);
        game.update(); // Second compression
        assert(game.getState() === 'PLAYING' || game.getState() === 'GAME_OVER',
               "Game should handle multiple compressions");
    }
}
```

## Test 3: Spawn Collision with Occupied Cells

### Scenario

1. Fill the field with blocks near the spawn position
2. Trigger a new piece spawn
3. Verify spawn collision detection works correctly

### Verification

- If spawn position collides with occupied cells, the piece is not spawned
- Game transitions to GAME_OVER if no valid spawn position exists
- Existing tests for spawn (Test 36, 37) continue to pass

### Implementation

```typescript
// Test: Spawn collision with occupied cells
{
    const canvas = { addEventListener: () => {}, removeEventListener: () => {} } as any;
    const game = new Game(canvas);

    // Fill the spawn area with blocks
    game.field.set(5, 3, true);
    game.field.set(6, 3, true);
    game.field.set(7, 3, true);
    game.field.set(8, 3, true);

    // Try to spawn - should fail due to collision
    const spawned = (game as any).spawnPiece();
    assert(spawned === false, "Spawn should fail when position is occupied");
}
```

## Test Count

Add 3 new test sections (Tests 41-43), each with 3-5 assertions.
Total test count: 222 + 9 = approximately 231 assertions.

---

# Acceptance Criteria

- [ ] `npx tsc` compiles with no errors
- [ ] Integration test for vertical wrapping during compression added
- [ ] Integration test for multiple consecutive compression cycles added
- [ ] Integration test for spawn collision with occupied cells added
- [ ] All 222 existing tests still pass
- [ ] New tests are deterministic (use TestLeftWall where needed)
- [ ] New tests use mock-based approach (no browser dependencies)

---

# Deliverables

- Modified: `src/main.ts` (3 new test sections)
- Tests: All tests pass (existing + new integration tests)

---

# References

- Code Review Test Coverage Gaps: Vertical wrapping, consecutive compression, spawn collision
- Project State Risk-004: Integration Test Coverage Gaps
- Project State Risk-002: spawnPiece Collision with Occupied Cells
- Bird's Eye Review Risk-BE-004: Missing Test Coverage for Integration Scenarios
- Next Actions Planning Recommendations: Fill Integration Test Gaps

---

# Validation Checklist

- [x] TASK-ID exists
- [x] Objective is clear
- [x] Business Context is documented
- [x] Scope is defined
- [x] Constraints are documented
- [x] Acceptance Criteria are measurable
- [x] Deliverables are defined
- [x] Implementation notes provide sufficient detail
- [x] Task can be implemented without reading the full Plan
