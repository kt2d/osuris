# Task Packet

TASK-ID: TASK-006

Title: Game State Machine

Priority: High

Dependencies: TASK-003-FIX, TASK-004, TASK-005

---

# Objective

Implement the `Game` class that coordinates all game components (Field, ActivePiece, LeftWall, RightWall, CompressionSystem, InputManager, Renderer) and manages the game state machine.

---

# Business Context

The Game class is the central orchestrator of the application. It manages the game loop, state transitions, and component coordination. Without it, the individual components exist but cannot function as a cohesive game.

---

# Scope

## In Scope

### Target

- New file: `src/Game.ts` - Game class with state machine
- Modified: `src/main.ts` - Add integration tests

## Out of Scope

- HTML wiring (handled in TASK-007)
- New component creation (all components already exist)
- Performance optimization

---

# Constraints

## D-006-1: State Machine

Priority: Required

Description: The game uses explicit state enumeration:

| State | Description |
|-------|-------------|
| PLAYING | Left Wall moves, player can rotate piece and shift wall |
| COMPRESSING | Left Wall reached Right Wall, CompressionSystem executes |
| GAME_OVER | New piece cannot be placed, game ends |

Rationale: Clear state boundaries prevent race conditions and undefined behavior.

---

## D-006-2: Game Loop

Priority: Required

Description: The game loop runs via `requestAnimationFrame`. Each frame: process input, update state, render.

Rationale: Standard browser game loop pattern. Provides smooth rendering at display refresh rate.

---

## D-006-3: Piece Spawning

Priority: Required

Description: New pieces spawn at `max(2, rightWall.x - 4)` to ensure playable space. If spawn position is invalid (no space between spawn and right wall), game over.

Rationale: Dynamic spawning adapts to the current wall position. The buffer of 4 columns gives the player time to react.

---

## D-006-4: Score Calculation

Priority: Required

Description: Score is block density: `countBlocks() / (COLS * ROWS) * 100`. Displayed as a percentage.

Rationale: Simple metric that reflects the core gameplay objective (maximize block density).

---

# Implementation Notes

## Class Design

```typescript
export type GameState = 'PLAYING' | 'COMPRESSING' | 'GAME_OVER';

export class Game {
  constructor(canvas: HTMLCanvasElement);
  
  start(): void;
  stop(): void;
  
  getState(): GameState;
  getScore(): number;
  
  // Internal
  private update(): void;
  private render(): void;
  private processInput(): void;
  private spawnPiece(): boolean;
  private onCompressionComplete(): void;
}
```

## State Transitions

```
start() -> spawnPiece() -> PLAYING

PLAYING:
  - LeftWall.tick() each frame
  - If leftWall.isAtRightEdge() or compressionSystem.shouldCompress():
    -> COMPRESSING

COMPRESSING:
  - compressionSystem.compress(leftWall.getX())
  - If compress returns true:
    -> onCompressionComplete() -> spawnPiece() -> PLAYING
  - If compress returns false:
    -> GAME_OVER

GAME_OVER:
  - No updates, only render
```

## Piece Spawning Logic

```typescript
private spawnPiece(): boolean {
  const spawnX = Math.max(2, this.rightWall.getX() - 4);
  const spawnY = Math.floor(Field.ROWS / 2);
  
  // Check if there's space between spawn position and right wall
  if (spawnX >= this.rightWall.getX()) {
    this.state = 'GAME_OVER';
    return false;
  }
  
  const type = Math.floor(Math.random() * 7);
  this.activePiece = new ActivePiece(this.field, type, spawnX, spawnY, 0);
  this.leftWall.setActivePiece(this.activePiece);
  this.leftWall.setPosition(0);
  return true;
}
```

## Input Processing

```typescript
private processInput(): void {
  if (this.state !== 'PLAYING') return;
  
  const actions = this.inputManager.poll();
  
  if (actions.has('ROTATE') && this.activePiece) {
    this.activePiece.rotate();
  }
  
  if (actions.has('WALL_UP')) {
    this.rightWall.shiftVertical(1);
  }
  
  if (actions.has('WALL_DOWN')) {
    this.rightWall.shiftVertical(-1);
  }
}
```

## Test Strategy

Tests should verify:
- Game starts in PLAYING state with a spawned piece
- Left Wall advances during PLAYING state
- Compression triggers when walls meet
- Game transitions to GAME_OVER when piece cannot spawn
- Score reflects block density
- Input processing affects piece rotation and wall movement

---

# Acceptance Criteria

- [ ] `Game` class exists in `src/Game.ts`
- [ ] Game starts in PLAYING state with a spawned piece
- [ ] Left Wall advances during PLAYING state
- [ ] Player can rotate the active piece via input
- [ ] Player can shift the Right Wall vertically via input
- [ ] Compression triggers when Left Wall reaches Right Wall
- [ ] After compression, Left Wall resets and new piece spawns
- [ ] Game transitions to GAME_OVER when piece cannot spawn
- [ ] Score reflects block density as percentage
- [ ] Renderer is called each frame
- [ ] `npx tsc` compiles with no errors
- [ ] All tests pass

---

# Deliverables

- New: `src/Game.ts`
- Modified: `src/main.ts` (integration tests)

---

# References

- `10_plan.md` - Game State Machine section, D-003
- `game-design.md` - Full game design specification
- `compress-mechanism.md` - Compression algorithm specification

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
