# AGENTS.md

# Purpose

本プロジェクトは複数の独立したAIエージェントによるマルチエージェント開発を前提とする。

各エージェントは独立したセッションで動作する。

会話履歴は共有されない。

情報共有は `./.workflow_doc` 配下のドキュメントのみを通じて行う。

---

# Workflow

```text
Plan Agent
    ↓
Implement Agent
    ↓
Code Review Agent
```

Challenge Agent は Plan Agent および Implement Agent が必要に応じて呼び出す SubAgent (Advisor) である。

Bird's Eye Review Agent は通常ループには含めず、開発サイクルの終了時または明示的に要求された場合のみ実行する。

ワークフローは一方向である。

レビューは提案であり、差し戻しは行わない。

意思決定は実装時点で確定する。

---

# Common Skills

全エージェントは以下の共通 Skill を積極的に利用する。

## Workflow Awareness

以下を担当する。

- ワークフローの理解
- 作業開始時の確認事項
- Completion Procedure
- Downstream Agent への引き継ぎ
- Shared Memory の利用方法

---

## Documentation Rules

以下を担当する。

- ドキュメント品質
- Decision / Rationale の記録
- レビュー記録
- Writing Style
- Documentation Principles

---

## Workflow Artifact

以下を担当する。

- テンプレート利用
- 成果物生成
- Workflow Document の更新
- ファイルへの保存（Persist）
- 成果物の検証

成果物はチャットではなく指定ファイルへ保存する。

---

# Mandatory Workflow

すべてのエージェントは以下を実施する。

1. AGENTS.md を読む
2. 共通 Skill を利用する
3. 必要な Workflow Document を確認する
4. 自身の責務を実行する
5. 成果物をテンプレートから生成する
6. 成果物を指定ファイルへ保存する
7. 必要に応じて Project State を更新する
8. Next Actions を更新する
9. 成果物を検証する
10. 作業完了を記録する

---

# Shared Memory

共有メモリは以下とする。

```text
./.workflow_doc/00_project_state.md

./.workflow_doc/90_next_actions.md
```

---

# Directory Structure

```text
./AGENTS.md

./.agents/

  agents/
  skills/
  templates/

./.workflow_doc/

  00_project_state.md

  10_plan.md

  25_task_packets/

  30_implement.md

  40_code_review.md

  50_birds_eye_review.md

  90_next_actions.md
```

---

# Task Packet Rules

Task Packet は Implement Agent の一次情報である。

配置先

```text
./.workflow_doc/25_task_packets/
```

命名規則

```text
TASK-001.md
TASK-002.md
...
```

Task Packet は単独で理解可能でなければならない。

Implement Agent は Plan 全文を読むことを前提としてはならない。

---

# Review Model

Challenge Agent

Code Review Agent

Bird's Eye Review Agent

はいずれも助言者である。

レビュー結果は提案であり、意思決定ではない。

---

# Definition of Done

作業は以下を満たして初めて完了とする。

- 必要な成果物が作成されている
- 成果物がテンプレートに従っている
- 成果物が指定ファイルへ保存されている
- 必要な Workflow Document が更新されている
- Next Actions が更新されている

---

# Communication Rules

チャットは成果物ではない。

成果物は必ず Workflow Document として保存する。

重要な判断は必ず成果物へ記録する。

---

# Thinking (Reasoning) Rules

1. 思考プロセスは必ず `<think>` ... `</think>` に記述する。
2. 思考結果は必ず `<thought>` と `</thought>` のタグ内に記述する。
3. 思考が終わった後、ツールを呼び出す場合は必ず `<tool_call>` と `</tool_call>` のタグ内に正確なJSON形式で記述する。
4. `<thought>` タグの外側、かつ `<tool_call>` タグの外側に余計な雑談やテキストを出力しないでください（ツール呼び出し時は思考とツール呼び出しのみを出力する）。
5. 最終的なタスク分解結果は、思考の後に `<plan>` ... `</plan>` の中に JSON フォーマットで記述する。

### 利用可能なツール形式

<tool_call>
{
"name": "ツール名",
"arguments": {
"引数名": "値"
}
}
</tool_call>

### 出力フォーマットの厳格な例

<thought>
- ユーザーの要望: xxxファイルのバグ修正
- 修正方針: 関数Aの境界値チェックを追加する
- 呼び出すツール: write_file
</thought>
<tool_call>
{
  "name": "write_file",
  "arguments": {
    "path": "src/utils.js",
    "content": "..."
  }
}
</tool_call>
