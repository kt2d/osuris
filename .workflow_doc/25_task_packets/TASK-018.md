# Task Packet

TASK-ID: TASK-018

Title: Fix `npm run dev` Entry Point

Priority: High

Dependencies: None

---

# Objective

index.html の script src を修正し、Vite dev server (`npm run dev`) でゲームが正常に動作するようにする。

---

# Business Context

`npm run dev` は Vite 開発サーバーを起動するコマンドだが、index.html の `<script type="module" src="entry.js">` が正しく `src/entry.ts` を解決しないため、ブラウザでゲームが動作しない。これは開発者の体験を阻害するクリティカルな問題。

---

# Scope

## In Scope

### Target

- `index.html` - script src のパス修正

## Out of Scope

- vite.config.ts の変更（現在の設定は正しい）
- tsconfig.json の変更
- src/entry.ts の変更

---

# Constraints

## D-018: Vite Dev Server Entry Point

Priority: Required

Description: index.html の `<script type="module" src="entry.js">` を `<script type="module" src="./src/entry.js">` に変更する。Vite は `.js` 拡張子を `.ts` に解決する。

Rationale: Vite dev server は root ディレクトリからファイルを解決する。`entry.js` は root に存在せず、`src/entry.ts` が実際のファイル。Vite は ES modules の `.js` 拡張子を `.ts` に解決するので、`./src/entry.js` が正しいパス。

---

# Implementation Notes

## Current State

index.html (line 69):
```html
<script type="module" src="entry.js"></script>
```

実際に存在するファイル: `src/entry.ts`

## Fix

```html
<script type="module" src="./src/entry.js"></script>
```

Vite は `./src/entry.js` を `src/entry.ts` に解決する。

## Verification

1. `npm run dev` を実行
2. ブラウザで http://localhost:3000 にアクセス
3. ゲームが正常に動作することを確認
4. デベロッパーツールのコンソールにエラーがないことを確認

---

# Acceptance Criteria

- [ ] `npm run dev` で Vite 開発サーバーが正常に起動する
- [ ] ブラウザで http://localhost:3000 にアクセスするとゲームが表示される
- [ ] デベロッパーツールのコンソールにモジュール解決エラーがない
- [ ] `npx tsc` でコンパイルエラーが発生しない
- [ ] 既存の267テストがすべてパスする
- [ ] `npm run build` でビルドが成功する

---

# Deliverables

- Modified: `index.html` (script src path)

---

# References

- vite.config.ts - Vite 設定（root: '.'）
- src/entry.ts - ブラウザーエントリーポイント

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
