import { Field } from './Field.js';
import { ActivePiece } from './ActivePiece.js';
import { LeftWall } from './LeftWall.js';
import { RightWall } from './RightWall.js';
import { EffectSystem } from './EffectSystem.js';

/**
 * Renderer draws the game state on an HTML5 Canvas.
 *
 * The Renderer consumes logical state (Field, ActivePiece, walls, score)
 * and produces visual output. It has no game logic of its own.
 *
 * Render order:
 *  1. Clear canvas (background color)
 *  2. Draw field grid (cells, borders)
 *  3. Draw fixed blocks on field (with push/connection effects, TASK-028)
 *  4. Draw active piece (if exists)
 *  5. Draw Left Wall (vertical line)
 *  6. Draw Right Wall (vertical line)
 *  7. Draw UI (score, game over message)
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;

  // Color scheme
  private readonly COLOR_BACKGROUND = '#0f0f23';
  private readonly COLOR_GRID = '#1a1a3e';
  private readonly COLOR_BLOCK = '#4a4a8a';
  private readonly COLOR_ACTIVE_PIECE = '#ff6b6b';
  private readonly COLOR_LEFT_WALL = '#ffd93d';
  private readonly COLOR_RIGHT_WALL = '#6bff6b';
  private readonly COLOR_TEXT = '#e0e0e0';
  private readonly COLOR_GAME_OVER_BG = 'rgba(0, 0, 0, 0.7)';
  // TASK-028 effect colors (packet palette).
  private readonly COLOR_PUSHED_BLOCK = '#9a9aba';
  // Same hue as the left wall; kept as a named constant so the effect
  // palette stays explicit even if the wall color changes.
  private readonly COLOR_CONNECTED_OVERLAY = '#ffd93d';

  constructor(canvas: HTMLCanvasElement, cellSize: number = 40) {
    this.canvas = canvas;
    this.cellSize = cellSize;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context from canvas');
    }
    this.ctx = context;
  }

  /**
   * Render the complete game state.
   *
   * @param field The field containing fixed blocks.
   * @param activePiece The currently active piece (or null if none).
   * @param leftWall The left compression wall.
   * @param rightWall The right boundary wall.
   * @param score The current density score (0-100).
   * @param isGameOver Whether the game is in game-over state.
   * @param effectSystem Live visual effects (pushed flash / connected
   *   glow, TASK-028). Pass an empty EffectSystem for no effects.
   */
  render(
    field: Field,
    activePiece: ActivePiece | null,
    leftWall: LeftWall,
    rightWall: RightWall,
    score: number,
    isGameOver: boolean,
    effectSystem: EffectSystem
  ): void {
    this.clear();
    this.drawGrid(field);
    this.drawBlocks(
      field,
      effectSystem.getPushedCells(),
      effectSystem.getConnectedCells()
    );
    this.drawActivePiece(activePiece);
    this.drawLeftWall(leftWall);
    this.drawRightWall(rightWall);
    this.drawScore(score);
    if (isGameOver) {
      this.drawGameOver(score);
    }
  }

  // -------------------------------------------------------------------------
  // Clear
  // -------------------------------------------------------------------------

  private clear(): void {
    const cols = Field.COLS;
    const rows = Field.ROWS;
    this.canvas.width = cols * this.cellSize;
    // Add UI area below the grid for score text to avoid overlap.
    this.canvas.height = rows * this.cellSize + 30;
    this.ctx.fillStyle = this.COLOR_BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // -------------------------------------------------------------------------
  // Grid
  // -------------------------------------------------------------------------

  private drawGrid(field: Field): void {
    const cols = field.getCols();
    const rows = field.getRows();
    const cs = this.cellSize;

    this.ctx.strokeStyle = this.COLOR_GRID;
    this.ctx.lineWidth = 1;

    // Draw vertical grid lines
    for (let x = 0; x <= cols; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * cs + 0.5, 0);
      this.ctx.lineTo(x * cs + 0.5, rows * cs);
      this.ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = 0; y <= rows; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * cs + 0.5);
      this.ctx.lineTo(cols * cs, y * cs + 0.5);
      this.ctx.stroke();
    }
  }

  // -------------------------------------------------------------------------
  // Fixed blocks
  // -------------------------------------------------------------------------

  /**
   * Draw the fixed blocks on the field, applying the live visual effects
   * (TASK-028):
   *  - pushed cells (the wall-column blocks just pushed): brighter color
   *  - connected cells (blocks pulled along by the BFS chain push):
   *    yellow glow around the normal block body
   *  - all other cells: normal block
   */
  private drawBlocks(
    field: Field,
    pushedCells: Array<{ x: number; y: number }>,
    connectedCells: Array<{ x: number; y: number }>
  ): void {
    const pushedSet = new Set(pushedCells.map((c) => `${c.x},${c.y}`));
    const connectedSet = new Set(connectedCells.map((c) => `${c.x},${c.y}`));
    const cells = field.getOccupiedCells();
    const cs = this.cellSize;

    for (const cell of cells) {
      const key = `${cell.x},${cell.y}`;

      if (connectedSet.has(key)) {
        // Connection effect: yellow glow, then the block body on top.
        this.ctx.fillStyle = this.COLOR_CONNECTED_OVERLAY;
        this.ctx.fillRect(
          cell.x * cs + 1,
          cell.y * cs + 1,
          cs - 2,
          cs - 2
        );
        this.ctx.fillStyle = this.COLOR_BLOCK;
        this.ctx.fillRect(
          cell.x * cs + 3,
          cell.y * cs + 3,
          cs - 6,
          cs - 6
        );
      } else if (pushedSet.has(key)) {
        // Push effect: brighter block.
        this.ctx.fillStyle = this.COLOR_PUSHED_BLOCK;
        this.ctx.fillRect(
          cell.x * cs + 1,
          cell.y * cs + 1,
          cs - 2,
          cs - 2
        );
      } else {
        // Normal block.
        this.ctx.fillStyle = this.COLOR_BLOCK;
        this.ctx.fillRect(
          cell.x * cs + 1,
          cell.y * cs + 1,
          cs - 2,
          cs - 2
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // Active piece
  // -------------------------------------------------------------------------

  private drawActivePiece(activePiece: ActivePiece | null): void {
    if (!activePiece) return;

    const cells = activePiece.getOccupiedCells();
    const cs = this.cellSize;

    this.ctx.fillStyle = this.COLOR_ACTIVE_PIECE;

    for (const cell of cells) {
      this.ctx.fillRect(
        cell.x * cs + 1,
        cell.y * cs + 1,
        cs - 2,
        cs - 2
      );
    }
  }

  // -------------------------------------------------------------------------
  // Left Wall
  // -------------------------------------------------------------------------

  private drawLeftWall(leftWall: LeftWall): void {
    const rows = Field.ROWS;
    const cs = this.cellSize;
    const wallX = leftWall.getX();

    // Draw the wall as a vertical line at the wall's x-position.
    // The wall occupies the boundary between columns, so draw at the left
    // edge of the wall's column.
    const x = wallX * cs;

    this.ctx.strokeStyle = this.COLOR_LEFT_WALL;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 0.5, 0);
    this.ctx.lineTo(x + 0.5, rows * cs);
    this.ctx.stroke();
  }

  // -------------------------------------------------------------------------
  // Right Wall
  // -------------------------------------------------------------------------

  private drawRightWall(rightWall: RightWall): void {
    const rows = Field.ROWS;
    const cs = this.cellSize;
    const wallX = rightWall.getX();

    // Draw the wall as a vertical line at the right edge of the wall's column.
    const x = (wallX + 1) * cs;

    this.ctx.strokeStyle = this.COLOR_RIGHT_WALL;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 0.5, 0);
    this.ctx.lineTo(x - 0.5, rows * cs);
    this.ctx.stroke();
  }

  // -------------------------------------------------------------------------
  // UI: Score
  // -------------------------------------------------------------------------

  private drawScore(score: number): void {
    const cs = this.cellSize;
    const cols = Field.COLS;
    const rows = Field.ROWS;

    // Draw score text in the UI area below the grid.
    // Canvas height includes 30px extra for this UI area.
    this.ctx.fillStyle = this.COLOR_TEXT;
    this.ctx.font = `${Math.floor(cs * 0.5)}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    const text = `Density: ${score}%`;
    const textX = (cols * cs) / 2;
    // Position in the UI area below the grid, 10px below the grid boundary.
    const textY = rows * cs + 10;

    this.ctx.fillText(text, textX, textY);
  }

  // -------------------------------------------------------------------------
  // UI: Game Over
  // -------------------------------------------------------------------------

  private drawGameOver(score: number): void {
    const cs = this.cellSize;
    const cols = Field.COLS;
    const rows = Field.ROWS;
    const w = cols * cs;
    const h = rows * cs;

    // Semi-transparent overlay
    this.ctx.fillStyle = this.COLOR_GAME_OVER_BG;
    this.ctx.fillRect(0, 0, w, h);

    // Game Over text
    this.ctx.fillStyle = this.COLOR_TEXT;
    this.ctx.font = `bold ${Math.floor(cs)}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.fillText('GAME OVER', w / 2, h / 2 - cs);

    // Final density
    this.ctx.font = `${Math.floor(cs * 0.6)}px monospace`;
    this.ctx.fillText(`Final Density: ${score}%`, w / 2, h / 2 + cs);

    // Restart instruction
    this.ctx.font = `${Math.floor(cs * 0.5)}px monospace`;
    this.ctx.fillText('Press Enter to restart', w / 2, h / 2 + cs * 2.5);
  }
}
