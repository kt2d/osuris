# Task Packet

TASK-ID: TASK-024

Title: Test 15 の更新（垂直配置 → 仕様準拠）

Priority: High

Dependencies: TASK-023

---

# Objective

TASK-023 で `alignBlocksVertical()` を削除したため、Test 15 を新しい動作（動けないブロックは元の位置に残る）に更新する。

---

# Business Context

Test 15 は「圧縮後に壁のブロックが右壁の y位置に整列する」ことをテストしている。これは `alignBlocksVertical()` が存在していた当時の動作をテストしていた。

TASK-023 で `alignBlocksVertical()` が削除されたため、このテストは新しい動作に合わせる必要がある。新しい動作では：

- BFS圧縮で右へ移動できるブロックは移動する
- 右へ動けないブロックは元の位置に残る（垂直配置は行わない）
- ブロック数は保存される（BFS圧縮自体がブロック数を保存する）

---

# Scope

## In Scope

### Target

- `src/main.ts`（Test 15）

### 変更対象

- Test 15 セクションの更新
  - 既存のテストは `alignBlocksVertical()` の動作を検証している
  - 新しいテストは BFS圧縮後のブロック位置を検証する
  - ブロック数保存の検証は維持する

## Out of Scope

- 新規テストの追加（既存テストの更新のみ）
- 他テストの変更

---

# Constraints

## Decision-023-1

Priority: Required

Required

Description: テストは「仕様書準拠の動作」を検証する。垂直配置のテストは削除する。

## Decision-023-2

Priority: Required

Required

Description: 全テスト（276テスト）がパスする状態を維持する。

---

# Implementation Notes

## Test 15 の変更前

```typescript
section('Test 15: CompressionSystem compressed blocks inherit right wall y-offset');

const fieldCI = new Field();
fieldCI.set(15, 3, true);  // Block at (15,3)
fieldCI.set(15, 5, true);  // Block at (15,5)

const rwCI = new RightWall(fieldCI, 15, 2);  // wallY=2
const csCI = new CompressionSystem(fieldCI, rwCI, () => {}, 1);
csCI.compress(14);

// 垂直配置後の位置を検証
assert(fieldCI.get(15, 2) === true, 'Block 1 aligned to right wall y=2');
assert(fieldCI.get(15, 3) === true, 'Block 2 distributed to adjacent row y=3');
assert(fieldCI.countBlocks() === 2, 'Block count preserved after alignment');
```

## Test 15 の変更後（提案）

```typescript
section('Test 15: CompressionSystem finalizes configuration when blocks cannot move right');

const fieldCI = new Field();
// Place blocks at (14,3) and (14,5) — one column left of right wall
fieldCI.set(14, 3, true);
fieldCI.set(14, 5, true);

const rwCI = new RightWall(fieldCI, 15, 2);
const csCI = new CompressionSystem(fieldCI, rwCI, () => {}, 1);

// Compression: blocks at (14,3) and (14,5) can move right to (15,3) and (15,5)
const result = csCI.compress(14);
assert(result === true, 'compress returns true (cycle completed)');

// Blocks moved right by BFS compression
assert(fieldCI.get(15, 3) === true, 'Block moved to (15,3)');
assert(fieldCI.get(15, 5) === true, 'Block moved to (15,5)');
assert(fieldCI.get(14, 3) === false, 'Old position (14,3) cleared');
assert(fieldCI.get(14, 5) === false, 'Old position (14,5) cleared');

// Block count preserved (BFS compression preserves count)
assert(fieldCI.countBlocks() === 2, 'Block count preserved after compression');
```

## 変更の理由

1. 元のテストは右壁列 (15) にブロックを配置し、垂直配置後の位置を検証していた
2. 新しいテストは右壁の左隣 (14) にブロックを配置し、BFS圧縮で右へ移動することを検証する
3. 垂直配置は削除されたので、垂直配置のテストは意味をなさない
4. BFS圧縮自体はブロック数を保存するので、`countBlocks() === 2` の検証は維持する

## 注意点

- `compress()` の戻り値は `true`（サイクル完了）。フィールドが満タンではないため
- ブロックは (14,3)→(15,3)、(14,5)→(15,5) に移動する（BFS圧縮で右へ1マス）
- 右壁の y-offset は BFS圧縮には影響しない（BFSは水平方向のみ）

---

# Acceptance Criteria

- [ ] Test 15 が垂直配置のテストからBFS圧縮のテストに更新されている
- [ ] Test 15 のアサーションは仕様準拠の動作を検証している
- [ ] ブロック数保存の検証が維持されている
- [ ] 全テストがパスする（Failed: 0）
- [ ] `npx tsc` がエラーゼロ

---

# Deliverables

- Source Code: なし
- Tests: `src/main.ts` の Test 15 更新

---

# References

- 仕様書: `compress-mechanism.md`（圧縮処理アルゴリズム仕様）
- Plan: `.workflow_doc/10_plan.md`
- Task Packet: `.workflow_doc/25_task_packets/TASK-023.md`

---

# Validation Checklist

- [x] TASK-ID が存在する
- [x] Objective が明確である
- [x] Business Context が記載されている
- [x] Scope が定義されている
- [x] Constraints が記載されている
- [x] Acceptance Criteria が測定可能である
- [x] Deliverables が定義されている
- [x] 実装に必要な情報が揃っている
- [x] Plan を読まなくても通常は実装できる
