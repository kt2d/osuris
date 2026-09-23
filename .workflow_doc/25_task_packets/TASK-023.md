# Task Packet

TASK-ID: TASK-023

Title: CompressionSystem から alignBlocksVertical() フォールバックを削除

Priority: High

Dependencies: なし

---

# Objective

`CompressionSystem.compress()` から `alignBlocksVertical()` の呼び出しを削除し、`alignBlocksVertical()` メソッドおよび `hasBlocksAtWallX()` メソッドをクラスから削除する。

---

# Business Context

仕様書(compress-mechanism.md)は圧縮アルゴリズムを明確に定義している：

1. 移動対象を構築する
2. 移動判定を行う
3. 移動可能なら1マス移動する
4. 移動できなくなるまで繰り返す
5. 移動対象内に1つでも移動できないブロックが存在した時点で圧縮を終了する。その時点の配置を確定する

現在の実装は、ステップ5で「壁にブロックがあり右へ動けない」場合に `alignBlocksVertical()` を呼び出して垂直方向の配置を試みる。これは仕様書に存在しない。本タスクは仕様書への完全準拠を目指す。

Challenge Agent (Concern-001) がこの問題を特定し、修正を Accepted としている。

---

# Scope

## In Scope

### Target

- `src/CompressionSystem.ts`

### 変更対象

1. `compress()` メソッドの `hasBlocksAtWallX()` / `alignBlocksVertical()` 分岐の削除（Lines 93-96）
2. `alignBlocksVertical()` メソッドの削除（Lines 120-162）
3. `hasBlocksAtWallX()` メソッドの削除（Lines 105-111）

## Out of Scope

- `CompressionSystem.ts` の他のメソッド（`pushBlocksRight()`, `buildMovementSet()`, `canMoveRight()`, `moveRight()`）は変更しない
- `LeftWall.ts` は変更しない
- テストコードの変更は TASK-024 で行う

---

# Constraints

## Decision-023-1

Priority: Required

Required

Description: `compress()` の戻り値 semantics は不変。`true` = サイクル完了（左壁リセット済み）、`false` = ゲームオーバー（フィールド満タン）。

## Decision-023-2

Priority: Required

Required

Description: BFS圧縮ロジック（`pushBlocksRight()`, `buildMovementSet()`, `canMoveRight()`, `moveRight()`）は変更しない。これらは仕様書に準拠しており、正常に動作している。

---

# Implementation Notes

## compress() の変更前

```typescript
compress(leftWallX: number): boolean {
    if (!this.shouldCompress(leftWallX)) return false;

    const preState = this.field.getGrid();
    this.pushBlocksRight();

    if (this.hasAnyMovement(preState)) {
        this.resetLeftWall();
        return true;
    }

    // 移動なし、フィールド満タン
    if (this.field.countBlocks() === Field.COLS * Field.ROWS) {
        this.restoreGrid(preState);
        return false;
    }

    // 移動なし、壁にブロックあり → alignBlocksVertical() ← 削除対象
    if (this.hasBlocksAtWallX()) {
        this.alignBlocksVertical();
        return true;
    }

    // 移動なし、壁にブロックなし
    this.resetLeftWall();
    return true;
}
```

## compress() の変更後

```typescript
compress(leftWallX: number): boolean {
    if (!this.shouldCompress(leftWallX)) return false;

    const preState = this.field.getGrid();
    this.pushBlocksRight();

    if (this.hasAnyMovement(preState)) {
        this.resetLeftWall();
        return true;
    }

    // 移動なし、フィールド満タン → ゲームオーバー
    if (this.field.countBlocks() === Field.COLS * Field.ROWS) {
        this.restoreGrid(preState);
        return false;
    }

    // 移動なし、フィールド未満タン → サイクル完了
    this.resetLeftWall();
    return true;
}
```

## 削除するメソッド

1. `private hasBlocksAtWallX(): boolean` (105-111行目)
2. `private alignBlocksVertical(): void` (120-162行目)

## 影響を受ける呼び出し

- `compress()` 内の `hasBlocksAtWallX()` 呼び出し: 削除
- `compress()` 内の `alignBlocksVertical()` 呼び出し: 削除
- `hasBlocksAtWallX()` の呼び出し元: `compress()` のみ
- `alignBlocksVertical()` の呼び出し元: `compress()` のみ

両メソッドは private であり、外部に依存関係はない。

## ゲームフローの変化

**変更前:**
```
壁にブロックあり + 右へ動けない → 垂直配置を試みる → 左壁リセット → 次のピース生成
```

**変更後:**
```
壁にブロックあり + 右へ動けない → 配置そのまま → 左壁リセット → 次のピース生成
```

動けないブロックは元の位置に残る。これは仕様書の「その時点の配置を確定する」に準拠する。

---

# Acceptance Criteria

- [ ] `alignBlocksVertical()` メソッドが CompressionSystem から削除されている
- [ ] `hasBlocksAtWallX()` メソッドが CompressionSystem から削除されている
- [ ] `compress()` から `alignBlocksVertical()` 呼び出しが削除されている
- [ ] `compress()` から `hasBlocksAtWallX()` 呼び出しが削除されている
- [ ] `npx tsc` がエラーゼロ
- [ ] 全テストがパスする（Failed: 0）
- [ ] `compress()` の戻り値 semantics が不変（true = サイクル完了、false = ゲームオーバー）

---

# Deliverables

- Source Code: `src/CompressionSystem.ts` の更新
- Tests: なし（本タスクではテスト変更なし。TASK-024で対応）

---

# References

- 仕様書: `compress-mechanism.md`（圧縮処理アルゴリズム仕様）
- 仕様書: `game-design.md`（ゲーム設計仕様）
- Challenge Report: `.workflow_doc/20_challenge.md`（Concern-001）
- Plan: `.workflow_doc/10_plan.md`（Decision-023-1）

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
