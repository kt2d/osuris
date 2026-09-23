import { Field } from './Field.js';
import { RightWall } from './RightWall.js';

/**
 * CompressionSystem handles the logic for compressing blocks
 * when the left wall meets the right wall.
 *
 * The compression algorithm follows the specification in compress-mechanism.md:
 *  1. Seed the movement target with the blocks in the moving wall's column
 *    (the wall pushes the blocks it contacts).
 *  2. Expand the set to the RIGHT only: a block whose same-row right neighbor
 *    is occupied adds that neighbor to the movement target.
 *  3. Check if the entire group can move one step right.
 *  4. If yes, move all blocks simultaneously by one step right.
 *  5. Repeat until no more blocks can move (movement target is re-seeded
 *    at the wall column every step).
 *
 * After compression completes, the left wall resets via the provided callback.
 *
 * Compression only triggers when the left wall is within a configurable
 * threshold distance of the right wall.
 */
export class CompressionSystem {
  private field: Field;
  private rightWall: RightWall;
  private threshold: number;
  private onLeftWallReset: (() => void) | null;

  constructor(
    field: Field,
    rightWall: RightWall,
    onLeftWallReset: (() => void) | null = null,
    threshold: number = 1
  ) {
    this.field = field;
    this.rightWall = rightWall;
    this.onLeftWallReset = onLeftWallReset;
    this.threshold = threshold;
  }

  // -------------------------------------------------------------------------
  // Trigger check
  // -------------------------------------------------------------------------

  /**
   * Determine if compression should be initiated.
   *
   * @param leftWallX The current x-position of the left wall.
   * @returns true if the walls are within the configured threshold.
   */
  shouldCompress(leftWallX: number): boolean {
    return this.rightWall.getX() - leftWallX <= this.threshold;
  }

  // -------------------------------------------------------------------------
  // Compression execution
  // -------------------------------------------------------------------------

  /**
   * Execute the full compression cycle.
   *
   *  1. Push all blocks rightward via BFS until blocked. The movement target
   *     is re-seeded at the left wall's column each step (TASK-036).
   *  2. If movement occurred, reset the left wall via callback and return true.
   *  3. If no movement and the field is completely full, restore state and return false.
   *  4. If no movement and the field is not full, finalize the current
   *     configuration as-is and reset the left wall (compress-mechanism.md
   *     step 5: compression ends when any block cannot move; the placement
   *     at that point is finalized).
   *
   * @param leftWallX The current x-position of the left wall.
   * @returns true if compression was executed, false if the field is full.
   */
  compress(leftWallX: number): boolean {
    if (!this.shouldCompress(leftWallX)) return false;

    const preState = this.field.getGrid();

    // Try pushing blocks rightward, seeding the movement target at the
    // moving wall's column (compress-mechanism.md: the wall pushes the
    // blocks it contacts; the target expands to the right only).
    this.pushBlocksRight(leftWallX);

    if (this.hasAnyMovement(preState)) {
      // Push succeeded. Reset the left wall to begin a new cycle.
      this.resetLeftWall();
      return true;
    }

    // Push produced no movement.
    // If the field is completely full, compression cannot help — game over.
    // Restore state and signal failure so the caller can end the game.
    if (this.field.countBlocks() === Field.COLS * Field.ROWS) {
      this.restoreGrid(preState);
      return false;
    }

    // No movement and the field is not full: per compress-mechanism.md step 5,
    // compression ends and the current configuration is finalized as-is
    // (unmovable blocks stay where they are; no vertical redistribution).
    // The cycle still completes because the walls have met, so reset the
    // left wall.
    this.resetLeftWall();
    return true;
  }

  /**
   * Check if the field has changed since the given state (indicating
   * that the push performed some movement).
   */
  private hasAnyMovement(preState: boolean[][]): boolean {
    const postState = this.field.getGrid();
    for (let y = 0; y < Field.ROWS; y++) {
      for (let x = 0; x < Field.COLS; x++) {
        if (preState[y][x] !== postState[y][x]) return true;
      }
    }
    return false;
  }

  /** Restore the field to a previously saved state. */
  private restoreGrid(state: boolean[][]): void {
    for (let y = 0; y < Field.ROWS; y++) {
      for (let x = 0; x < Field.COLS; x++) {
        this.field.set(x, y, state[y][x]);
      }
    }
  }

  // -------------------------------------------------------------------------
  // BFS block push
  // -------------------------------------------------------------------------

