# Workflow Artifact

## Purpose

Workflow artifacts are the official deliverables of the project.

Chat messages are not deliverables.

Every required workflow document must be created from its template, completed, persisted to its designated location, and verified before a task is considered complete.

This Skill defines the lifecycle of workflow artifacts.

---

## Artifact Lifecycle

Every workflow artifact follows the same process:

1. Identify the required artifact.
2. Load the corresponding template.
3. Populate all required sections.
4. Persist the artifact to its designated file.
5. Verify the artifact was successfully written.
6. Continue the workflow.

Do not skip any step.

---

## Template Usage

Always use the project template corresponding to the artifact.

If the template does not exist:

- Report the issue.
- Do not invent a new document structure unless explicitly instructed.

Templates define the canonical document format.

---

## Required Artifacts

Each agent is responsible only for its own deliverables.

Typical artifacts include:

```text
Plan Agent
    ./.workflow_doc/10_plan.md
    ./.workflow_doc/25_task_packets/*

Implement Agent
    ./.workflow_doc/30_implement.md

Code Review Agent
    ./.workflow_doc/40_code_review.md

Bird's Eye Review Agent
    ./.workflow_doc/50_birds_eye_review.md

Challenge Agent
    ./.workflow_doc/20_challenge.md (when required)
```

---

## Artifact Quality

Before persisting an artifact, verify that:

- Every required template section has been addressed.
- Required identifiers (TASK-ID, Decision-ID, etc.) are present where applicable.
- Acceptance Criteria and findings are complete.
- References are internally consistent.
- The document is understandable without conversation history.

---

## Persistence Rules

Workflow artifacts must exist as files.

Do not leave completed artifacts only in chat output.

Persist artifacts to their designated locations before reporting completion.

Artifact persistence is part of the assigned task.

---

## Verification

After writing an artifact, verify that:

- The file exists.
- The correct destination was used.
- The content is complete.
- The content follows the project template.

If verification fails, correct the artifact before continuing.

---

## Updating Shared Documents

When required by the workflow, also update:

```text
./.workflow_doc/00_project_state.md

./.workflow_doc/90_next_actions.md
```

Only update them when your work changes project state or task status.

Avoid unnecessary edits.

---

## Artifact Independence

Each workflow artifact should be independently understandable.

Do not assume downstream agents have read other documents unless explicitly intended by the workflow.

Summarize only the information required for that artifact.

Avoid unnecessary duplication.

---

## Completion Criteria

A task is not complete until:

- All required workflow artifacts have been created.
- All artifacts have been persisted.
- Required shared documents have been updated.
- Artifact verification has succeeded.

Reporting completion before artifact persistence is prohibited.

---

## Final Principle

Workflow artifacts are the project's shared memory.

Every artifact should enable the next agent to continue work immediately, without requiring additional clarification or access to prior conversations.
