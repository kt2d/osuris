# Task Packet

TASK-ID: TASK-041
Title: Add Automated Dist-Output Verification to the Build Pipeline
Priority: Medium
Dependencies: TASK-039

---

# Objective

Create `scripts/check-dist.mjs` — a standalone Node ESM script that verifies the dist output after a build — and wire it into the `postbuild` npm script so `npm run build` catches dist problems before CI deploy.

---

# Business Context

The `postbuild` script copies `index.html` into `dist/` and rewrites the script `src` attribute via `sed`. There is currently no automated check that the output is correct. A broken `sed` pattern, a missing `entry.js` emission from `tsc`, or a stale `index.html` would be caught only by manual inspection. The CI workflow (`.github/workflows/deploy.yml`) runs `npm run build` on push to `main` and deploys to GitHub Pages — a broken dist silently deploys a broken game.

This task addresses CR-IT3-002 (Low, from the Code Review backlog) and incorporates Challenge F-IT9-05 recommendations (check `dist/entry.js` exists; cwd-independent paths; note CI blast radius).

---

# Scope

## In Scope

### Target

- `scripts/check-dist.mjs` (new file) — the verification script.
- `package.json` — update the `postbuild` script to append the check.

## Out of Scope

- Changes to the test suite (`src/main.ts` / `src/tests/`).
- Changes to `vite.config.ts` or the Vite build flow.
- Changes to the CI workflow (`.github/workflows/deploy.yml`).
- Changes to the `tsc` build step.

---

# Constraints

## DEC-041-1: Standalone script, wired to postbuild (NOT in the test suite)

Priority: Required

Description:

The check lives in `scripts/check-dist.mjs` and is invoked from `package.json` `postbuild`. It is NOT part of the `src/main.ts` test suite.

Rationale: The standard verification flow is `npx tsc && node dist/main.js` — this does NOT run `postbuild`. If the dist check were inside the test suite, that documented flow would break (the suite would look for `dist/index.html` which doesn't exist when only `tsc` has run). Wiring to `postbuild` means `npm run build` (used by CI) runs the check, while the test flow remains unaffected.

## DEC-041-2: Cwd-independent path resolution

Priority: Required

Description:

All file paths in the script are resolved relative to the script's own location using `new URL(...)`:

```ts
const distDir = new URL('../dist/', import.meta.url);
```

Rationale: F-IT9-05 — if the script is invoked from a different working directory (e.g., `node scripts/check-dist.mjs` from a subdirectory, or via a future CI step), cwd-relative paths would break. `import.meta.url` is always correct regardless of cwd.

## DEC-041-3: Check both `dist/index.html` content AND `dist/entry.js` existence

Priority: Required

Description:

The script must verify:
1. `dist/index.html` exists.
2. `dist/index.html` contains the string `src="entry.js"` (the sed-rewritten form; the original is `src="./src/entry.js"`).
3. `dist/entry.js` exists.

Rationale: F-IT9-05 — the sed rewrite is only half the contract. The other half is that `tsc` actually emitted `dist/entry.js` from `src/entry.ts`. If `tsc` fails to emit `entry.js` (e.g., a `tsconfig.json` change), the sed rewrite succeeds but the game is broken.

## DEC-041-4: Fail with a clear message

Priority: Required

Description:

On any check failure, the script must:
- Print a clear, actionable error message to `stderr` identifying which check failed and why.
- Exit with a non-zero status code (so `npm run build` fails).

Rationale: A silent failure or a cryptic error would waste debugging time. The message should tell the developer exactly what to check.

---

# Implementation Notes

- **Script location**: `scripts/check-dist.mjs` (plain Node ESM, no TypeScript, no dependencies).
- **Script content** (reference implementation):

```js
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
```

- **`package.json` update**: change the `postbuild` script from:
  ```json
  "postbuild": "cp index.html dist/ && sed -i 's|src=\"./src/entry.js\"|src=\"entry.js\"|' dist/index.html"
  ```
  to:
  ```json
  "postbuild": "cp index.html dist/ && sed -i 's|src=\"./src/entry.js\"|src=\"entry.js\"|' dist/index.html && node scripts/check-dist.mjs"
  ```

- **CI blast radius**: A broken `check-dist.mjs` fails `npm run build`, which blocks the GitHub Pages deploy in CI (`.github/workflows/deploy.yml` runs `npm run build` on push to `main`). The script is simple (3 checks) and should not be fragile. If the script itself has a syntax error, `npm run build` fails with a Node error — this is the desired behavior (fail fast).

- **What the script does NOT check**:
  - `dist/main.js` (the test runner output) — that's a dev artifact, not a deploy artifact.
  - `dist/Game.js`, `dist/Field.js`, etc. — if `tsc` emitted `entry.js`, it emitted all the other modules too (they're in the same compilation).
  - CSS files — `styles.css` is not copied by the current build (it's in `src/` and referenced from `index.html`... actually, let me check). The current `postbuild` only copies `index.html`. CSS handling is a separate concern.

- **Verification before marking DONE**:
  1. `npm run build` succeeds (including the check).
  2. `npx tsc && node dist/main.js` still works (the standard test flow is unaffected).
  3. Manually delete `dist/entry.js` and run `npm run build` — it should succeed (tsc re-emits it) and the check should pass.
  4. Manually corrupt `dist/index.html` (remove the `src="entry.js"` string) after the build and run `node scripts/check-dist.mjs` directly — it should fail with a clear message.

---

# Acceptance Criteria

- [ ] `scripts/check-dist.mjs` exists and is a valid Node ESM script (no TypeScript, no external dependencies).
- [ ] The script resolves all paths from its own location (uses `import.meta.url` or `fileURLToPath`), NOT from `process.cwd()`.
- [ ] The script checks: (1) `dist/index.html` exists, (2) `dist/index.html` contains `src="entry.js"`, (3) `dist/entry.js` exists.
- [ ] On failure, the script prints a clear message to `stderr` and exits with a non-zero status.
- [ ] `package.json` `postbuild` includes `&& node scripts/check-dist.mjs` at the end.
- [ ] `npm run build` succeeds (the full build + check pipeline works).
- [ ] `npx tsc && node dist/main.js` still reports `Failed: 0` (the standard test flow is unaffected).
- [ ] `npx tsc --noEmit` exits with status 0.

---

# Deliverables

- New file: `scripts/check-dist.mjs`.
- Updated: `package.json` (`postbuild` script).
- Verification output from `npm run build` and `npx tsc && node dist/main.js`.

---

# References

- `.workflow_doc/20_challenge.md` — F-IT9-05 (dist check hardening).
- `.workflow_doc/90_next_actions.md` — CR-IT3-002 backlog item.
- `package.json` — current `build` and `postbuild` scripts.
- `vite.config.ts` — Vite build flow (unaffected by this task).
- `.github/workflows/deploy.yml` — CI runs `npm run build` (blast radius).

---

# Validation Checklist

- [x] TASK-ID exists
- [x] Objective is clear
- [x] Business Context is documented
- [x] Scope is defined
- [x] Constraints are documented
- [x] Acceptance Criteria are measurable
- [x] Deliverables are defined
- [x] All information needed for implementation is present
- [x] Implementable without reading the full Plan
