# Task Packet

TASK-ID: TASK-021

Title: Update README and Clarify Game Rules

Priority: Medium

Dependencies: TASK-018, TASK-019, TASK-020

---

# Objective

README.md を更新し、ゲームルール、操作方法、開発コマンドを正確に記載する。

---

# Business Context

現在の README.md には以下の問題がある：

1. テスト数が「156」と記載されているが、実際は267
2. ゲームルールの説明が不十分
3. 操作方法の詳細が不足
4. ゲームオーバーの条件が明確でない
5. 左壁の-push-動作の説明がない

ユーザーは「ブロックが壁に押し込まれるとゲームオーバーになっている」と報告しているが、これはゲームの仕様通り。左壁がアクティブピースを押し込んで固定することは、ピースをフィールドに配置するプロセスの一部。実際のゲームオーバーは、新しいピースを生成できない時のみ発生する。この点を README で明確に説明する必要がある。

---

# Scope

## In Scope

### Target

- `README.md` - 全面的な更新

## Out of Scope

- game-design.md の変更（日本語の仕様書はそのまま維持）
- compress-mechanism.md の変更
- ソースコードの変更

---

# Constraints

## D-021: Wall Push Behavior is Intentional

Priority: Required

Description: 左壁がアクティブピースを押し込んでピースが固定される動作は仕様通り。README でこの動作を明確に説明する。

Rationale: ゲームデザイン仕様 (game-design.md) によると、「左側から自動で移動してくる壁がテトリミノを押し込み、フィールドへ配置していく」ことがゲームの核心メカニクス。壁がピースを押し込んで固定することは、ピースをフィールドに配置するプロセスの一部。実際のゲームオーバーは、新しいピースを生成できない時のみ発生する。

---

# Implementation Notes

## Current Issues in README

1. テスト数: 「All 156 tests must pass」→ 「All 267 tests must pass」
2. ゲームルール: 左壁の-push-動作の説明が必要
3. 操作方法: Enter キーでの再起動の説明が必要
4. ゲームオーバー条件: 明確な説明が必要

## Game Rules to Document

### 基本的なルール

1. フィールド: 16列 × 8行のグリッド。縦方向はループ（上端と下端が接続）。
2. アクティブピース: 7種類のテトリミノがランダムに生成。Space キーで90°時計回りに回転。
3. 左壁: 左端から右方向へ一定速度で移動。アクティブピースや固定ブロックを右に押し込む。
4. 右壁: プレイヤーが矢印キー（↑/↓）で上下に移動。右壁に接しているブロックは一緒に移動。
5. 圧縮: 左壁が右壁に到達すると、ブロックが右壁に向かって圧縮される。左壁がリセットされ、新しいピースが生成される。

### ピースの固定

左壁がアクティブピースを押し込むと、ピースは右方向に移動する。ピースが右壁または固定ブロックに接触すると、押し込めなくなり、フィールドに固定される。これはゲームオーバーではなく、ピースがフィールドに配置されたことを意味する。

### ゲームオーバー

新しいアクティブピースを生成できない場合、ゲームオーバーとなる。具体的には：
- ピースの生成位置が右壁と重なっている
- ピースの生成位置が既存のブロックと重なっている

### スコア

フィールドのブロック密度（%）がスコアとなる。ライン消去は存在しない。

### 操作方法

| キー | 操作 |
|------|------|
| Space | アクティブピースを90°時計回りに回転 |
| ↑ | 右壁を上に移動 |
| ↓ | 右壁を下に移動 |
| Enter | ゲームオーバー後にゲームを再開 |

## README Structure

```markdown
# OSURIS

Horizontal Compression Puzzle Game

## Game Rules

[基本的なルール]

## How to Play

[操作方法]

## Game Over

[ゲームオーバー条件]

## Scoring

[スコア計算]

## Getting Started

[開発コマンド]

## Architecture

[アーキテクチャ]

## Project Structure

[ディレクトリ構造]
```

---

# Acceptance Criteria

- [ ] README.md のテスト数が「267」に更新されている
- [ ] ゲームルールの説明が追加されている
- [ ] 操作方法の表が追加されている（Space, ↑, ↓, Enter）
- [ ] 左壁の-push-動作の説明が含まれている
- [ ] ピースが固定される動作が「ゲームオーバーではない」ことが明確に記載されている
- [ ] ゲームオーバーの条件が明確に記載されている
- [ ] スコア計算方法が記載されている
- [ ] 開発コマンド（npm run dev, npm run build, etc.）が正確に記載されている
- [ ] `npx tsc` でコンパイルエラーが発生しない
- [ ] 既存の267テストがすべてパスする

---

# Deliverables

- Modified: `README.md` (全面的な更新)

---

# References

- game-design.md - ゲームデザイン仕様（日本語）
- compress-mechanism.md - 圧縮メカニズム仕様
- src/Game.ts - ゲーム状態マシン
- src/LeftWall.ts - 左壁の-push-動作

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
