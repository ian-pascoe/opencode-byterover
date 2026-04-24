---
createdAt: '2026-04-24T12:58:30.155Z'
keywords: []
related: [release_management/ci/changesets_and_github_actions_ci.md, release_management/ci/husky_pre_commit_checks.abstract.md, release_management/ci/husky_pre_commit_checks.overview.md]
summary: Husky was added with a pre-commit hook that runs format check, lint, and typecheck; .brv state is ignored in Git and formatting.
tags: []
title: Husky Pre-commit Checks
updatedAt: '2026-04-24T12:58:30.155Z'
---

## Reason

Document adding Husky with repo-local pre-commit checks and .brv exclusions

## Raw Concept

**Task:**
Document the addition of Husky pre-commit tooling to the project

**Changes:**

- Installed husky as a dev dependency
- Added prepare: husky to package.json
- Created .husky/pre-commit to run formatting, linting, and typechecking
- Ignored local .brv/ state in Git
- Excluded .brv/\*\* from oxfmt

**Files:**

- package.json
- .husky/pre-commit
- .gitignore
- .oxfmtrc.json

**Flow:**
install husky -> run prepare script -> pre-commit executes format check -> lint -> typecheck

**Timestamp:** 2026-04-24

**Author:** Ian

## Narrative

### Structure

Husky is wired into the repo via package.json prepare and a .husky/pre-commit hook. The hook focuses on existing local checks instead of pnpm test because the project has no test script.

### Dependencies

The hook depends on the repo’s format, lint, and typecheck scripts. Local ByteRover workspace state in .brv/ is treated as generated state and excluded from both Git and formatting.

### Highlights

The hook prevents commits when formatting, linting, or typechecking fail, while avoiding false failures from generated .brv files.

### Examples

Pre-commit command sequence: pnpm format:check && pnpm lint && pnpm typecheck

## Facts

- **husky**: Husky was added as dev tooling for the project [project]
- **prepare_script**: package.json includes prepare: husky [project]
- **pre_commit_checks**: The pre-commit hook runs pnpm format:check, pnpm lint, and pnpm typecheck [project]
- **brv_gitignore**: .brv/ is ignored in .gitignore [project]
- **brv_oxfmt_exclusion**: .brv/\*\* is excluded from oxfmt [project]
