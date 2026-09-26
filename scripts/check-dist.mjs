#!/usr/bin/env node
/**
 * Verifies the dist/ output after a build.
 * Run automatically via `npm run build` (postbuild).
 *
 * Checks:
 *   1. dist/index.html exists
 *   2. dist/index.html contains src="entry.js" (sed-rewritten form)
 *   3. dist/entry.js exists
 *
 * Exits non-zero with a clear message on any failure.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Resolve paths from the script's own location, not process.cwd(), so the
// check works regardless of the directory `npm run build` is invoked from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

let failed = false;

function check(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ ${message}`);
    failed = true;
  }
}

const indexPath = path.join(distDir, 'index.html');
const entryPath = path.join(distDir, 'entry.js');

console.log('check-dist: verifying dist output');

// 1. index.html exists
check(existsSync(indexPath), `dist/index.html exists`);

// 2. index.html contains the sed-rewritten script tag
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, 'utf-8');
  check(html.includes('src="entry.js"'), 'dist/index.html contains src="entry.js" (sed rewrite applied)');
}

// 3. entry.js exists
check(existsSync(entryPath), 'dist/entry.js exists (tsc emitted the browser entry point)');

if (failed) {
  console.error('\ncheck-dist: FAILED — fix the build before deploying.');
  process.exit(1);
} else {
  console.log('check-dist: all checks passed.');
}
