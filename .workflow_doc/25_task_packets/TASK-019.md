# Task Packet

TASK-ID: TASK-019

Title: Fix Block Rotation (Canvas Keyboard Focus)

Priority: High

Dependencies: None

---

# Objective

canvas 要素をフォーカス可能にし、ゲーム中いつでもキーボード入力（Space キーでの回転、矢印キーでの壁移動）が機能するようにする。

---

# Business Context

現在の InputManager は canvas 要素に keydown イベントリスナーをアタッチしている。しかし、canvas 要素に `tabindex` 属性がないため、キーボードフォーカスを接收できない。ゲーム開始時に canvas がフォーカスを取得しても、ユーザーが画面外をクリックするとフォーカスを失い、その後はキーボード入力が機能しなくなる。これはゲームの核心的な操作（ピース回転）を破壊するクリティカルな問題。

---

# Scope

## In Scope

### Target

- `index.html` - canvas 要素に `tabindex="0"` を追加
- `src/styles.css` - canvas:focus 時の視覚的フィードバック
- `src/entry.ts` - ゲーム開始時に canvas.focus() を呼び出す

## Out of Scope

- InputManager.ts の変更（keydown リスナーの配置場所を変更しない）
- document レベルでのイベントリスナーへの移行

---

# Constraints

## D-019: Canvas Focus for Keyboard Input

Priority: Required

Description: canvas 要素に `tabindex="0"` を追加し、CSS で `outline` を制御する。entry.ts でゲーム開始時に canvas.focus() を呼び出す。

Rationale: InputManager は canvas 要素に keydown リスナーをアタッチしている。canvas がフォーカス可能でないと、キーボード入力が受信できない。`tabindex="0"` は canvas をフォーカス可能にする標準的な方法。document レベルでリスナーをアタッチする代わりに、canvas レベルで維持することで、他のページ要素とのキーボード入力の競合を避ける。

---

# Implementation Notes

## Current State

index.html (line 61):
```html
<canvas id="game-canvas"></canvas>
```

canvas に `tabindex` 属性がないため、フォーカス不可能。

## Fix 1: Add tabindex to canvas

```html
<canvas id="game-canvas" tabindex="0"></canvas>
```

## Fix 2: Add CSS for focus styling

src/styles.css に追加:
```css
#game-canvas:focus {
  outline: none;
  border-color: #6bff6b;
}
```

`outline: none` でデフォルトのブラウザフォーカスリングを削除。`border-color` を右壁の色 (#6bff6b) に変更して、フォーカスを視覚的に示す。

## Fix 3: Auto-focus on game start

src/entry.ts で game.start() の後に canvas.focus() を呼び出す:
```typescript
const game = new Game(canvas);
game.start();
canvas.focus();
```

## Verification

1. `npm run dev` でゲームを起動
2. ページロード時に canvas がフォーカスされていることを確認（緑色のボーダー）
3. Space キーを押してピースが回転することを確認
4. 画面外をクリックしてフォーカスを失わせる
5. canvas をクリックしてフォーカスを再取得
6. Space キーを押してピースが回転することを確認

---

# Acceptance Criteria

- [ ] canvas 要素に `tabindex="0"` 属性が追加されている
- [ ] src/styles.css に `#game-canvas:focus` スタイルが追加されている
- [ ] entry.ts でゲーム開始時に canvas.focus() が呼び出されている
- [ ] ページロード時に canvas が自動的にフォーカスされる
- [ ] Space キーでアクティブピースが回転する
- [ ] 矢印キーで右壁が上下に移動する
- [ ] canvas をクリックしてフォーカスを再取得できる
- [ ] `npx tsc` でコンパイルエラーが発生しない
- [ ] 既存の267テストがすべてパスする

---

# Deliverables

- Modified: `index.html` (canvas tabindex)
- Modified: `src/styles.css` (focus styling)
- Modified: `src/entry.ts` (auto-focus)

---

# References

- src/InputManager.ts - keydown リスナーが canvas にアタッチされている
- src/Game.ts - processInput() で ROTATE/WALL_UP/WALL_DOWN を処理

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
