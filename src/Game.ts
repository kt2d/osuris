import { Field } from './Field.js';
import { ActivePiece } from './ActivePiece.js';
import { LeftWall } from './LeftWall.js';
import { RightWall } from './RightWall.js';
import { CompressionSystem } from './CompressionSystem.js';
import { InputManager } from './InputManager.js';
import { Renderer } from './Renderer.js';
import { EffectSystem } from './EffectSystem.js';

/** Game states for the state machine. */
export type GameState = 'PLAYING' | 'COMPRESSING' | 'GAME_OVER';

/**
 * Game is the central orchestrator of the Horizontal Compression Puzzle Game.
 *
 * It coordinates all game components (Field, ActivePiece, LeftWall, RightWall,
 * CompressionSystem, InputManager, Renderer, EffectSystem) and manages the
 * game state machine.
 *
 * State transitions:
 *  - start() -> spawnPiece() -> PLAYING
 *  - PLAYING: LeftWall advances each frame; player rotates piece and shifts wall
 *  - When walls meet -> COMPRESSING
 *  - COMPRESSING: active piece is fixed, compression runs
 *  - After compression success -> spawnPiece() -> PLAYING
 *  - After compression failure -> GAME_OVER
 *  - GAME_OVER: no updates, only render
 */
export class Game {
  private state: GameState;
  private field: Field;
  private activePiece: ActivePiece | null;
  private leftWall: LeftWall;
  private rightWall: RightWall;
  private compressionSystem: CompressionSystem;
  private inputManager: InputManager;
  private renderer: Renderer;
  private effectSystem: EffectSystem;
  private canvas: HTMLCanvasElement;
  private animFrameId: number | null;
  /**
   * Loop generation counter (CR-IT2-003).
   *
   * start() is typically called from inside an in-flight gameLoop() iteration
   * (Enter -> RESTART in GAME_OVER). That iteration would still schedule
   * another frame after start() returns, leaving two concurrent loops.
   * Incrementing the generation inside start() lets the stale iteration
   * detect that it has been superseded and skip rescheduling.
   */
  private loopGeneration: number;

  /**
   * Time of the most recent start() in milliseconds (TASK-027).
   * Used as the reference point for the dynamic wall-speed ramp; reset on
   * every start() (including restart from GAME_OVER) so each game begins
   * at the slowest wall speed.
   */
  private startTime: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.field = new Field();
    this.rightWall = new RightWall(this.field, Field.COLS - 1, 0);
    this.leftWall = new LeftWall(this.field, null);
    // At wall contact, the LeftWall fixes the piece and nulls its own
    // reference; the callback nulls Game.activePiece so the
    // updateCompressing safety-net does not double-moveToFixed
    // (TASK-030, Decision-030-2).
    this.leftWall.setOnPieceFixed(() => {
      this.activePiece = null;
    });
    this.compressionSystem = new CompressionSystem(
      this.field,
      this.rightWall,
      () => {
        // Left wall reset callback: position wall back to x=0
        this.leftWall.setPosition(0);
      }
    );
    this.inputManager = new InputManager(canvas);
    this.renderer = new Renderer(canvas);
    this.effectSystem = new EffectSystem();
    this.activePiece = null;
    this.state = 'GAME_OVER';
    this.animFrameId = null;
    this.loopGeneration = 0;
    this.startTime = 0;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Start the game. Spawns the first piece and begins the game loop.
   *
   * Safe to call while a loop is already running (restart from GAME_OVER):
   * any pending frame is cancelled and any in-flight iteration is invalidated
   * so that only the new loop keeps running (CR-IT2-003).
   */
  start(): void {
    // Cancel any existing animation frame so a restart does not leave the
    // old loop pending alongside the new one.
    this.stop();
    // Invalidate any gameLoop() iteration currently executing (restart path):
    // it must not schedule another frame after start() returns.
    this.loopGeneration++;

    // Reset field and state
    this.field.clear();
    this.activePiece = null;
    this.leftWall.setPosition(0);
    this.rightWall.setY(0);
    this.inputManager.reset();
    // Visual effects must not persist across games (TASK-028 AC #7).
    this.effectSystem.clear();
    // (Re)start the dynamic wall-speed ramp: elapsed time is measured from
    // this moment (TASK-027). Restart from GAME_OVER gets a fresh ramp too.
    this.startTime = this.currentTimeMillis();

    if (!this.spawnPiece()) {
      this.state = 'GAME_OVER';
    } else {
      this.state = 'PLAYING';
    }

    this.gameLoop();
  }

