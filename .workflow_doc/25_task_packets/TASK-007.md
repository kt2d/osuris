# Task Packet

TASK-ID: TASK-007

Title: HTML Integration

Priority: Medium

Dependencies: TASK-006

---

# Objective

Wire all game components into `index.html` to create a playable game experience in the browser.

---

# Business Context

The game components (Game, Field, ActivePiece, LeftWall, RightWall, CompressionSystem, InputManager, Renderer) exist but are not connected to the browser. This task creates the entry point that initializes everything and starts the game loop.

---

# Scope

## In Scope

### Target

- Modified: `index.html` - Add game initialization script
- Modified: `src/main.ts` - Convert from test harness to game entry point (or create separate entry)
- Modified: `src/styles.css` - Final styling adjustments

## Out of Scope

- New game features
- Performance optimization
- Browser compatibility testing beyond basic functionality

---

# Constraints

## D-007-1: Single Entry Point

Priority: Required

Description: The game is launched from `index.html` which loads a single JavaScript bundle.

Rationale: Simple deployment model. The existing build process (`npx tsc`) handles compilation.

---

## D-007-2: Canvas Setup

Priority: Required

Description: The canvas element with id `game-canvas` already exists in `index.html`. The Game constructor receives this element.

Rationale: Reuses existing HTML structure.

---

## D-007-3: Build Process

Priority: Required

Description: Use the existing TypeScript compilation: `npx tsc`. The output goes to `dist/`. The HTML loads `dist/main.js`.

Rationale: Consistent with existing build process.

---

# Implementation Notes

## Entry Point Design

The `main.ts` file currently contains only tests. It needs to be modified to:

1. Run tests in Node.js environment (existing behavior)
2. Initialize the game in browser environment

This can be done with an environment check:

```typescript
// Detect environment
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  // Browser: initialize game
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const game = new Game(canvas);
  game.start();
} else {
  // Node.js: run tests
  // ... existing test code ...
}
```

## HTML Structure

The existing `index.html` already has:
- Canvas element with id `game-canvas`
- Stylesheet link
- Script tag for `main.js`

Changes needed:
- Update script src to `dist/main.js` (or keep as `main.js` if served from dist)
- Optionally add a title or instructions

## Build and Run

```bash
# Build
npx tsc

# Serve (any static file server)
npx serve .

# Or open index.html directly (may have CORS issues with ES modules)
```

## Verification

The game should be playable in a browser:
1. Open `index.html` (or serve via HTTP)
2. Active piece should appear
3. Left Wall should move automatically
4. Space key rotates the piece
5. Arrow keys shift the Right Wall
6. Compression occurs when walls meet
7. Game over appears when piece cannot spawn

---

# Acceptance Criteria

- [ ] `index.html` loads the game correctly in a browser
- [ ] Canvas displays the game field
- [ ] Active piece is visible and rotatable
- [ ] Left Wall moves automatically
- [ ] Right Wall responds to arrow key input
- [ ] Compression occurs when walls meet
- [ ] New piece spawns after compression
- [ ] Game over displays when piece cannot spawn
- [ ] Score (density) is displayed
- [ ] `npx tsc` compiles with no errors
- [ ] Existing tests still pass when run via `node dist/main.js`

---

# Deliverables

- Modified: `index.html`
- Modified: `src/main.ts` (browser entry point)
- Modified: `src/styles.css` (if needed)

---

# References

- `index.html` - Current HTML structure
- `src/styles.css` - Current styles
- `tsconfig.json` - TypeScript configuration

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
