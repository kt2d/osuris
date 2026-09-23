# Task Packet

TASK-ID: TASK-039
Title: Establish the Git Baseline Commit
Priority: High
Dependencies: none

---

# Objective

Clear the polluted git index, extend `.gitignore`, and create the initial baseline commit so that all subsequent work in this project has a VCS baseline for `git diff` attribution.

---

# Business Context

The repository has zero commits. The git index already contains 1,655 staged files, including ~1,560 under `node_modules/` and `dist/` (Challenge F-IT9-01, High severity). Without a clean baseline, scope attribution in implement/review reports is done by file reading, not `git diff`; no change history, bisect, or rollback is possible (Risk-005). This is the first step of Iteration 9 and must complete before any other task.

---

# Scope

## In Scope

### Target

- `.gitignore` — extend with `node_modules/` and `dist/`.
- Git index — clear and re-stage.
- Initial commit — one commit with the clean file set.

## Out of Scope

- No source code changes.
- No test changes.
- No build configuration changes.

---

# Constraints

## DEC-039-1: Clear the index before committing

Priority: Required

Description: The index already contains 1,560 files under `node_modules/`/`dist/` (Challenge F-IT9-01). `.gitignore` only affects untracked files; it does NOT unstage files already in the index. The index must be cleared before the initial commit.

Rationale: With zero commits, `git reset` (without a commit argument) safely empties the index with nothing to lose. This is simpler and safer than `git rm -r --cached node_modules dist` (which would require two separate commands and leave the rest of the index intact).

## DEC-039-2: `opencode.json` stays in `.gitignore`

Priority: Required

Description: `opencode.json` is already in `.gitignore` (it contains internal LLM provider URLs). Do not remove it from `.gitignore` or force-commit it.

Rationale: Internal infrastructure detail; not shareable.

## DEC-039-3: `package-lock.json` must be committed

Priority: Required

Description: The CI workflow (`.github/workflows/deploy.yml`) runs `npm ci`, which requires `package-lock.json`. It must be in the baseline commit.

Rationale: `npm ci` fails without the lock file.

---

# Implementation Notes

- **Command sequence** (execute in this exact order from the repo root):
  1. Edit `.gitignore`: append `node_modules/` and `dist/` (one per line).
  2. `git reset` — empties the index (safe: zero commits exist; nothing is lost).
  3. `git add .` — stages all files respecting the updated `.gitignore`.
  4. **Verify BEFORE committing**:
     - `git ls-files | grep -c '^node_modules/\|^dist/'` must output `0`.
     - `git ls-files | wc -l` should be a small number (≈ 30-50), NOT 1655.
     - `git status` should show only project files as "new file" (no `node_modules/`, no `dist/`).
  5. `git commit -m "Initial baseline: OSURIS v0.1.0 (Iteration 8 complete)"`
  6. **Verify AFTER committing**:
     - `git log --oneline` shows exactly 1 commit.
     - `git status` is clean (nothing to commit).
     - `git ls-files | grep -c '^node_modules/\|^dist/'` still outputs `0`.

- **Files that SHOULD be in the commit** (verify presence):
  - `package-lock.json` (CI dependency)
  - `.github/workflows/deploy.yml`
  - `.devcontainer/` (if present)
  - `src/` (all source files)
  - `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`
  - `game-design.md`, `compress-mechanism.md`, `README.md`
  - `AGENTS.md`, `.agents/`
  - `.workflow_doc/` (all workflow artifacts)
  - `Dockerfile`, `docker-compose.yml` (if present)

- **Files that MUST NOT be in the commit**:
  - `node_modules/` (any file)
  - `dist/` (any file)
  - `opencode.json` (internal provider URLs)
  - `.DS_Store`

- **Risk**: If `git reset` does not fully clear the index (e.g., due to a git version quirk), fall back to `git rm -r --cached .` followed by `git add .`. Verify with `git ls-files | wc -l` after each step.

- **Risk**: The `.gitignore` must be edited BEFORE `git add .`, otherwise the add will pick up `node_modules/` and `dist/` again.

---

# Acceptance Criteria

- [ ] `.gitignore` contains `node_modules/` and `dist/` (in addition to the existing entries).
- [ ] `git log --oneline` shows exactly 1 commit.
- [ ] `git ls-files | grep -c '^node_modules/\|^dist/'` outputs `0`.
- [ ] `git ls-files | wc -l` is less than 100 (not 1655).
- [ ] `git ls-files` includes `package-lock.json`.
- [ ] `git ls-files` does NOT include `opencode.json`.
- [ ] `git status` is clean after the commit (no untracked, no modified).
- [ ] `npx tsc` still reports 0 errors (sanity check: the commit did not modify source).

---

# Deliverables

- Extended `.gitignore`.
- One git commit on `main` containing the clean project file set.
- Verification output (the `git ls-files` and `git status` commands from the Implementation Notes).

---

# References

- `.workflow_doc/20_challenge.md` — F-IT9-01 (High), A-IT9-01, A-IT9-02.
- `.workflow_doc/50_birds_eye_review.md` — Risk-005, Recommendation-BE-009.
- `.github/workflows/deploy.yml` — CI runs `npm ci` (requires `package-lock.json`).

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
