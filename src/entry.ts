import { Game } from './Game.js';

/**
 * Browser entry point for OSURIS.
 *
 * Initializes the game and starts the game loop when loaded in a browser.
 * This file is separate from main.ts (which contains the test suite)
 * to keep concerns clean: tests run in Node.js, game runs in the browser.
 */

// Get the canvas element from the DOM
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

if (!canvas) {
  console.error('OSURIS: Canvas element #game-canvas not found in the DOM.');
} else {
  // Create and start the game
  const game = new Game(canvas);
  game.start();

  // Focus the canvas so keyboard input (Space, ArrowUp, ArrowDown, Enter)
  // reaches the InputManager's keydown listener right after page load.
  // The canvas has tabindex="0" in index.html, which makes it focusable.
  // Clicking the canvas at any time also re-focuses it.
  canvas.focus();
}
