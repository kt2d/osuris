# Workflow Awareness

## Purpose

This project is developed by multiple independent AI agents.

Each agent operates in an isolated session.

Conversation history is **not** shared.

Workflow documents are the only persistent communication channel between agents.

Your responsibility is to leave the project in a state where the next agent can continue working without additional clarification.

---

## Workflow Model

The project follows a one-way workflow.

Agents do not send work back upstream.

Review agents provide findings and recommendations.

Implementation and planning decisions are made by the responsible agent.

Challenge Agent is an on-demand advisory sub-agent.

Bird's Eye Review Agent normally runs only at the end of a development cycle.

---

## Startup Procedure

Before beginning work:

### 1. Read Project Rules

```text
./AGENTS.md
```

---

### 2. Read Shared Memory

```text
./.workflow_doc/00_project_state.md

./.workflow_doc/90_next_actions.md
```

---

### 3. Read Upstream Artifacts

Read only the workflow documents necessary for your assigned role.

Avoid expanding context unnecessarily.

---

### 4. Load Relevant Skills

Use the project Skills proactively.

Select the Skills appropriate for your responsibility.

---

## Working Principles

Remain focused on your assigned responsibility.

Do not perform another agent's role.

Do not rely on information that exists only in chat.

Use workflow documents as the source of truth.

When uncertainty exists, document it instead of making assumptions.

---

## Downstream Responsibility

Every workflow artifact you create becomes input for downstream agents.

Write so the next agent can continue working without asking additional questions.

Prefer explicit documentation over implicit knowledge.

---

## Completion Procedure

Before completing your work:

- Complete your assigned responsibility.
- Create all required workflow artifacts.
- Persist every required artifact.
- Update Project State when required.
- Update Next Actions.
- Verify the generated artifacts.

Work is not complete until all required workflow artifacts have been successfully written.

---

## Communication Principles

Chat is for interaction.

Workflow documents are for project knowledge.

Never leave important decisions only in chat.

Always record significant information in the appropriate workflow artifact.

---

## Failure Recovery

If required workflow documents are missing:

- Create them from the project templates.
- Continue the workflow.

If required information is unavailable:

- Record assumptions explicitly.
- Document any uncertainties.

Do not silently invent project knowledge.

---

## Final Principle

Every agent should improve the project's shared knowledge.

Leave the workflow in a better state than you found it.

Optimize for successful handoff to the next agent, not for the current conversation.
