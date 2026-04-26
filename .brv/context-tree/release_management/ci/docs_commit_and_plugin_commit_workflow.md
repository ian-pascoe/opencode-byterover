---
createdAt: '2026-04-26T10:49:14.202Z'
keywords: []
related: [facts/project/context_tree_commit_policy.md, release_management/ci/changesets_and_github_actions_ci.md]
summary: 'Two-commit release workflow: docs-only .brv/context-tree commit followed by plugin/package commit, verified with format, lint, test, typecheck, build, and pack dry-run before pushing and opening PR #17'
tags: []
title: Docs Commit and Plugin Commit Workflow
updatedAt: '2026-04-26T10:49:14.202Z'
---
## Reason
Capture the lasting release workflow, commit split, verification, and PR outcome from the conversation

## Raw Concept
**Task:**
Document the release workflow for separating docs-only context-tree changes from plugin/package changes

**Changes:**
- Created a feature branch from main
- Committed .brv/context-tree changes separately from code changes
- Ran repository verification commands before push
- Pushed branch with upstream tracking and opened PR #17

**Files:**
- package.json
- README.md
- .changeset/

**Flow:**
main -> feature branch -> docs-only commit -> plugin/package commit -> verification -> push -u -> PR creation

**Timestamp:** 2026-04-26T10:49:06.521Z

**Author:** ByteRover assistant

## Narrative
### Structure
The release process intentionally separated durable documentation updates under .brv/context-tree from the code, README, and changeset changes so the history stayed clean.

### Dependencies
The workflow depended on passing pnpm format:check, pnpm lint, pnpm test, pnpm typecheck, pnpm build, and pnpm pack --dry-run before push.

### Highlights
The final outcome was two commits, e541c31 and 952f1d6, and PR #17 against main.

### Rules
Rule: Keep .brv/context-tree updates in a docs-only commit separate from plugin/package changes.

### Examples
Docs commit: e541c31. Plugin/package commit: 952f1d6. PR: https://github.com/ian-pascoe/opencode-byterover/pull/17

## Facts
- **commit_split_workflow**: The working tree was split into two commits: one docs-only commit for tracked .brv/context-tree updates and one plugin/package commit for the code, README, and changeset. [project]
- **docs_commit_hash**: The docs-only context-tree changes were committed as e541c31. [project]
- **plugin_commit_hash**: The plugin/package changes were committed as 952f1d6. [project]
- **verification_commands**: Verification before push included pnpm format:check, pnpm lint, pnpm test, pnpm typecheck, pnpm build, and pnpm pack --dry-run. [project]
- **pull_request_url**: A pull request was created at https://github.com/ian-pascoe/opencode-byterover/pull/17. [project]
- **upstream_status**: The branch had no upstream before pushing, so it was pushed with -u. [project]
