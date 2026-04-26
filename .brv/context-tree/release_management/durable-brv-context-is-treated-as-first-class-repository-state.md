---
confidence: 0.98
sources:
  - facts/_index.md
  - release_management/_index.md
  - release_management/_index.md
synthesized_at: '2026-04-26T11:05:26.131Z'
type: synthesis
---

# Durable .brv context is treated as first-class repository state

Across the knowledge base, `.brv/context-tree` is not ephemeral assistant memory but durable repo state that must be committed, preserved through workflows, and protected from ignore/bootstrap regressions. This creates a shared operational rule: knowledge curation, release processes, and repo hygiene all have to respect the same persisted context layer.

## Evidence

- **facts**: `.brv/context-tree` content is durable repository state and must always be committed, with `docs:` as the commit style.
- **release_management**: The repo uses a split-commit workflow for durable docs/state, with a first commit for `.brv/context-tree` docs-only changes and `.brv/context-tree` files explicitly required to remain tracked and not ignored.
- **release_management**: A managed `.brv/.gitignore` bootstrap must preserve existing custom ignore rules, and `.brv/context-tree` must not be ignored because it is durable repo knowledge.
