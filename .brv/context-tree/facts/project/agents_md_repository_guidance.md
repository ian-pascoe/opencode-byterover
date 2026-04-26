---
createdAt: '2026-04-24T18:54:58.460Z'
keywords: []
related: [release_management/ci/changesets_and_github_actions_ci.md, release_management/ci/husky_pre_commit_checks.md, facts/project/context.md, facts/project/repository_checkout_location.md, facts/project/context_tree_commit_policy.md, facts/conventions/brv_context_tree_files_must_be_committed.md]
summary: Repository guidance for AGENTS.md covers verified commands, entrypoints, ByteRover state handling, CI/hook order differences, and release workflow conventions.
tags: []
title: Agents Md Repository Guidance
updatedAt: '2026-04-24T18:56:11.897Z'
---
## Reason
Preserve the verified repo-specific AGENTS.md guidance created for future OpenCode sessions

## Raw Concept
**Task:**
Document compact repo-specific guidance for future OpenCode sessions

**Changes:**
- Defined the investigation order for repo sources
- Specified what AGENTS.md should include and exclude
- Established in-place editing for an existing AGENTS.md
- Prioritize README, manifests, workspace config, lockfiles, CI, pre-commit, task runner config, and repo-local instruction files as investigation sources
- Use executable sources of truth over prose when conflicts appear
- Keep AGENTS.md compact and high-signal, focused on durable repo-specific guidance
- Captured verified package manager, Node targets, and entrypoints
- Recorded test runner and focused verification guidance
- Recorded generated/local state directories and release workflow conventions
- Captured the mismatch between Husky pre-commit order and CI order

**Files:**
- README.md
- package.json
- pnpm-workspace.yaml
- pnpm-lock.yaml
- rolldown.config.ts
- tsconfig.json
- .github/workflows/ci.yml
- .husky/pre-commit
- .opencode/opencode.jsonc
- AGENTS.md
- .opencode/package.json
- src/index.ts
- src/index.test.ts
- .changeset/config.json

**Flow:**
investigate executable sources -> verify repo conventions -> curate durable guidance

**Timestamp:** 2026-04-24

**Author:** User instruction

## Narrative
### Structure
The guidance is intentionally compact and focused on non-obvious repository behavior that future agents could miss.

### Dependencies
It draws from root manifests, CI workflow, Husky hook, entrypoint files, and changeset configuration.

### Highlights
The most important workflow detail is that Husky and CI run checks in different orders; the guidance preserves both instead of assuming one canonical sequence.

### Rules
Include only high-signal, repo-specific guidance such as exact commands and shortcuts the agent would otherwise guess wrong; architecture notes that are not obvious from filenames; conventions that differ from language or framework defaults; setup requirements, environment quirks, and operational gotchas; references to existing instruction sources that matter. Exclude generic software advice, long tutorials, exhaustive file trees, obvious language conventions, speculative claims, and content better stored in another file referenced via `opencode.json` instructions.

## Facts
- **package_manager**: The repository uses pnpm as the package manager. [project]
- **node_versions**: The project targets Node 22 in CI and uses Node 24 in the local package config. [project]
- **entrypoints**: The plugin entrypoints are src/index.ts and src/index.test.ts. [project]
- **test_runner**: The repository uses Vitest for testing. [project]
- **state_directories**: The repository keeps generated and local state in dist/, .brv/, and .changeset/. [project]
- **pre_commit_order**: Husky pre-commit runs format:check, lint, test, and typecheck in that order. [project]
- **ci_order**: CI runs format:check, lint, typecheck, test, and build in that order. [project]
- **release_workflow**: The repo relies on changesets for release workflow conventions. [project]
