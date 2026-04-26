---
createdAt: '2026-04-24T12:52:44.558Z'
keywords: []
related: [release_management/ci/changesets_and_github_actions_ci.md, release_management/ci/husky_pre_commit_checks.md, release_management/ci/changesets_and_github_actions_ci.abstract.md, release_management/ci/changesets_and_github_actions_ci.overview.md, release_management/ci/docs_commit_and_plugin_commit_workflow.md]
summary: GitHub Actions publish flow requires NPM_TOKEN, enabled Actions, release PR permissions, and a changeset-driven merge process.
tags: []
title: Changesets and GitHub Actions CI
updatedAt: '2026-04-24T13:08:51.012Z'
---
## Reason
Document the release publishing requirements and flow

## Raw Concept
**Task:**
Document the GitHub Actions release publishing setup

**Changes:**
- Added Changesets config
- Added GitHub Actions CI workflow
- Added GitHub Actions release workflow
- Added release scripts to package.json
- Added npm publishConfig with public access and provenance
- Added a minimal README.md for published package documentation
- Fixed tsconfig.json so CI typecheck only includes src
- Formatted .oxlintrc.json so format checks pass
- Confirmed the repository only needs the npm automation token and GitHub Actions/release PR permissions to publish
- Captured the Changesets release flow for user-facing changes

**Files:**
- .changeset/config.json
- .github/workflows/ci.yml
- .github/workflows/release.yml
- package.json
- README.md
- tsconfig.json
- .oxlintrc.json

**Flow:**
pnpm changeset -> merge to main -> GitHub opens release PR -> merge release PR -> npm publish via NPM_TOKEN

**Timestamp:** 2026-04-24

**Author:** Ian

**Patterns:**
- `NPM_TOKEN` - GitHub secret required for npm publishing

## Narrative
### Structure
This knowledge covers the release automation prerequisites for GitHub Actions and Changesets in the repository.

### Dependencies
Depends on GitHub repo settings, workflow permissions, and an npm automation token for publishing.

### Highlights
Publishing is triggered after merging the Changesets release PR; if release PR creation fails, the GitHub Actions pull-request creation permission must be enabled.

### Rules
Actions enabled is required. Workflow permissions must allow read/write, or the workflow must specify explicit permissions. If the Changesets release PR fails to open, enable Allow GitHub Actions to create and approve pull requests.

### Examples
Verified commands: pnpm format:check, pnpm lint, pnpm typecheck, pnpm build, pnpm pack --dry-run.

## Facts
- **github_actions_ready_condition**: GitHub Actions are ready once the repository files are committed and pushed. [environment]
- **npm_token**: The repository secret NPM_TOKEN must be set to an npm automation token with publish access for opencode-byterover. [project]
- **github_actions_enabled**: Actions must be enabled in GitHub repo settings. [environment]
- **workflow_permissions**: Workflow permissions must allow read/write, or rely on explicit workflow permissions. [environment]
- **github_actions_pr_permissions**: If the Changesets release PR fails to open, enable Allow GitHub Actions to create and approve pull requests. [environment]
- **release_flow**: Release flow: run pnpm changeset for a user-facing change, merge to main, let GitHub open a Changesets release PR, merge the release PR, then GitHub publishes to npm using NPM_TOKEN. [project]
