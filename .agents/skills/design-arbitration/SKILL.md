# Documentation Rules

## Purpose

Workflow documents are the primary communication mechanism between independent agents.

Documentation is written for downstream agents, not for the current session.

The goal is to preserve decisions, rationale, and context so future agents can continue work without additional clarification.

This Skill defines documentation quality only.

Workflow execution and artifact persistence are defined by other Skills.

---

## Core Principles

### Record Decisions

Record every important technical or planning decision.

Do not assume future agents can infer why a decision was made.

---

### Record Rationale

Every significant decision should include its reasoning.

Do not record conclusions without explaining why they were reached.

---

### Separate Facts From Assumptions

Clearly distinguish:

- Facts
- Assumptions
- Opinions
- Recommendations

Avoid presenting assumptions as established facts.

---

### Avoid Hidden Knowledge

Do not rely on implicit knowledge.

Explicitly document:

- Constraints
- Assumptions
- Risks
- Dependencies
- Trade-offs

Future agents should not need to rediscover important context.

---

### Write For Downstream Agents

Assume the reader has:

- No conversation history
- No knowledge of your internal reasoning

Documents should be understandable on their own.

---

## Documentation Quality

Documentation should be:

- Clear
- Concise
- Accurate
- Traceable
- Actionable

Prefer information density over verbosity.

Avoid unnecessary explanation.

---

## Decision Documentation

When documenting important decisions, include whenever applicable:

- Decision
- Rationale
- Constraints
- Trade-offs
- Expected impact

Do not document only the outcome.

---

## Review Documentation

Review findings should include:

- Description
- Evidence
- Impact
- Severity

Recommendations are optional.

Every finding should be supported by observable evidence or clear reasoning.

---

## Design Change Documentation

When a design changes during implementation, document:

- Original intent
- New approach
- Reason for the change
- Expected impact

Focus on why the change was necessary.

---

## Task Documentation

Use stable identifiers whenever applicable.

Examples:

- TASK-ID
- Decision-ID
- Finding-ID
- Concern-ID

Identifiers should remain traceable throughout the workflow.

---

## Writing Style

Prefer:

- Short paragraphs
- Bullet lists
- Concrete language
- Consistent terminology

Avoid:

- Ambiguous wording
- Subjective commentary
- Repetition
- Unnecessary narrative

Write so another agent can continue work immediately.

---

## Documentation Scope

Record information that affects future work.

Avoid documenting routine actions that add no long-term value.

Prefer durable knowledge over temporary observations.

---

## Final Principle

A document is successful when a downstream agent can understand:

- What was decided
- Why it was decided
- What remains important
- What should happen next

without requiring additional conversation.
