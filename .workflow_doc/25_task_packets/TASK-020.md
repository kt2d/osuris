# Task Packet

TASK-ID: TASK-020

Title: Fix Overlapping Game Loops on Restart

Priority: High

Dependencies: None

---

# Objective

ゲームオーバー状態から Enter キーでゲームを再開する際、重複するゲームループが作成されないようにする。

---

# Business Context

現在の実装では、ゲームオーバー状態で Enter キーを押すと `Game.start()` が呼び出される。`start()` は `gameLoop()` を呼び出し、新しい `requestAnimationFrame` をスケジュールする。しかし、元の gameLoop も `requestAnimationFrame` をスケジュールするため、2つのゲームループが同時に実行される。これは以下の問題を引き起こす：

1. ゲームが2倍の速度で進行する
2. 入力処理が2回実行される
3. リソースの無駄遣い

Code Review (CR-IT2-003) でこの問題が特定されている。

---

# Scope

## In Scope

### Target

- `src/Game.ts` - start() メソッドの修正

## Out of Scope

- InputManager.ts の変更
- ゲームループのアーキテクチャ変更
- ゲームオーバー状態でのループ停止（意図的な設計）

---

# Constraints

## D-020: Prevent Overlapping Game Loops on Restart

Priority: Required

Description: Game.start() の最初に `this.stop()` を呼び出し、既存のアニメーションフレームをキャンセルする。

Rationale: ゲームオーバー状態で Enter キーを押すと、gameLoop() から processInput() が呼び出され、start() が呼び出される。start() が gameLoop() を呼び出すと、新しい requestAnimationFrame がスケジュールされる。元の gameLoop も rAF をスケジュールするため、2つのループが同時に実行される。stop() を最初に呼び出すことで、既存のループをキャンセルし、1つのループのみが実行されるようにする。

---

# Implementation Notes

## Current State

Game.ts start() メソッド:
```typescript
start(): void {
  // Reset field and state
  this.field.clear();
  this.activePiece = null;
  this.leftWall.setPosition(0);
  this.rightWall.setY(0);
  this.inputManager.reset();

  if (!this.spawnPiece()) {
    this.state = 'GAME_OVER';
  } else {
    this.state = 'PLAYING';
  }

  this.gameLoop();
}
```

gameLoop() メソッド:
```typescript
private gameLoop = (): void => {
  this.update();
  this.render();
  this.animFrameId = requestAnimationFrame(this.gameLoop);
};
```

stop() メソッド:
```typescript
stop(): void {
  if (this.animFrameId !== null) {
    cancelAnimationFrame(this.animFrameId);
    this.animFrameId = null;
  }
}
```

## Fix

start() の最初に `this.stop()` を追加:
```typescript
start(): void {
  // Cancel any existing animation frame to prevent overlapping loops
  this.stop();

  // Reset field and state
  this.field.clear();
  // ... rest of the method
}
```

## Why This Works

1. ゲームオーバー状態で Enter キーが押される
2. processInput() が this.start() を呼び出す
3. start() が this.stop() を呼び出し、既存の animFrameId をキャンセル
4. start() が this.gameLoop() を呼び出し、新しいループを開始
5. 元の gameLoop の rAF コールバックはキャンセルされているため、実行されない

## Test Considerations

既存のテストは Game クラスの公開APIをテストしている。start() の内部実装を変更しても、テストの動作に影響しないはず。ただし、テスト44（再起動テスト）で確認する必要がある。

---

# Acceptance Criteria

- [ ] Game.start() の最初に this.stop() が呼び出されている
- [ ] ゲームオーバー状態で Enter キーを押すと、ゲームが正常に再開される
- [ ] 再開後、ゲームループが1つだけ実行されている（重複なし）
- [ ] ゲームの進行速度が正常（2倍速にならない）
- [ ] 入力処理が1回だけ実行される
- [ ] `npx tsc` でコンパイルエラーが発生しない
- [ ] 既存の267テストがすべてパスする
- [ ] テスト44（再起動テスト）がパスする

---

# Deliverables

- Modified: `src/Game.ts` (start() メソッド)

---

# References

- src/Game.ts - start(), stop(), gameLoop(), processInput() メソッド
- .workflow_doc/40_code_review.md - CR-IT2-003: Game.start() Called During Active Game Loop

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
