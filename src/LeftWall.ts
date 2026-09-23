import { Field } from './Field.js';
import { ActivePiece } from './ActivePiece.js';

/**
 * Result of a chain push: the wall-column blocks that were pushed
 * directly, and the connection points (blocks pulled in by BFS
 * expansion). Coordinates are POST-move positions, so they can be used
 * directly for effect registration. Both arrays are empty when the push
 * was aborted (atomic abort: no block moved).
 */
export type ChainPushResult = {
  pushedCells: Array<{ x: number; y: number }>;
  connectedCells: Array<{ x: number; y: number }>;
};

/**
 * LeftWall manages the horizontal movement of the compression wall.
 *
 * The Left Wall starts at x = 0 and moves toward the Right Wall (x = COLS - 1).
 * It acts as the primary compression force in the game.
 *
 * Movement cadence (TASK-027): the tick interval is dynamic — it starts at
 * INITIAL_TICK_INTERVAL_MS (400ms) and ramps linearly down to
 * MINIMUM_TICK_INTERVAL_MS (200ms) over TICK_RAMP_DURATION_MS (10s) of
 * elapsed game time. The ramp is based on total game time, so it continues
 * across wall resets (compression cycles) and restarts only on a new game.
 *
 * Responsibilities:
 *  - Track wall position.
 *  - Advance position at a dynamic rate (via tick(elapsedMs)).
 *  - Detect contact with the Active Piece.
 *  - Detect contact with fixed blocks (and advance them).
 *  - Report pushed/connected cells on each advancement so the Game can
 *    register visual effects (TASK-028).
 */
export class LeftWall {
  /** Tick interval at game start (elapsed time 0ms), in milliseconds. */
  static readonly INITIAL_TICK_INTERVAL_MS = 400;

  /** Minimum (steady-state) tick interval after the ramp completes, in ms. */
  static readonly MINIMUM_TICK_INTERVAL_MS = 200;

  /** Duration of the interval ramp in milliseconds (10 seconds). */
  static readonly TICK_RAMP_DURATION_MS = 10000;

  /** The current x-position of the left wall. */
  private x: number;

  /** Time of the last tick in milliseconds. */
  private lastTickMs: number;

  /** Reference to the field for collision checks. */
  private field: Field;

  /** Reference to the active piece for contact detection. */
  private activePiece: ActivePiece | null;

  /**
   * Callback invoked when the active piece is fixed at wall contact
   * (TASK-030). The Game registers this to null its own activePiece
   * reference, preventing the updateCompressing safety-net from
   * double-moveToFixed on a cleared piece.
   */
  private onPieceFixed: (() => void) | null = null;

  constructor(field: Field, activePiece: ActivePiece | null) {
    this.field = field;
    this.activePiece = activePiece;
    this.x = 0;
    this.lastTickMs = this.currentTimeMillis();
  }

  // -------------------------------------------------------------------------
  // Time helper
  // -------------------------------------------------------------------------

  /**
   * Get current time in milliseconds.
   * Abstracted as a method so it can be overridden in tests.
   */
  protected currentTimeMillis(): number {
    return Date.now();
  }

  // -------------------------------------------------------------------------
  // Position access
  // -------------------------------------------------------------------------

  /** Get the current x-position of the left wall. */
  getX(): number {
    return this.x;
  }

  /**
   * Set the wall position directly (useful for testing or resets).
   */
  setPosition(x: number): void {
    this.x = x;
    this.lastTickMs = this.currentTimeMillis();
  }

  /**
   * Set the current time (useful for testing deterministic wall behavior).
   */
  setTime(ms: number): void {
    this._time = ms;
    this.lastTickMs = ms;
  }

  /** Internal time reference for testing. */
  protected _time: number = 0;

  // -------------------------------------------------------------------------
  // Movement
  // -------------------------------------------------------------------------

