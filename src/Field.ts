export class Field {
  static readonly COLS = 16;
  static readonly ROWS = 8;

  private grid: boolean[][];

  constructor() {
    this.grid = Array.from({ length: Field.ROWS }, () =>
      Array.from({ length: Field.COLS }, () => false)
    );
  }

  getCols(): number {
    return Field.COLS;
  }

  getRows(): number {
    return Field.ROWS;
  }

  get(x: number, y: number): boolean {
    const wrappedY = this.wrapY(y);
    return this.grid[wrappedY][x];
  }

  set(x: number, y: number, value: boolean): void {
    const wrappedY = this.wrapY(y);
    this.grid[wrappedY][x] = value;
  }

  /**
   * Map a y-coordinate to the valid row range [0, ROWS).
   * Implements vertical looping: y=8 → 0, y=-1 → 7, etc.
   */
  wrapY(y: number): number {
    return ((y % Field.ROWS) + Field.ROWS) % Field.ROWS;
  }

  /**
   * Map an x-coordinate to the valid column range [0, COLS).
   * Horizontal direction does NOT loop. Returns clamped value.
   */
  wrapX(x: number): number {
    return Math.max(0, Math.min(x, Field.COLS - 1));
  }

  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < Field.COLS;
  }

  clear(): void {
    for (let y = 0; y < Field.ROWS; y++) {
      for (let x = 0; x < Field.COLS; x++) {
        this.grid[y][x] = false;
      }
    }
  }

  countBlocks(): number {
    let count = 0;
    for (let y = 0; y < Field.ROWS; y++) {
      for (let x = 0; x < Field.COLS; x++) {
        if (this.grid[y][x]) count++;
      }
    }
    return count;
  }

  getGrid(): boolean[][] {
    return this.grid.map((row) => [...row]);
  }

  /**
   * Return all occupied (true) cells on the field as {x, y} coordinates.
   * Both x and y are in field coordinate space (y already wrapped to [0, ROWS)).
   */
  getOccupiedCells(): Array<{ x: number; y: number }> {
    const cells: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < Field.ROWS; y++) {
      for (let x = 0; x < Field.COLS; x++) {
        if (this.grid[y][x]) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }
}
