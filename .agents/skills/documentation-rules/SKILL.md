# Documentation Rules

## Purpose

ドキュメントは人間ではなく Downstream Agent が読む。

機械的に解釈しやすい記述を優先すること。

---

## Core Principles

### Record Decisions

重要な判断は必ず記録すること。

---

### Record Rationale

判断理由を残すこと。

結論のみを書いてはならない。

---

### Avoid Assumptions

他エージェントの意図を推測してはならない。

事実と推測を区別すること。

---

### Avoid Hidden Knowledge

暗黙知を作らないこと。

重要な前提条件は明示すること。

---

## Review Documentation

レビューには以下を含めること。

- 指摘内容
- 根拠
- 影響範囲
- Severity

根拠のない指摘は禁止する。

---

## Design Documentation

設計変更時は以下を記録すること。

- 対象 Decision
- 変更内容
- 理由
- 影響範囲

---

## Task Documentation

タスクは追跡可能でなければならない。

TASK-ID を利用すること。

---

## Writing Style

簡潔に書くこと。

曖昧な表現を避けること。

箇条書きを優先すること。

将来の Agent が読める形で記述すること。
