# OSURIS

Horizontal Compression Puzzle Game

Tetris-style pieces are compressed horizontally by an advancing wall.
The player controls a Right Wall to shift blocks vertically (with looping),
aiming to maximize block density through strategic compression.

---

## Table of Contents

- [Game Rules](#game-rules)
- [How to Play](#how-to-play)
- [Game Over](#game-over)
- [Scoring](#scoring)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Development (Hot-Reload)](#development-hot-reload)
  - [Run with Docker (Recommended)](#run-with-docker-recommended)
  - [Run Locally (Production)](#run-locally-production)
  - [Run in VS Code Dev Container](#run-in-vs-code-dev-container)
- [Development](#development)
  - [Dev Server (Hot-Reload)](#dev-server-hot-reload)
  - [Build](#build)
  - [Run Tests](#run-tests)
  - [Preview Production Build](#preview-production-build)
  - [Serve the Game](#serve-the-game)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Design Documents](#design-documents)

---

## Game Rules

- **Field**: 16 columns × 8 rows. The field loops vertically (the top and
  bottom edges are connected: a block shifted below the bottom row reappears
  above the top row), but does not loop horizontally.
- **Active piece**: one of the 7 standard tetriminoes (I, O, T, S, Z, J, L)
  is generated randomly at a fixed position a few columns to the left of the
  Right Wall. Only one active piece exists at a time. It can be rotated 90°
  clockwise as often as you like until the Left Wall reaches it.
- **Left Wall (automatic)**: starts at the left edge and advances rightward
  on its own (one column per 200 ms). It keeps pushing whatever it touches —
  the active piece and any fixed blocks — to the right.
- **Pushing and placement of pieces**: as the Left Wall pushes the active
  piece, the piece slides rightward cell by cell. When the piece contacts the
  Right Wall or fixed blocks and can no longer be pushed, it is locked in
  place as fixed field blocks. **This is normal and is not game over.** The
  wall pushing pieces into the field is precisely how pieces are placed in
  this game. (See [Game Over](#game-over) for the real end condition.)
- **Right Wall (player)**: you can shift the Right Wall up or down by one row
  at a time. Blocks in contact with the Right Wall move together with it, and
  the Right Wall loops vertically — shifting past the top edge brings it back
  at the bottom (and vice versa).
- **Compression**: when the Left Wall closes within one column of the Right
  Wall, a compression cycle runs: the active piece is locked, all field
  blocks are pushed rightward as simultaneous groups (BFS-based pack, see
  [compress-mechanism.md](compress-mechanism.md)) until they are packed
  against the Right Wall, then the Left Wall resets to the left edge and a
  new active piece is generated.
- **No line clearing**: rows are never cleared in the MVP.

---

## How to Play

| Key              | Action                                          |
|------------------|-------------------------------------------------|
| `Space`          | Rotate the active piece 90° clockwise           |
| `↑` (ArrowUp)    | Shift the Right Wall up by one row              |
| `↓` (ArrowDown)  | Shift the Right Wall down by one row            |
| `Enter`          | Restart the game (only works from the game over screen) |

- The game canvas is focused automatically when the page loads. A green
  border around the field indicates it has keyboard focus; click the field
  once if focus was lost and keys stop working.
- The game is keyboard-only.

---

## Game Over

The game ends **only when a new active piece cannot be generated**.
Concretely, game over happens when the spawn position (a few columns to the
left of the Right Wall, middle row) is:

- overlapping the Right Wall (no free horizontal space between the spawn
  position and the Right Wall), or
- blocked by existing fixed blocks (the spawn position collides with the
  field).

**Important — wall pushing is not game over**: if the Left Wall pushes the
active piece into the Right Wall or into existing blocks and it locks in
place, the game continues normally. That is the standard way pieces get
placed onto the field (see [Game Rules](#game-rules)).

On game over, the final density is displayed together with a restart prompt:
press `Enter` to start a fresh game on a cleared field.

---

## Scoring

Score is the block density of the field, in percent:

```text
score = occupied cells / (16 × 8) × 100   (rounded to a whole number)
```

- The current density is shown below the grid as `Density: N%`.
- There is no line clearing in the MVP, so density only ever increases.
- The game ends when a new piece can no longer be spawned; the density at
  that moment is your final score.
- Goal: keep the field as dense as possible for as long as you can.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later, **or**
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Development (Hot-Reload)

```bash
npm install
npm run dev
```

The game will be available at [http://localhost:3000](http://localhost:3000).

File changes are automatically reloaded in the browser.

### Run with Docker (Recommended)

```bash
docker compose up --build
```

The game will be available at [http://localhost:3000](http://localhost:3000).

### Run Locally (Production)

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Serve the game
npm start
```

The game will be available at [http://localhost:3000](http://localhost:3000).

### Run in VS Code Dev Container

1. Install the **Dev Containers** extension for VS Code
2. Open this project in VS Code
3. Press `Ctrl+Shift+P` → **Dev Containers: Reopen in Container**
4. Once the container is ready, open a terminal and run:

```bash
npm run dev
```

---

## Development

### Dev Server (Hot-Reload)

```bash
npm run dev
```

Vite dev server with browser hot-reload on file changes.

### Build

```bash
npm run build
```

Compiles TypeScript to `dist/` (`tsc`), then copies `index.html` into
`dist/` and rewrites its script reference to the flat `dist/` layout so the
output can be served statically. To start from a clean state:

```bash
npm run clean   # removes dist/
npm run build
```

### Run Tests

```bash
npx tsc && node dist/main.js
```

Tests are embedded in `src/main.ts` using an assert-based harness.
All tests must pass. The total assertion count is currently typically
280 and may vary slightly between runs because Test 42 contains
path-dependent conditional assertions driven by the random piece spawns —
the summary's `Failed: 0` line is the pass criterion.

### Preview Production Build

```bash
npm run preview
```

### Serve the Game

```bash
npx serve dist
```

Or via npm script:

```bash
npm start
```

---

## Architecture

- **Field** — 16x8 grid with vertical looping (top/bottom connected)
- **ActivePiece** — 7 Tetrimino shapes, 90° clockwise rotation, collision detection
- **LeftWall** — Horizontal advancing wall, contact detection, block pushing
- **RightWall** — Player-controlled vertical boundary, block group shifting with wrapping
- **CompressionSystem** — BFS-based block packing algorithm (swappable module)
- **InputManager** — Poll-based keyboard event handling (Space, ArrowUp, ArrowDown, Enter)
- **Renderer** — Canvas-based rendering (field, pieces, walls, score, UI)
- **Game** — State machine (PLAYING / COMPRESSING / GAME_OVER) coordinating all components

Logic and rendering are strictly separated: game logic classes never depend
on rendering, and the Renderer consumes logical state only.

---

## Project Structure

```text
.
├── src/                        # TypeScript source (game logic + tests)
│   ├── entry.ts                # Browser entry point (creates Game, focuses canvas)
│   ├── main.ts                 # Test runner (assert-based harness, Node)
│   ├── Game.ts                 # State machine & component coordination
│   ├── Field.ts                # Grid management with vertical looping
│   ├── ActivePiece.ts          # Tetrimino shapes, rotation, collision
│   ├── LeftWall.ts             # Automatic compression wall
│   ├── RightWall.ts            # Player-controlled vertical boundary
│   ├── CompressionSystem.ts    # Block packing algorithm (BFS)
│   ├── InputManager.ts         # Keyboard input handling
│   ├── Renderer.ts             # Canvas rendering
│   └── styles.css              # Game UI styles
├── dist/                       # Compiled JavaScript output
├── index.html                  # Game HTML entry
├── vite.config.ts              # Vite configuration
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── game-design.md              # Game design document (Japanese)
└── compress-mechanism.md       # Compression mechanics reference (Japanese)
```

---

## Design Documents

- [game-design.md](game-design.md) — full game specification (Japanese)
- [compress-mechanism.md](compress-mechanism.md) — compression algorithm specification (Japanese)
