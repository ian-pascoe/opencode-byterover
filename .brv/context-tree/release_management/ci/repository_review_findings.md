---
title: Repository Review Findings
summary: Review findings cover duplicate curation race conditions, in-flight marker cleanup bug, .brv/.gitignore normalization precedence regression, and declaration map packaging mismatch.
tags: []
related: [release_management/ci/changesets_and_github_actions_ci.md, release_management/ci/husky_pre_commit_checks.md, release_management/ci/git_ignore_state_verification.md]
keywords: []
createdAt: '2026-04-24T17:04:26.153Z'
updatedAt: '2026-04-26T10:42:38.123Z'
---
## Reason
Capture durable findings from the repository review conversation

## Raw Concept
**Task:**
Document repository review findings and checks

**Changes:**
- Identified a brvPath passthrough bug in plugin construction
- Confirmed the repository has no tests or pnpm test script
- Noted tracked .brv/context-tree files in version control
- Observed missing declaration files in the packed artifact
- Recorded a moderate audit issue and outdated OpenCode dependencies
- Flagged permissive numeric config validation
- User stated that they fixed an issue
- Identified duplicate curation returning before shared persist completes
- Identified inFlightCurations cleanup bug that can drop a newer turn marker
- Identified .brv/.gitignore normalization that reverses custom ignore precedence
- Identified declaration maps being shipped without source files in the package

**Flow:**
review diff -> run tests/typecheck/pack checks -> record high-risk findings

**Timestamp:** 2026-04-26T10:42:33.324Z

**Author:** assistant

## Narrative
### Structure
Four prioritized findings were recorded: two P2 issues in src/index.ts and .brv/.gitignore normalization, one P3 packaging issue, and one P1 duplicate-curation timing issue.

### Dependencies
Evidence came from src/index.ts, src/index.test.ts, tsconfig.build.json, tsconfig.json, package.json, and the .brv/.gitignore normalization behavior.

### Highlights
Tests and typecheck passed, but the review flagged a timing bug, an in-flight marker race, an ignore precedence regression, and a declaration map packaging mismatch.

### Rules
Fix in this order: 1. Pass brvPath: config.brvPath into BrvBridge. 2. Add a small test suite and pnpm test. 3. Decide whether .brv/ should be fully untracked and ignored. 4. Add declaration generation plus types/exports metadata. 5. Refresh OpenCode dependencies and re-run pnpm audit. 6. Tighten config schema validation.

### Examples
Suggested fixes included awaiting the shared in-flight operation, guarding deletion of inFlightCurations by current key, preserving custom ignore ordering, and disabling declaration maps or including source files in the package.
