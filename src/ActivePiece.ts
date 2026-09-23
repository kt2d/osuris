import { Field } from './Field.js';

/**
 * Represents a single Tetrimino shape (one rotation state).
 * Stored as a set of {x, y} coordinates relative to the piece's origin.
 */
export type TetriminoShape = Array<{ x: number; y: number }>;

/**
 * ActivePiece manages Tetrimino generation, rotation, movement,
 * and collision detection for the player-controlled piece.
 *
 * The piece exists in field coordinate space and interacts with the
 * field's occupied cells via collision detection.
 *
 * Rotation model:
 *  - Each tetromino has 4 rotation states (0, 90, 180, 270 degrees).
 *  - 90° clockwise rotation is applied as (x, y) -> (y, -x) per step.
 *  - The shape is stored as offsets relative to a fixed origin.
 */
export class ActivePiece {
  // -------------------------------------------------------------------------
  // Tetrimino shape definitions
  // -------------------------------------------------------------------------

  /**
   * Return the base shape (rotation 0) for the given tetromino type.
   * Each shape is defined as an array of {x, y} offsets.
   */
  static getBaseShape(type: number): TetriminoShape {
    switch (type) {
      case 0: // I
        return [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
        ];
      case 1: // O
        return [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ];
      case 2: // T
        return [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 1, y: 1 },
        ];
      case 3: // S
        return [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ];
      case 4: // Z
        return [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ];
      case 5: // J
        return [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ];
      case 6: // L
        return [
          { x: 2, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ];
      default:
        return [];
    }
  }

  /**
   * Apply 90° clockwise rotation N times to a shape.
   * Single step transformation: (x, y) -> (y, -x).
   */
  static rotateShape(shape: TetriminoShape, steps: number): TetriminoShape {
    let result = shape.map((cell) => ({ ...cell }));
    for (let s = 0; s < steps; s++) {
      result = result.map((cell) => ({ x: cell.y, y: -cell.x }));
    }
    return result;
  }

  /**
   * Return the shape for a specific tetromino type and rotation state.
   */
  static getShape(type: number, rotation: number): TetriminoShape {
    const base = ActivePiece.getBaseShape(type);
    if (rotation === 0) return base;
    return ActivePiece.rotateShape(base, rotation);
  }

  // -------------------------------------------------------------------------
  // Constructor & state
  // -------------------------------------------------------------------------

  /** Current rotation state (0 = 0°, 1 = 90°, 2 = 180°, 3 = 270°). */
  private rotation: number;

  /** Current x position in field coordinates. */
  private x: number;

  /** Current y position in field coordinates. */
  private y: number;

  /** Reference to the field for collision checks. */
  private field: Field;

  /** Tetromino type (0-6). */
  private type: number;

