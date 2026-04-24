---
title: Changesets Release PR Convention
summary: 'Release PRs use conventional commit style chore(release): v{version} by reading the bumped package version in the release workflow'
tags: []
related: [release_management/ci/changesets_and_github_actions_ci.md]
keywords: []
createdAt: '2026-04-24T15:50:31.003Z'
updatedAt: '2026-04-24T15:50:31.003Z'
---
## Reason
Document the release PR title and commit style change requested for Changesets workflow

## Raw Concept
**Task:**
Document the Changesets release PR naming and commit convention change.

**Changes:**
- Requested release PR commit style chore(release): v{version}
- Workflow now determines the bumped version after changeset version
- Release PR title and commit message are aligned to the same versioned conventional commit format

**Flow:**
detect pending changesets -> create changeset-release/main -> run version-packages -> read bumped version -> commit and open PR with chore(release): v{version}

**Timestamp:** 2026-04-24

**Author:** Ian

## Narrative
### Structure
The release workflow distinguishes between release-creation mode and publish-only mode. When changesets are present, the workflow generates a versioned release commit and PR title from the bumped package version.

### Dependencies
Depends on the Changesets workflow, pnpm version-packages script, and package.json version output.

### Highlights
The release PR format is now standardized to conventional commit style using the versioned chore(release) prefix.

### Examples
Example release PR title and commit: chore(release): v1.2.3

## Facts
- **release_pr_commit_style**: The Changesets release PR should use the conventional commit style chore(release): v{version}. [convention]
- **release_workflow_versioning**: The release workflow was updated to read the bumped package.json version after running changeset version and use it for the release PR title and commit message. [project]
- **release_workflow_fallback**: If no changesets exist, the workflow still uses changesets/action@v1 for trusted-publishing release publish. [project]