  /**
   * Stop the game loop. Cancels the animation frame.
   */
  stop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /** Get the current game state. */
  getState(): GameState {
    return this.state;
  }

  /**
   * Get the current score as block density percentage.
   * Score = countBlocks() / (COLS * ROWS) * 100
   */
  getScore(): number {
    return Math.round(
      (this.field.countBlocks() / (Field.COLS * Field.ROWS)) * 100
    );
  }

  // -------------------------------------------------------------------------
  // Time helpers (TASK-027)
  // -------------------------------------------------------------------------

  /**
   * Get current time in milliseconds.
   * Abstracted as a method so it can be overridden in tests.
   */
  protected currentTimeMillis(): number {
    return Date.now();
  }

  /**
   * Total game time elapsed since the most recent start(), in milliseconds
   * (TASK-027). Fed to LeftWall.tick(elapsedMs) to drive the dynamic wall
   * speed. Does NOT reset on wall/compression resets — the ramp is based on
   * total game time; only start() (including restart) resets it.
   */
  elapsedTime(): number {
    return this.currentTimeMillis() - this.startTime;
  }

  // -------------------------------------------------------------------------
  // Component accessors (for testing)
  // -------------------------------------------------------------------------

  /** Get the field reference. */
  getField(): Field {
    return this.field;
  }

  /** Get the active piece reference. */
  getActivePiece(): ActivePiece | null {
    return this.activePiece;
  }

  /** Get the left wall reference. */
  getLeftWall(): LeftWall {
    return this.leftWall;
  }

  /** Get the right wall reference. */
  getRightWall(): RightWall {
    return this.rightWall;
  }

  /** Get the compression system reference. */
  getCompressionSystem(): CompressionSystem {
    return this.compressionSystem;
  }

  /** Get the input manager reference. */
  getInputManager(): InputManager {
    return this.inputManager;
  }

  /** Get the renderer reference. */
  getRenderer(): Renderer {
    return this.renderer;
  }

  /** Get the effect system reference. */
  getEffectSystem(): EffectSystem {
    return this.effectSystem;
  }

  // -------------------------------------------------------------------------
  // Game Loop
  // -------------------------------------------------------------------------

  /**
   * The main game loop, driven by requestAnimationFrame.
   * Each frame: process input, update state, render.
   * The loop keeps running in GAME_OVER so that the restart key (Enter)
   * can be detected. When restart is triggered, Game.start() resets
   * the state and schedules a fresh loop; if that happens during this
   * iteration, the generation has changed and this iteration must not
   * schedule a second frame (CR-IT2-003).
   */
  private gameLoop = (): void => {
    const generation = this.loopGeneration;
    this.update();
    this.render();
    if (this.loopGeneration === generation) {
      this.animFrameId = requestAnimationFrame(this.gameLoop);
    }
  };

  /**
   * Update game state based on current state.
   */
  private update(): void {
    // Prune expired visual effects in every state (DEC-028-2): the loop
    // keeps rendering in COMPRESSING and GAME_OVER, so pruning only in
    // updatePlaying() would leave the last flashes lit indefinitely in
    // those states.
    this.effectSystem.update();
    switch (this.state) {
      case 'PLAYING':
        this.updatePlaying();
        break;
      case 'COMPRESSING':
        this.updateCompressing();
        break;
      case 'GAME_OVER':
        // Process input for restart; no other updates in game over state.
        this.processInput();
        break;
    }
  }

  /**
   * Render the current game state.
   */
  private render(): void {
    this.renderer.render(
      this.field,
      this.activePiece,
      this.leftWall,
      this.rightWall,
      this.getScore(),
      this.state === 'GAME_OVER',
      this.effectSystem
    );
  }

  // -------------------------------------------------------------------------
  // State-specific updates
  // -------------------------------------------------------------------------

