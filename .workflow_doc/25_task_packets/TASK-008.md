# Task Packet

TASK-ID: TASK-008

Title: Fix Build Process

Priority: High

Dependencies: None

---

# Objective

Fix the build process so that:
1. `npm run build` produces a clean dist/ directory (no stale debug files)
2. `npm run dev` starts Vite dev server with the game (not the test suite)
3. `npm run preview` serves the built game correctly
4. HTML is automatically copied to dist/ after build

---

# Business Context

The current build process has three issues:
1. Manual HTML copy to dist/ is error-prone
2. Vite dev server configuration is unclear
3. Stale debug files from development accumulate in dist/

These issues degrade developer experience and will cause failures if the project moves to CI/CD.

---

# Scope

## In Scope

### Target

- `package.json` - Add clean, postbuild scripts
- `vite.config.ts` - Update entry point configuration
- `dist/` - Clean up stale debug files (debug_*.js, debug_*.d.ts, debug_*.js.map)

## Out of Scope

- Replacing tsc with Vite for all builds (keep tsc for test suite)
- Vite plugin configuration
- CSS bundling optimization
- Production optimization (minification, tree-shaking)

---

# Constraints

## D-008-1: Keep tsc for Test Suite

Priority: Required

Description: `npx tsc` must continue to work for the test suite (`src/main.ts`). The tsc build outputs to `dist/`.

Rationale: The test suite runs via `node dist/main.js`. Changing this would break the existing testing workflow.

---

## D-008-2: Vite Entry Point Must Be entry.ts

Priority: Required

Description: Vite dev server must load `src/entry.ts` (the game), not `src/main.ts` (the test suite).

Rationale: The current Vite config loads index.html which references entry.js. This should work, but the config should be explicit.

---

## D-008-3: Clean Before Build

Priority: Required

Description: `npm run clean` must remove the dist/ directory. `npm run build` must work without manual cleanup.

Rationale: Prevents stale files from accumulating and ensures reproducible builds.

---

# Implementation Notes

## Current State

### package.json scripts:
```json
{
  "build": "tsc",
  "dev": "vite dev",
  "preview": "vite preview",
  "start": "npx serve dist"
}
```

### vite.config.ts:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './index.html',
    },
  },
  server: {
    port: 3000,
  },
});
```

### index.html script reference:
```html
<script type="module" src="entry.js"></script>
```

## Required Changes

### package.json - Add scripts:
```json
{
  "clean": "rm -rf dist",
  "build": "tsc",
  "postbuild": "cp index.html dist/",
  "dev": "vite dev",
  "preview": "vite preview",
  "start": "npx serve dist"
}
```

### vite.config.ts - No changes needed:
The current config already uses `./index.html` as input, which references `entry.js`. Vite will resolve this to `src/entry.ts`. The config is correct.

### Manual cleanup:
Remove all `debug_*.js`, `debug_*.d.ts`, `debug_*.js.map` files from dist/.

## Build Commands After Fix

```bash
# Full clean build
npm run clean && npm run build
# or
rm -rf dist && npx tsc && cp index.html dist/

# Development
npm run dev          # Vite dev server with hot reload
npm run preview      # Preview production build

# Test
npx tsc && node dist/main.js    # Run test suite
```

## Verification

1. `npm run clean` removes dist/
2. `npm run build` runs tsc and copies index.html to dist/
3. `npm run dev` starts Vite dev server loading the game
4. `npm run preview` serves the built game
5. `npx tsc && node dist/main.js` runs all existing tests
6. dist/ contains no debug_*.js files

---

# Acceptance Criteria

- [ ] `npm run clean` removes the dist/ directory
- [ ] `npm run build` runs tsc and copies index.html to dist/
- [ ] `npm run dev` starts Vite dev server that loads the game (not tests)
- [ ] `npm run preview` serves the built game from dist/
- [ ] No debug_*.js files in dist/ after build
- [ ] `npx tsc && node dist/main.js` runs all 222 existing tests and they pass
- [ ] dist/index.html references entry.js correctly

---

# Deliverables

- Modified: `package.json` (clean and postbuild scripts)
- Modified: `dist/` (cleaned of debug files)
- Tests: All 222 existing tests pass

---

# References

- Code Review FINDING-007: Stale Debug Files in dist/
- Code Review FINDING-008: Manual HTML Copy to dist/
- Code Review FINDING-009: Vite Dev Server Points to Tests
- Implementation Report LIM-007-001: Manual HTML Copy to dist/
- Implementation Report LIM-007-002: No Vite Build Integration
- Bird's Eye Review Debt-BE-002: Build Process Debt

---

# Validation Checklist

- [x] TASK-ID exists
- [x] Objective is clear
- [x] Business Context is documented
- [x] Scope is defined
- [x] Constraints are documented
- [x] Acceptance Criteria are measurable
- [x] Deliverables are defined
- [x] Implementation notes provide sufficient detail
- [x] Task can be implemented without reading the full Plan
