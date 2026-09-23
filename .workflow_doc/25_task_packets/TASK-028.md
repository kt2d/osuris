# TASK-028: Effect System + Flash + Connection Effects

## Objective

Create an `EffectSystem` class to manage visual effects for pushed and connected blocks. Pushed blocks flash brighter; connection points show a yellow glow.

## Business Context

Visual feedback helps players understand what's happening during wall advancement. A flash on pushed blocks communicates "these are moving." A glow on connection points communicates "these got pulled along."

## Scope

### Files to Create

1. **`src/EffectSystem.ts`** — NEW FILE
   - `Effect` type (position, type, timestamp, duration)
   - `EffectSystem` class (register, update, query effects)

### Files to Modify

2. **`src/LeftWall.ts`**
   - `advanceOccupiedBlocksInColumn()` returns `{ pushedCells, connectedCells }`
   - `onWallAdvanced()` passes results to caller for effect registration

3. **`src/Game.ts`**
   - Add `effectSystem: EffectSystem` property
   - Wire up effect registration after wall advancement
   - Pass `effectSystem` to `Renderer.render()`

4. **`src/Renderer.ts`**
   - `render()` accepts `effectSystem: EffectSystem` parameter
   - `drawBlocks()` accepts `pushedCells` and `connectedCells` arrays
   - Render pushed blocks with brighter color
   - Render connected blocks with yellow overlay

### Files NOT Modified

- No changes to Field, ActivePiece, RightWall, CompressionSystem, InputManager

## Implementation

### EffectSystem.ts

```typescript
export interface Effect {
  type: 'pushed' | 'connected';
  x: number;
  y: number;
  createdAt: number;
  duration: number;
}

export class EffectSystem {
  private effects: Map<string, Effect>; // key = "type,x,y"
  private readonly PUSH_DURATION_MS = 300;
  private readonly CONNECT_DURATION_MS = 400;

  constructor() {
    this.effects = new Map();
  }

  registerPushEffect(cells: Array<{x: number; y: number}>): void {
    const now = Date.now();
    for (const cell of cells) {
      const key = `pushed,${cell.x},${cell.y}`;
      this.effects.set(key, {
        type: 'pushed',
        x: cell.x,
        y: cell.y,
        createdAt: now,
        duration: this.PUSH_DURATION_MS,
      });
    }
  }

  registerConnectionEffect(cells: Array<{x: number; y: number}>): void {
    const now = Date.now();
    for (const cell of cells) {
      const key = `connected,${cell.x},${cell.y}`;
      this.effects.set(key, {
        type: 'connected',
        x: cell.x,
        y: cell.y,
        createdAt: now,
        duration: this.CONNECT_DURATION_MS,
      });
    }
  }

  update(deltaMs: number): void {
    const now = Date.now();
    for (const [key, effect] of this.effects) {
      if (now - effect.createdAt >= effect.duration) {
        this.effects.delete(key);
      }
    }
  }

  getPushedCells(): Array<{x: number; y: number}> {
    const cells: Array<{x: number; y: number}> = [];
    for (const effect of this.effects.values()) {
      if (effect.type === 'pushed') {
        cells.push({ x: effect.x, y: effect.y });
      }
    }
    return cells;
  }

  getConnectedCells(): Array<{x: number; y: number}> {
    const cells: Array<{x: number; y: number}> = [];
    for (const effect of this.effects.values()) {
      if (effect.type === 'connected') {
        cells.push({ x: effect.x, y: effect.y });
      }
    }
    return cells;
  }

  clear(): void {
    this.effects.clear();
  }
}
```

### Renderer.ts Changes

