# Next Actions

Last Updated:

Updated By:

---

# Tasks

## TASK-001

Title:

Status:

READY | RUNNING | BLOCKED | REVIEW | DONE

Owner:

Plan Agent | Implement Agent | Code Review Agent | None

Priority:

High | Medium | Low

Dependencies:

- TASK-000

Next Action:

Runner が次に実行すべき内容を簡潔に記載する。

Notes:

---

## TASK-002

Title:

Status:

READY | RUNNING | BLOCKED | REVIEW | DONE

Owner:

Plan Agent | Implement Agent | Code Review Agent | None

Priority:

High | Medium | Low

Dependencies:

- TASK-001

Next Action:

Notes:

---

# Backlog

まだ Task Packet 化していない候補

- IDEA-001
- IDEA-002

---

# Workflow Notes

ワークフロー全体への連絡事項

例：

- Bird's Eye Review は全Task完了後に実施
- Project State 更新予定
- 外部依存待ち
- 優先順位変更

---

# Runner Notes

Runner 向けの管理メモ

## Dispatch Rule

Runner は以下を満たす最初の Task を実行する。

- Status = READY
- Dependencies がすべて DONE
- Priority が最も高い

---

## Completion Rule

Agent 完了後、Runner は

- Deliverable の存在確認
- Validation の確認
- Status 更新
- Next Action 実施

を行う。

---

## Retry Rule

Agent が失敗した場合

- Status は BLOCKED に変更する
- Notes に原因を記録する
- 自動リトライしない

Runner が再実行を判断する。

---

## Bird's Eye Rule

Bird's Eye Review は以下を満たした場合のみ実行する。

- READY が存在しない
- RUNNING が存在しない
- REVIEW が存在しない
- BLOCKED が存在しない
- DONE が1件以上存在する