  constructor(
    field: Field,
    type: number,
    x: number,
    y: number,
    rotation: number = 0
  ) {
    this.field = field;
    this.type = type;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /** Get the current rotation state. */
  getRotation(): number {
    return this.rotation;
  }

  /** Get the current x position. */
  getX(): number {
    return this.x;
  }

  /** Get the current y position. */
  getY(): number {
    return this.y;
  }

  /** Get the tetromino type (0-6). */
  getType(): number {
    return this.type;
  }

  /** Get the field reference. */
  getField(): Field {
    return this.field;
  }

  // -------------------------------------------------------------------------
  // Shape computation
  // -------------------------------------------------------------------------

  /**
   * Return the shape at the current position and rotation.
   * Each cell is returned with field-space coordinates (x is raw,
   * y is wrapped via Field.wrapY()).
   */
  getOccupiedCells(): Array<{ x: number; y: number }> {
    const shape = ActivePiece.getShape(this.type, this.rotation);
    return shape.map((cell) => ({
      x: this.x + cell.x,
      y: this.field.wrapY(this.y + cell.y),
    }));
  }

  // -------------------------------------------------------------------------
  // Movement
  // -------------------------------------------------------------------------

  /**
   * Move the piece by (dx, dy).
   */
  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  // -------------------------------------------------------------------------
  // Collision detection
  // -------------------------------------------------------------------------

  /**
   * Check if the given set of cells collides with the field's occupied
   * cells or goes out of bounds.
   */
  private cellsCollide(cells: Array<{ x: number; y: number }>): boolean {
    for (const cell of cells) {
      // Out of bounds check (x only; y wraps via the field).
      if (!this.field.isValidPosition(cell.x, cell.y)) return true;

      // O(1) occupancy check via field.get().
      if (this.field.get(cell.x, cell.y)) return true;
    }
    return false;
  }

  /**
   * Predict whether rotating the piece to the next rotation state
   * would cause a collision or strand cells behind the wall.
   *
   * @param minAllowedX Minimum allowed x-coordinate for rotated cells.
   *   Cells with x < minAllowedX would be behind the wall (TASK-031).
   *   Default -Infinity means unrestricted (backward-compatible no-arg callers).
   * @returns true if the rotation would collide or be behind the wall (i.e. it is blocked).
   */
  wouldRotateCollide(minAllowedX: number = -Infinity): boolean {
    const nextRotation = (this.rotation + 1) % 4;
    const base = ActivePiece.getBaseShape(this.type);
    const rotated = ActivePiece.rotateShape(base, nextRotation);
    const rotatedCells = rotated.map((cell) => ({
      x: this.x + cell.x,
      y: this.field.wrapY(this.y + cell.y),
    }));
    // A cell that would end up behind the wall (x < minAllowedX, i.e. x <= wallX)
    // would be stranded; block the rotation.
    for (const cell of rotatedCells) {
      if (cell.x < minAllowedX) return true;
    }
    return this.cellsCollide(rotatedCells);
  }

  /**
   * Rotate the piece 90° clockwise if the rotation would not cause a collision
   * or strand cells behind the wall.
   *
   * @param minAllowedX Minimum allowed x-coordinate for rotated cells.
   *   Cells with x < minAllowedX would be behind the wall (TASK-031).
   *   Default -Infinity means unrestricted (backward-compatible no-arg callers).
   * @returns true if the rotation was applied, false if it was blocked.
   */
  rotate(minAllowedX: number = -Infinity): boolean {
    if (this.wouldRotateCollide(minAllowedX)) return false;
    this.rotation = (this.rotation + 1) % 4;
    return true;
  }

  /**
   * Check if the piece's current position collides with occupied cells
   * on the field or goes out of bounds.
   *
   * Used for spawn validation to prevent pieces from spawning in
   * invalid positions overlapping with existing blocks.
   *
   * @returns true if the current position collides, false if clear.
   */
  isColliding(): boolean {
    return this.cellsCollide(this.getOccupiedCells());
  }

  // -------------------------------------------------------------------------
  // Transfer to fixed blocks
  // -------------------------------------------------------------------------

  /**
   * Transfer all occupied cells from the active piece to the field's
   * occupied grid (marking them as true). The piece is then cleared
   * by setting its position far outside the valid range.
   */
  moveToFixed(): void {
    const shape = ActivePiece.getShape(this.type, this.rotation);
    for (const cell of shape) {
      const fx = this.x + cell.x;
      const fy = this.field.wrapY(this.y + cell.y);
      this.field.set(fx, fy, true);
    }
    // Clear the piece's own cells.
    this.x = -100;
    this.y = -100;
  }

  // -------------------------------------------------------------------------
  // Wall collision detection
  // -------------------------------------------------------------------------

  /**
   * Check if the left wall at the given x-position has made contact
   * with this active piece.
   *
   * Returns false if the piece is in an invalid/cleared position.
   * Returns true if any occupied cell of the piece has an x-coordinate
   * less than or equal to the wall's x-position.
   *
   * @param wallX The current x-position of the left wall.
   * @returns true if the wall has hit the piece.
   */
  isWallHit(wallX: number): boolean {
    // If the piece has been cleared (position far outside valid range),
    // it cannot collide with the wall.
    if (this.x < 0 || this.y < 0) return false;

    const cells = this.getOccupiedCells();
    for (const cell of cells) {
      if (cell.x <= wallX) return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // String representation
  // -------------------------------------------------------------------------

  toString(): string {
    const cells = this.getOccupiedCells();
    return (
      `ActivePiece(type=${this.type}, x=${this.x}, y=${this.y}, ` +
      `rotation=${this.rotation}, cells=[${cells.map((c) => `(${c.x},${c.y})`).join(', ')}])`
    );
  }
}