```typescript
render(
  field: Field,
  activePiece: ActivePiece | null,
  leftWall: LeftWall,
  rightWall: RightWall,
  score: number,
  isGameOver: boolean,
  effectSystem: EffectSystem  // NEW PARAMETER
): void {
  // ...
  this.drawBlocks(field, effectSystem.getPushedCells(), effectSystem.getConnectedCells());
  // ...
}

drawBlocks(
  field: Field,
  pushedCells: Array<{x: number; y: number}>,
  connectedCells: Array<{x: number; y: number}>
): void {
  const pushedSet = new Set(pushedCells.map(c => `${c.x},${c.y}`));
  const connectedSet = new Set(connectedCells.map(c => `${c.x},${c.y}`));
  const cs = this.cellSize;

  for (const cell of field.getOccupiedCells()) {
    const key = `${cell.x},${cell.y}`;
    
    if (connectedSet.has(key)) {
      // Connection effect: yellow overlay
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.fillRect(cell.x * cs + 1, cell.y * cs + 1, cs - 2, cs - 2);
      // Draw block on top
      this.ctx.fillStyle = this.COLOR_BLOCK;
      this.ctx.fillRect(cell.x * cs + 3, cell.y * cs + 3, cs - 6, cs - 6);
    } else if (pushedSet.has(key)) {
      // Push effect: brighter color
      this.ctx.fillStyle = '#9a9aba';
      this.ctx.fillRect(cell.x * cs + 1, cell.y * cs + 1, cs - 2, cs - 2);
    } else {
      // Normal block
      this.ctx.fillStyle = this.COLOR_BLOCK;
      this.ctx.fillRect(cell.x * cs + 1, cell.y * cs + 1, cs - 2, cs - 2);
    }
  }
}
```

### Game.ts Wiring

```typescript
// In constructor:
this.effectSystem = new EffectSystem();

// In updatePlaying():
const wallResult = this.leftWall.tick(this.elapsedTime());
if (wallResult && wallResult.pushedCells.length > 0) {
  this.effectSystem.registerPushEffect(wallResult.pushedCells);
}
if (wallResult && wallResult.connectedCells.length > 0) {
  this.effectSystem.registerConnectionEffect(wallResult.connectedCells);
}
this.effectSystem.update(16); // ~60fps delta

// In render():
this.renderer.render(
  this.field,
  this.activePiece,
  this.leftWall,
  this.rightWall,
  this.getScore(),
  this.state === 'GAME_OVER',
  this.effectSystem
);

// In start():
this.effectSystem.clear();
```

## Color Palette

| State | Color | Hex |
|---|---|---|
| Normal block | Dark blue-gray | `#4a4a8a` |
| Pushed block | Lighter blue-gray | `#9a9aba` |
| Connected block | Yellow overlay on normal | `#ffd93d` (50% alpha overlay) |

## Constraints

- EffectSystem must not depend on Renderer or Canvas (pure logic)
- EffectSystem duration constants must be configurable (not hardcoded in Renderer)
- `npx tsc` must produce 0 errors
- All 280+ existing tests must pass (Failed: 0)

## Acceptance Criteria

1. `EffectSystem` class exists at `src/EffectSystem.ts`
2. Pushed blocks render with brighter color (`#9a9aba`)
3. Connected blocks render with yellow overlay (`#ffd93d`)
4. Effects expire after their duration (300ms pushed, 400ms connected)
5. Effects are registered when wall advances and pushes blocks
6. Effects are registered when BFS chain push connects new blocks
7. Effects do not persist across game restarts
8. All 280+ existing tests pass (Failed: 0)
9. `npx tsc` produces 0 errors

## Deliverables

- New `src/EffectSystem.ts`
- Updated `src/Renderer.ts`
- Updated `src/Game.ts`
- Updated `src/LeftWall.ts` (return type change)
- Updated `src/main.ts` (effect system tests)

## Risks

- **Effect timing**: Effects are registered during `update()` but rendered in the same frame. The player may not see the flash for the current frame. Consider registering effects at the end of the frame instead. Acceptable — the flash appears on the next frame, which is still visible.
- **Performance**: For each frame, we iterate over all effects to build pushed/connected cell sets. With a small field (128 cells max), this is negligible.
- **Test compatibility**: `Renderer.render()` signature changes. Update all test call sites.
