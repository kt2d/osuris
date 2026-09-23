# Task Packet: TASK-022

Title: Fix `advanceOccupiedBlocksInColumn()` Collision Validation

Created By: Plan Agent

Date: 2026-08-20

Priority: High

---

# Objective

左壁が固定ブロックを押し込む際に、ターゲット列が占有されているか検証する。ターゲットが占有されている場合、ブロックを移動しない。

---

# Business Context

プレイヤーがテトリミノを操作していると、左壁がそれを押し込んでフィールドに配置する。壁が押し込んだ後、壁は右方向へ引き続き前進し、フィールド上の固定ブロックも押し続ける。

しかし現在の実装では、壁が固定ブロックを押し込む際、**ターゲット列が既に占有されているか検証していない**。これにより、2つのブロックが隣接列にある場合、後ろのブロックが前のブロックを「上書き」して消滅してしまう。

ブロック消失によりフィールド状態が壊れ、次の新ピースのスパン位置が占有されて**即時ゲームオーバー**になる不具合が発生していた。

---

# Scope

## 変更対象ファイル

- `src/LeftWall.ts` — `advanceOccupiedBlocksInColumn()` メソッドのみ

## 変更内容

`advanceOccupiedBlocksInColumn()` の先頭に、全ターゲット位置が空か検証するガードを追加する。

## 変更しないもの

- `CompressionSystem` — 圧縮アルゴリズムは変更しない
- `Game` — ゲーム状態マシンは変更しない
- 他のコンポーネント — 影響なし

---

# Constraints

- 既存のテストがすべてパスすること
- TypeScript コンパイルエラーが発生しないこと
- 既存のアーキテクチャを変更しない
- 仕様（圧縮アルゴリズム仕様）に準拠する

---

# Acceptance Criteria

1. `advanceOccupiedBlocksInColumn()` を呼び出した際、ターゲット列が占有されていればブロックを移動しない
2. ターゲット列が空であれば、ブロックを正常に右へ移動する
3. 既存の全テストがパスする
4. TypeScript コンパイルエラーがない (`npx tsc`)
5. 新ピースが1個配置された後、圧縮を経て次のピースが正常に生成される
6. 隣接列にブロックがある状態で壁が前進しても、ブロックが消失しない

---

# Implementation Details

## 現在の実装（問題あり）

```typescript
// src/LeftWall.ts:177-199
private advanceOccupiedBlocksInColumn(col: number): void {
  const occupied = this.field.getOccupiedCells();
  const toMove: Array<{ x: number; y: number }> = [];

  for (const cell of occupied) {
    if (cell.x === col) {
      toMove.push({ ...cell });
    }
  }

  // 古い位置をクリア
  for (const cell of toMove) {
    this.field.set(cell.x, cell.y, false);
  }

  // 新しい位置を設定 ← ターゲットの占有チェックがない！
  for (const cell of toMove) {
    const newX = cell.x + 1;
    if (this.field.isValidPosition(newX, cell.y)) {
      this.field.set(newX, cell.y, true); // ← ここが問題
    }
  }
}
```

問題: ターゲット位置 (`newX, cell.y`) が既に占有されているかチェックしていない。boolean grid なので、`field.set(newX, cell.y, true)` を実行すると、既存のブロックが「上書き」されて消失する。

## 修正後

```typescript
private advanceOccupiedBlocksInColumn(col: number): void {
  const occupied = this.field.getOccupiedCells();
  const toMove: Array<{ x: number; y: number }> = [];

  for (const cell of occupied) {
    if (cell.x === col) {
      toMove.push({ ...cell });
    }
  }

  if (toMove.length === 0) return;

  // ★ 全ターゲットが空か検証（追加）
  for (const cell of toMove) {
    const newX = cell.x + 1;
    if (!this.field.isValidPosition(newX, cell.y) || this.field.get(newX, cell.y)) {
      return; // 移動不可 → 何もしない
    }
  }

  // 検証通過後のみ移動
  for (const cell of toMove) {
    this.field.set(cell.x, cell.y, false);
  }
  for (const cell of toMove) {
    const newX = cell.x + 1;
    this.field.set(newX, cell.y, true);
  }
}
```

追加した検証:
1. 移動対象が空の場合は即座に return
2. 各ブロックのターゲット位置 (`x+1, y`) が範囲外か占有されていれば、移動を中止して return
3. 全ターゲットが空の場合のみ、実際に移動を実行

## 仕様の根拠

圧縮アルゴリズム仕様「移動判定」:
> 移動対象内のすべてのブロックについて、
> * 右隣セルが空である
> * または移動対象自身である
> 
> 場合のみ移動可能とする。
> 1つでも移動できないブロックが存在する場合、その移動は失敗とする。

このロジックは CompressionSystem では正しく実装されているが、`advanceOccupiedBlocksInColumn()` では欠落していた。

---

# Test Strategy

## 既存テスト

既存の全テストがパスすることを確認する。修正は 1 メソッドのみに限定し、他のコンポーネントへの影響はないため、既存テストの修正は不要と見込む。

## 追加テスト（推奨）

以下のシナリオをテストすることをお勧めする:

1. **隣接列にブロックがある場合**: 壁が固定ブロックを押し込む際、ターゲット列に既存ブロックがある場合、ブロックが移動しない
2. **ブロック消失の不发生**: 複数の固定ブロックが隣接列にある状態で壁が前進しても、ブロック数が減少しない

---

# Risk

## Risk-008: 壁の前進停止による圧縮遅延

Description: 固定ブロックが押し込めない場合、壁がそこで停止する。圧縮がトリガーされるまで時間がかかる。

Mitigation: この動作は仕様通り。壁は「押し込める間だけ」押し続ける。押し込めなくなった場合は、プレイヤーが Right Wall を上下にシフトして隙間を作り、壁が通り抜けられるようにする。これはゲームの戦略要素として機能する。

---

# Deliverables

- `src/LeftWall.ts` の修正
- 全テストのパス確認
- `npx tsc` 0 errors 確認
