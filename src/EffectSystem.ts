/**
 * EffectSystem manages transient visual effects on fixed blocks (TASK-028).
 *
 * The Game registers effects from the LeftWall chain-push results
 * (TASK-026): a "pushed" flash on the wall-column blocks that were pushed
 * directly, and a "connected" glow on the blocks pulled along by the BFS
 * chain push. The Renderer queries the live effects every frame and draws
 * them on top of the normal block rendering.
 *
 * Pure logic: no dependency on Renderer, Canvas, or the DOM, so the system
 * is fully unit-testable (Constraint-002 / TASK-028 constraint).
 */

/**
 * A single transient visual effect bound to one cell.
 */
export interface Effect {
  type: 'pushed' | 'connected';
  x: number;
  y: number;
  /** Wall-clock time (ms) at which the effect was registered. */
  createdAt: number;
  /** Lifetime of the effect in milliseconds. */
  duration: number;
}

/** Cell coordinate (structurally compatible with ChainPushResult cells). */
export interface EffectCell {
  x: number;
  y: number;
}

export class EffectSystem {
  /** Lifetime of a pushed-block flash, in milliseconds. */
  static readonly PUSH_DURATION_MS = 300;

  /** Lifetime of a connected-block glow, in milliseconds. */
  static readonly CONNECT_DURATION_MS = 400;

  /** Live effects, keyed by "type,x,y" (one effect per cell per type). */
  private effects: Map<string, Effect>;

  constructor() {
    this.effects = new Map();
  }

  // -------------------------------------------------------------------------
  // Time helper
  // -------------------------------------------------------------------------

  /**
   * Get current time in milliseconds.
   * Abstracted as a method so it can be overridden in tests
   * (same pattern as LeftWall and Game).
   */
  protected currentTimeMillis(): number {
    return Date.now();
  }

  // -------------------------------------------------------------------------
  // Registration
  // -------------------------------------------------------------------------

  /**
   * Register (or refresh) a push flash on each given cell.
   *
   * Re-registering a cell that already has a live push flash restarts its
   * lifetime: a block that is pushed again flashes again.
   */
  registerPushEffect(cells: EffectCell[]): void {
    const now = this.currentTimeMillis();
    for (const cell of cells) {
      this.effects.set(`pushed,${cell.x},${cell.y}`, {
        type: 'pushed',
        x: cell.x,
        y: cell.y,
        createdAt: now,
        duration: EffectSystem.PUSH_DURATION_MS,
      });
    }
  }

  /**
   * Register (or refresh) a connection glow on each given cell.
   */
  registerConnectionEffect(cells: EffectCell[]): void {
    const now = this.currentTimeMillis();
    for (const cell of cells) {
      this.effects.set(`connected,${cell.x},${cell.y}`, {
        type: 'connected',
        x: cell.x,
        y: cell.y,
        createdAt: now,
        duration: EffectSystem.CONNECT_DURATION_MS,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Update / query
  // -------------------------------------------------------------------------

  /**
   * Remove effects whose lifetime has elapsed.
   *
   * Expiration is evaluated against the wall clock (createdAt + duration),
   * so an effect always survives for exactly its duration of real time,
   * independent of frame timing.
   *
   * @param deltaMs Frame delta in milliseconds. Optional and not used for
   *   expiration itself; kept so the frame loop can pass its per-frame
   *   delta without an API change.
   */
  update(deltaMs: number = 0): void {
    const now = this.currentTimeMillis();
    for (const [key, effect] of this.effects) {
      if (now - effect.createdAt >= effect.duration) {
        this.effects.delete(key);
      }
    }
  }

  /**
   * All currently live pushed-effect cells (post-move positions).
   */
  getPushedCells(): EffectCell[] {
    return this.cellsByType('pushed');
  }

  /**
   * All currently live connected-effect cells (post-move positions).
   */
  getConnectedCells(): EffectCell[] {
    return this.cellsByType('connected');
  }

  private cellsByType(type: Effect['type']): EffectCell[] {
    const cells: EffectCell[] = [];
    for (const effect of this.effects.values()) {
      if (effect.type === type) {
        cells.push({ x: effect.x, y: effect.y });
      }
    }
    return cells;
  }

  /**
   * Remove all effects (used on game restart so effects never persist
   * across games).
   */
  clear(): void {
    this.effects.clear();
  }
}