  /**
   * PLAYING state update:
   *  - Process player input
   *  - Advance the left wall
   *  - Check if compression should trigger
   */
  private updatePlaying(): void {
    this.processInput();

    // Advance the left wall (time-based). The elapsed game time drives the
    // dynamic tick interval: 400ms at game start, ramping to 200ms over
    // 10 seconds (TASK-027).
    //
    // When the wall pushes fixed blocks (chain push, TASK-026), register
    // the visual effects: a brighter flash on the wall-column blocks
    // ("pushed") and a yellow glow on the chain-connected blocks
    // (TASK-028). Both cell arrays are post-move positions.
    const wallResult = this.leftWall.tick(this.elapsedTime());
    if (wallResult) {
      if (wallResult.pushedCells.length > 0) {
        this.effectSystem.registerPushEffect(wallResult.pushedCells);
      }
      if (wallResult.connectedCells.length > 0) {
        this.effectSystem.registerConnectionEffect(
          wallResult.connectedCells
        );
      }
    }

    // Check if walls are close enough to trigger compression
    if (this.compressionSystem.shouldCompress(this.leftWall.getX())) {
      this.state = 'COMPRESSING';
    }
  }

  /**
   * COMPRESSING state update:
   *  - Fix the active piece to the field
   *  - Run compression
   *  - Transition to PLAYING or GAME_OVER
   */
  private updateCompressing(): void {
    // Fix the active piece to the field before compression
    if (this.activePiece) {
      this.activePiece.moveToFixed();
      this.activePiece = null;
    }

    // Run compression
    const compressResult = this.compressionSystem.compress(
      this.leftWall.getX()
    );

    if (compressResult) {
      // Compression succeeded: reset left wall and spawn new piece.
      // Left wall reset is handled by the compression system callback.
      if (!this.spawnPiece()) {
        this.state = 'GAME_OVER';
      } else {
        this.state = 'PLAYING';
      }
    } else {
      // Compression failed (field is full): game over
      this.state = 'GAME_OVER';
    }
  }

  // -------------------------------------------------------------------------
  // Input Processing
  // -------------------------------------------------------------------------

  /**
   * Process player input from the InputManager.
   * During PLAYING: handle rotation and wall shifting.
   * During GAME_OVER: handle restart via Enter key.
   * During COMPRESSING: no input processing needed.
   */
  private processInput(): void {
    const actions = this.inputManager.poll();

    if (this.state === 'PLAYING') {
      if (actions.has('ROTATE') && this.activePiece) {
        this.activePiece.rotate(this.leftWall.getX() + 1);
      }

      if (actions.has('WALL_UP')) {
        this.rightWall.shiftVertical(-1);   // up on screen
      }

      if (actions.has('WALL_DOWN')) {
        this.rightWall.shiftVertical(1);    // down on screen
      }
    } else if (this.state === 'GAME_OVER') {
      if (actions.has('RESTART')) {
        this.start();
      }
    }
  }

  // -------------------------------------------------------------------------
  // Piece Spawning
  // -------------------------------------------------------------------------

  /**
   * Spawn a new active piece.
   *
   * The piece spawns at max(2, rightWall.x - 9) to ensure playable space
   * (TASK-025: shifted 5 columns left so the player has more horizontal
   * room to position the piece before the left wall reaches it).
   * If the spawn position is invalid (no space between spawn and right wall),
   * the game transitions to GAME_OVER.
   *
   * @returns true if a piece was spawned, false if game over.
   */
  private spawnPiece(): boolean {
    const spawnX = Math.max(2, this.rightWall.getX() - 9);
    const spawnY = Math.floor(Field.ROWS / 2);

    // Check if there's space between spawn position and right wall
    if (spawnX >= this.rightWall.getX()) {
      this.state = 'GAME_OVER';
      return false;
    }

    // Random tetromino type (0-6)
    const type = Math.floor(Math.random() * 7);

    this.activePiece = new ActivePiece(
      this.field,
      type,
      spawnX,
      spawnY,
      0
    );

    // Validate that spawn position doesn't overlap with existing blocks.
    // If the spawn position is blocked, the field is too crowded for
    // continued play, so transition to GAME_OVER.
    if (this.activePiece.isColliding()) {
      this.activePiece = null;
      this.state = 'GAME_OVER';
      return false;
    }

    // Link active piece to left wall for contact detection
    this.leftWall.setActivePiece(this.activePiece);

    return true;
  }
}
