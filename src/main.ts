// ===========================================================================
// Test entry point (thin). All test sections live under src/tests/.
// TASK-042: split from the monolithic src/main.ts. Import order is significant:
// mocks.js first (its module-scope RAF overrides must execute before any test
// body), then component test files, then the harness summary at the end.
// ===========================================================================

import './tests/mocks.js';
import './tests/game.test.js';
import './tests/activePiece.test.js';
import './tests/compression.test.js';
import './tests/leftWall.test.js';
import './tests/rightWall.test.js';
import './tests/input.test.js';
import './tests/renderer.test.js';
import './tests/effects.test.js';
import { printSummary } from './tests/harness.js';

printSummary();