  /**
   * Compute the tick interval for the given elapsed game time (TASK-027).
   *
   * Linear ramp from INITIAL_TICK_INTERVAL_MS (400ms) at elapsed 0ms to
   * MINIMUM_TICK_INTERVAL_MS (200ms) once TICK_RAMP_DURATION_MS (10s) have
   * elapsed. Values beyond the ramp duration stay at the minimum. Negative
   * elapsed time (clock anomaly) clamps to the initial interval.
   *
   * @param elapsedMs Total game time elapsed in milliseconds.
   */
  getTickInterval(elapsedMs: number): number {
    const clampedElapsed = Math.max(elapsedMs, 0);
    const progress = Math.min(
      clampedElapsed / LeftWall.TICK_RAMP_DURATION_MS,
      1
    );
    return (
      LeftWall.INITIAL_TICK_INTERVAL_MS -
      progress *
        (LeftWall.INITIAL_TICK_INTERVAL_MS -
          LeftWall.MINIMUM_TICK_INTERVAL_MS)
    );
  }

  /**
   * Advance the wall if the dynamic tick interval has elapsed.
   *
   * The interval is derived from the elapsed game time (see
   * getTickInterval), so the wall starts slow (400ms/tick) and accelerates
   * to 200ms/tick over 10 seconds of game time.
   *
   * @param elapsedMs Total game time elapsed in milliseconds (from Game).
   * @returns null if the interval has not elapsed (the wall did not move),
   *   otherwise the chain-push result of this movement step (both arrays
   *   empty when nothing was pushed or the push aborted atomically). The
   *   Game uses the result to register visual effects (TASK-028).
   */
  tick(elapsedMs: number): ChainPushResult | null {
    const now = this.currentTimeMillis();
    const elapsed = now - this.lastTickMs;

    if (elapsed >= this.getTickInterval(elapsedMs)) {
      this.x++;
      this.lastTickMs = now;
      return this.onWallAdvanced();
    }
    return null;
  }

  /**
   * Force the wall to move one step (for testing or explicit advancement).
   *
   * @returns The chain-push result of this movement step (both arrays
   *   empty when nothing was pushed or the push aborted atomically).
   */
  advance(): ChainPushResult {
    this.x++;
    return this.onWallAdvanced();
  }

  /**
   * Check if the wall is at the rightmost position of the field.
   */
  isAtRightEdge(): boolean {
    return this.x >= this.field.getCols() - 1;
  }

  // -------------------------------------------------------------------------
  // Contact & collision handling
  // -------------------------------------------------------------------------

  /**
   * Called after each wall advancement.
   * Handles contact with the active piece and fixed blocks.
   *
   * When the wall contacts the active piece, the piece is immediately fixed
   * to the field at its current position (spec: game-design.md:62-67), the
   * onPieceFixed callback fires (Game nulls Game.activePiece), and the LeftWall
   * drops its reference. Then the method falls through to advance
   * occupied blocks in the wall column (BFS chain push), so the just-fixed
   * cells are pushed the same tick.
   *
   * @returns The chain-push result of this advancement (both arrays empty
   *   when nothing was pushed or the push was aborted atomically). The
   *   caller uses the result to register visual effects (TASK-028).
   */
  private onWallAdvanced(): ChainPushResult {
    // 1. Contact with the active piece -> fix it at its current position.
    if (this.activePiece && this.activePiece.isWallHit(this.x)) {
      this.activePiece.moveToFixed();
      this.activePiece = null;
      if (this.onPieceFixed) this.onPieceFixed();
    }
    // 2. Push the wall column (BFS chain push). At contact the leftmost piece
    //    cells sit exactly at this.x, so they are pushed this same tick.
    return this.advanceOccupiedBlocksInColumn(this.x);
  }

  /**
   * Check if the given x-column contains any occupied (fixed) blocks.
   *
   * @param col The x-column to check.
   * @returns true if there is at least one occupied block in the column.
   */
  hasOccupiedBlocksInColumn(col: number): boolean {
    for (let y = 0; y < Field.ROWS; y++) {
      if (this.field.get(col, y)) return true;
    }
    return false;
  }

