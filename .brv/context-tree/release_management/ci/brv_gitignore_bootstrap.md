---
createdAt: '2026-04-24T17:44:23.736Z'
keywords: []
related: [facts/project/context_tree_commit_policy.md, release_management/ci/git_ignore_state_verification.md, facts/project/context.md, release_management/ci/repository_review_findings.md, release_management/ci/brv_gitignore_bootstrap.md]
summary: Bootstrap now merges managed ignore rules into existing .brv/.gitignore while preserving custom rules; context-tree should remain tracked and not be ignored.
tags: []
title: BRV Gitignore Bootstrap
updatedAt: '2026-04-26T10:24:59.828Z'
---
## Reason
Document the bootstrap and ignore-policy fix for .brv/.gitignore

## Raw Concept
**Task:**
Fix ByteRover plugin .brv/.gitignore bootstrapping and reconcile the .brv/context-tree ignore policy with repo expectations.

**Changes:**
- Added a reference .brv/.gitignore template
- Created .brv/ during plugin setup when the project directory exists
- Wrote .brv/.gitignore with wx to avoid overwriting existing files
- Logged warnings for non-file-exists bootstrap failures
- Removed the ignore behavior for context-tree durable memory
- Changed src/index.ts to upgrade existing .brv/.gitignore files instead of skipping them
- Expanded src/index.test.ts to cover preserved custom rules and ignore behavior
- Added .changeset/fix-brv-gitignore-bootstrap.md
- Added ensureBrvGitignore merge strategy in src/index.ts
- Added regression coverage in src/index.test.ts
- Temporarily added context-tree/ to the ignore template, then planned its removal
- Prepared a changeset entry for the gitignore bootstrap fix

**Files:**
- src/index.ts
- src/index.test.ts
- .changeset/fix-brv-gitignore-bootstrap.md
- src/config.ts
- .brv/.gitignore
- .brv/context-tree/

**Flow:**
inspect ignore behavior -> reproduce with git status and git check-ignore -> update bootstrap logic -> add regression tests -> verify with repo checks

**Timestamp:** 2026-04-26

**Author:** assistant

## Narrative
### Structure
The repo uses a managed .brv/.gitignore bootstrap, but the merge behavior must preserve any pre-existing custom rules. The tracked .brv/context-tree knowledge files should remain visible in the repository rather than being hidden by generated-state ignore rules.

### Dependencies
The fix touches src/index.ts for bootstrap behavior, src/config.ts for the ignore template, and src/index.test.ts for regression coverage.

### Highlights
A temporary context-tree/ ignore rule caused git check-ignore to hide tracked .brv/context-tree files, so the next step is to remove that rule and update tests accordingly.

### Rules
context-tree should not be ignored.
Preserve existing custom .brv/.gitignore rules.

### Examples
Verified ignored paths included .brv/context-tree/facts/project/repository_checkout_location.md and two release_management/ci context-tree files.

## Facts
- **brv_gitignore_bootstrap_goal**: The goal was to fix ByteRover plugin .brv/.gitignore bootstrapping and align ignore behavior with repo expectations. [project]
- **context_tree_ignore_policy**: context-tree should not be ignored. [convention]
- **brv_gitignore_custom_rules**: Existing custom .brv/.gitignore rules must be preserved. [convention]
- **bootstrap_merge_strategy**: Bootstrap logic in src/index.ts was changed to merge missing ignore rules into existing .brv/.gitignore. [project]
- **context_tree_transient_ignore_rule**: context-tree/ was temporarily added to src/config.ts and .brv/.gitignore, then planned for removal to keep .brv/context-tree tracked. [project]
- **ignore_regression_coverage**: Regression coverage was added in src/index.test.ts to verify ignore behavior. [project]
- **verification_commands**: The change was verified with pnpm format:check, pnpm lint, pnpm test, pnpm typecheck, and pnpm build. [project]
- **git_check_ignore_results**: git check-ignore returned .brv/context-tree/facts/project/repository_checkout_location.md, .brv/context-tree/release_management/ci/awesome_opencode_plugin_pr.md, and .brv/context-tree/release_management/ci/ecosystem_docs_update_pr.md when context-tree/ was ignored. [project]