  /**
   * Repeatedly push all blocks rightward until no more movement is possible.
   *
   * Each iteration:
   *  1. Build the movement set via BFS from blocks at leftWallX (the column
   *     the moving wall pushes against).
   *  2. Validate all blocks can move right (right neighbor is empty or in
   *     the set).
   *  3. If valid, move all blocks simultaneously one step right.
   *  4. Repeat until a movement fails.
   *
   * @param leftWallX The x-position of the moving (left) wall.
   */
  private pushBlocksRight(leftWallX: number): void {
    while (true) {
      const movementSet = this.buildMovementSet(leftWallX);

      if (movementSet.length === 0) break;

      if (!this.canMoveRight(movementSet)) break;

      this.moveRight(movementSet);
    }
  }

  /**
   * Build the set of blocks that should move right in this iteration.
   *
   * Seeds from blocks in the moving wall's column (the wall pushes the
   * blocks it contacts). Expands to the RIGHT only: for each block in the
   * set, an occupied same-row right neighbor joins the set. Blocks behind
   * the wall (x < leftWallX) are never pulled into the movement target
   * (TASK-036; compress-mechanism.md "移動対象の構築").
   *
   * @param leftWallX The x-position of the moving (left) wall.
   */
  private buildMovementSet(leftWallX: number): Array<{ x: number; y: number }> {
    const wallX = this.rightWall.getX();
    const set = new Set<string>();
    const queue: Array<{ x: number; y: number }> = [];

    // Seed: all blocks in the moving wall's column.
    for (let y = 0; y < Field.ROWS; y++) {
      if (this.field.get(leftWallX, y)) {
        const key = `${leftWallX},${y}`;
        if (!set.has(key)) {
          set.add(key);
          queue.push({ x: leftWallX, y });
        }
      }
    }

    // BFS expansion: find connected blocks to the RIGHT (toward the right
    // wall). The wall pushes rightward, so the group extends rightward from
    // the wall. The right wall column is the boundary: a block at the right
    // wall's x-position has no cell to move into, so expansion stops there.
    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];

      const rightX = current.x + 1;
      if (rightX > wallX) continue;

      const rightKey = `${rightX},${current.y}`;

      if (!set.has(rightKey) && this.field.get(rightX, current.y)) {
        set.add(rightKey);
        queue.push({ x: rightX, y: current.y });
      }
    }

    return queue;
  }

  /**
   * Check if all blocks in the movement set can move one step right.
   *
   * A block can move right if its right neighbor (same row) is either
   * empty or also in the movement set. A block at the right wall's
   * x-position has no cell to move into and cannot move, which ends the
   * compression cycle (stopping condition in compress-mechanism.md).
   */
  private canMoveRight(moveSet: Array<{ x: number; y: number }>): boolean {
    const setKeys = new Set(moveSet.map((c) => `${c.x},${c.y}`));
    const wallX = this.rightWall.getX();

    for (const cell of moveSet) {
      const rightX = cell.x + 1;

      // Right wall boundary: a block at the wall column cannot move right.
      if (rightX > wallX) {
        return false;
      }

      const rightKey = `${rightX},${cell.y}`;

      if (!setKeys.has(rightKey) && this.field.get(rightX, cell.y)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Move all blocks in the set simultaneously one step to the right.
   *
   * Uses simultaneous update: compute all new positions first, then apply.
   * Targets are guaranteed in-bounds because canMoveRight() rejected any
   * set whose rightmost block sits at the right wall column.
   */
  private moveRight(set: Array<{ x: number; y: number }>): void {
    const newPositions: Array<{ x: number; y: number }> = set.map(
      (cell) => ({ x: cell.x + 1, y: cell.y })
    );

    for (const cell of set) {
      this.field.set(cell.x, cell.y, false);
    }
    for (const pos of newPositions) {
      this.field.set(pos.x, pos.y, true);
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  /**
   * Reset the left wall via the provided callback.
   * No-op if no callback was provided.
   */
  private resetLeftWall(): void {
    if (this.onLeftWallReset) {
      this.onLeftWallReset();
    }
  }

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  /**
   * Set the threshold distance for triggering compression.
   *
   * @param threshold The maximum distance between walls to trigger compression.
   */
  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  /** Get the current compression threshold. */
  getThreshold(): number {
    return this.threshold;
  }

  // -------------------------------------------------------------------------
  // String representation
  // -------------------------------------------------------------------------

  toString(): string {
    return `CompressionSystem(threshold=${this.threshold})`;
  }
}