  /**
   * Advance the occupied blocks in the given column by one column to the
   * right, pulling along any blocks horizontally connected to them
   * (BFS chain push, TASK-026). Used when the wall catches up to fixed
   * blocks.
   *
   * Algorithm:
   *  1. Seed the move set with all occupied blocks in the wall column.
   *  2. BFS expand RIGHT: for each block in the set, an occupied right
   *     neighbor (x+1, same y) is added to the set and recorded as a
   *     connection point. Expansion is horizontal-only (no vertical
   *     connections) and read-only (the field is not modified).
   *  3. Validate every target (x+1, y): within bounds and either empty or
   *     itself a member of the move set (members vacate simultaneously).
   *  4. If any target fails, abort atomically — no block moves.
   *  5. Otherwise move all blocks one column right simultaneously.
   */
  private advanceOccupiedBlocksInColumn(
    col: number
  ): ChainPushResult {
    const toMove: Array<{ x: number; y: number }> = [];
    const connectedPreMove: Array<{ x: number; y: number }> = [];
    const inSet = new Set<string>();

    // Seed: all occupied blocks in the wall column.
    for (let y = 0; y < Field.ROWS; y++) {
      if (this.field.get(col, y)) {
        inSet.add(`${col},${y}`);
        toMove.push({ x: col, y });
      }
    }

    if (toMove.length === 0) {
      return { pushedCells: [], connectedCells: [] };
    }

    // Blocks in the wall column are the "pushed" cells; everything added
    // during BFS expansion is a "connected" cell.
    const pushedCount = toMove.length;

    // BFS expansion to the right. y never changes during expansion, so
    // vertical wrapping cannot create a chain connection; the same-row
    // right neighbor is the only connection rule.
    let head = 0;
    while (head < toMove.length) {
      const current = toMove[head++];
      const rightX = current.x + 1;
      if (rightX < Field.COLS) {
        const key = `${rightX},${current.y}`;
        if (!inSet.has(key) && this.field.get(rightX, current.y)) {
          inSet.add(key);
          toMove.push({ x: rightX, y: current.y });
          connectedPreMove.push({ x: rightX, y: current.y });
        }
      }
    }

    // Validate all target positions BEFORE moving: within bounds and
    // either empty or a member of the move set (a member's cell is
    // vacated in the same move, so it is a valid target).
    for (const cell of toMove) {
      const newX = cell.x + 1;
      const targetInSet = inSet.has(`${newX},${cell.y}`);
      const targetFree = !this.field.get(newX, cell.y);
      if (!this.field.isValidPosition(newX, cell.y) || (!targetInSet && !targetFree)) {
        // Atomic abort: nothing moves, preventing partial pushes and
        // block overwrites.
        return { pushedCells: [], connectedCells: [] };
      }
    }

    // All validations passed: clear old positions, then set new ones.
    for (const cell of toMove) {
      this.field.set(cell.x, cell.y, false);
    }
    for (const cell of toMove) {
      this.field.set(cell.x + 1, cell.y, true);
    }

    // Report post-move positions for effect registration (TASK-028).
    const pushedCells: Array<{ x: number; y: number }> = [];
    const connectedCells: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < pushedCount; i++) {
      pushedCells.push({ x: toMove[i].x + 1, y: toMove[i].y });
    }
    for (const cell of connectedPreMove) {
      connectedCells.push({ x: cell.x + 1, y: cell.y });
    }
    return { pushedCells, connectedCells };
  }

  // -------------------------------------------------------------------------
  // Active piece management
  // -------------------------------------------------------------------------

  /**
   * Set the active piece reference for contact detection.
   */
  setActivePiece(piece: ActivePiece | null): void {
    this.activePiece = piece;
  }

  /**
   * Register the callback invoked when the active piece is fixed at
   * wall contact (TASK-030). Null-safe: if no callback is registered,
   * the fixation still works without side effects.
   */
  setOnPieceFixed(cb: () => void): void {
    this.onPieceFixed = cb;
  }

  // -------------------------------------------------------------------------
  // String representation
  // -------------------------------------------------------------------------

  toString(): string {
    return `LeftWall(x=${this.x})`;
  }
}
