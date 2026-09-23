import { Field } from './Field.js';

/**
 * RightWall represents the right-side boundary of the field.
 *
 * It serves as the anchor for compressed blocks. Blocks pushed against
 * the right wall accumulate here and move together with the wall when
 * it shifts vertically.
 *
 * The right wall can shift vertically with wrapping (on-screen direction):
 * shifting up from y=0 wraps to y=7; shifting down from y=7 wraps to y=0.
 * Only blocks directly at the wall's x-position move during vertical
 * shifts; horizontally connected blocks in adjacent columns are not
 * dragged (per compress-mechanism.md "壁に接触しているブロックは壁と一緒に移動する").
 */
export class RightWall {
  private x: number;
  private y: number;
  private field: Field;

  constructor(field: Field, x: number, y: number = 0) {
    this.field = field;
    this.x = x;
    this.y = y;
  }

  // -------------------------------------------------------------------------
  // Position access
  // -------------------------------------------------------------------------

  /** Get the x-position of the right wall. */
  getX(): number {
    return this.x;
  }

  /** Get the y-position of the right wall. */
  getY(): number {
    return this.y;
  }

  /**
   * Set the y-position directly.
   * Automatically wraps to [0, ROWS).
   */
  setY(y: number): void {
    this.y = this.field.wrapY(y);
  }

  // -------------------------------------------------------------------------
  // Vertical shifting
  // -------------------------------------------------------------------------

  /**
   * Shift the right wall vertically by dy.
   * Also moves blocks directly at the wall's x-position by the same amount.
   *
   * Only occupied cells at the wall's own column are moved — no horizontal
   * expansion into adjacent columns. Vertical wrapping is handled by
   * Field.wrapY().
   *
     * @param dy The vertical displacement in y-index units. dy>0 increases the
     *   y-index; since the renderer draws y=0 at the top, dy>0 moves the wall
     *   DOWN on screen and dy<0 moves it UP. `Game` maps ArrowUp to dy<0 and
     *   ArrowDown to dy>0 accordingly.
   */
  shiftVertical(dy: number): void {
    const oldY = this.y;
    this.y = this.field.wrapY(oldY + dy);

    // Move blocks at the wall's column by the same delta.
    this.moveBlocksVertical(dy);
  }

  /**
   * Move occupied blocks at the wall's x-position by dy.
   *
   * Only cells at this.x are moved. No BFS expansion into adjacent columns
   * (per compress-mechanism.md "壁に接触しているブロックは壁と一緒に移動する"
   * and Decision-037-1).
   * Uses simultaneous update: compute new positions first, then apply.
   */
  private moveBlocksVertical(dy: number): void {
    // Collect occupied cells at the wall's column only.
    const toMove: Array<{ x: number; y: number }> = [];

    for (let y = 0; y < Field.ROWS; y++) {
      if (this.field.get(this.x, y)) {
        toMove.push({ x: this.x, y });
      }
    }

    if (toMove.length === 0) return;

    // Compute new positions simultaneously (all cells move by dy with wrapping).
    const newPositions: Array<{ x: number; y: number }> = toMove.map(
      (cell) => ({ x: cell.x, y: this.field.wrapY(cell.y + dy) })
    );

    // Clear old positions first.
    for (const cell of toMove) {
      this.field.set(cell.x, cell.y, false);
    }

    // Set new positions.
    for (const pos of newPositions) {
      this.field.set(pos.x, pos.y, true);
    }
  }

  // -------------------------------------------------------------------------
  // String representation
  // -------------------------------------------------------------------------

  toString(): string {
    return `RightWall(x=${this.x}, y=${this.y})`;
  }
}
