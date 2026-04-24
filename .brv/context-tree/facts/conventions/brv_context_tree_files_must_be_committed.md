---
title: BRV Context Tree Files Must Be Committed
summary: The repository convention is that .brv/context-tree files should always be committed, and they were committed in a docs-scoped commit.
tags: []
related: []
keywords: []
createdAt: '2026-04-24T18:51:04.126Z'
updatedAt: '2026-04-24T18:52:22.543Z'
---
## Reason
Capture repository convention and commit outcome for durable recall

## Raw Concept
**Task:**
Document the repository convention that .brv/context-tree files must be committed and record the related docs commit outcome

**Changes:**
- Established that .brv context-tree files are part of committed repository state
- Established that .brv/context-tree files are always committed
- Recorded the docs-scoped commit used for the context-tree update
- Captured verification results and PR branch information

**Flow:**
User instruction -> commit .brv/context-tree files -> verify hooks/tests -> push to PR branch

**Timestamp:** 2026-04-24

**Author:** user

## Narrative
### Structure
This knowledge belongs in the conventions domain because it defines a repository workflow rule. It also preserves the commit outcome and verification state associated with that rule.

### Dependencies
Depends on the repository practice of treating .brv/context-tree content as committed knowledge rather than transient chat context.

### Highlights
The stated convention explicitly overrides any conflicting note that says not to stage .brv/context-tree files. The recorded commit passed pre-commit verification and left the working tree clean.

### Rules
“.brv context-tree files should always be committed. just put it under a `docs:` commit”

## Facts
- **brv_context_tree_commit_policy**: .brv/context-tree files should always be committed [convention]
- **brv_context_tree_commit_type**: The .brv/context-tree files were committed in a docs: commit [project]
- **brv_context_tree_commit_hash**: The commit recorded for the .brv/context-tree updates was a7e757b docs: commit byterover context tree updates [project]
- **pr_branch**: The updated PR branch is https://github.com/ian-pascoe/opencode-byterover/pull/11 [project]
- **pre_commit_verification**: Pre-commit verification passed pnpm format:check, pnpm lint, pnpm test, and pnpm typecheck [project]
- **working_tree_status**: The working tree was clean after the commit was pushed [project]
