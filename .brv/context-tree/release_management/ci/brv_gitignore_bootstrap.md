---
title: BRV Gitignore Bootstrap
summary: The BRV gitignore bootstrap now preserves custom .brv/.gitignore rules, ignores .brv/config.json, and keeps .brv/context-tree/**/*.md visible for durable memory.
tags: []
related: [facts/project/context_tree_commit_policy.md, release_management/ci/git_ignore_state_verification.md]
keywords: []
createdAt: '2026-04-24T17:44:23.736Z'
updatedAt: '2026-04-26T10:20:12.720Z'
---
## Reason
Document the fix ensuring context-tree notes are not ignored while generated BRV state remains ignored

## Raw Concept
**Task:**
Fix BRV gitignore bootstrap so durable context-tree knowledge is not ignored

**Changes:**
- Added a reference .brv/.gitignore template
- Created .brv/ during plugin setup when the project directory exists
- Wrote .brv/.gitignore with wx to avoid overwriting existing files
- Logged warnings for non-file-exists bootstrap failures
- Removed the ignore behavior for context-tree durable memory
- Changed src/index.ts to upgrade existing .brv/.gitignore files instead of skipping them
- Expanded src/index.test.ts to cover preserved custom rules and ignore behavior
- Added .changeset/fix-brv-gitignore-bootstrap.md

**Files:**
- src/index.ts
- src/index.test.ts
- .changeset/fix-brv-gitignore-bootstrap.md

**Flow:**
detect existing .brv/.gitignore -> append managed generated-state rules if missing -> verify context-tree markdown stays visible and generated state stays ignored

**Timestamp:** 2026-04-26

**Author:** assistant

## Narrative
### Structure
The update touches bootstrap logic in src/index.ts and adds regression coverage in src/index.test.ts for both preserved custom ignore rules and the visibility of context-tree markdown files.

### Dependencies
Relies on the .brv directory layout where config.json remains ignored while context-tree markdown files are intended to stay durable and accessible.

### Highlights
Corrected the earlier diagnosis: .brv/context-tree/ is durable ByteRover memory, and the repo now explicitly proves it is not ignored. Verification completed successfully across formatting, linting, tests, typecheck, and build.

### Rules
context-tree/ is durable ByteRover memory in this repo, so my previous diagnosis was wrong. I’m removing that ignore rule and converting the regression to prove context-tree notes remain visible while generated/non-source ByteRover state is ignored.

### Examples
git status --short --ignored now shows new .brv/context-tree/**/*.md files as untracked (??), not ignored, while generated state like .brv/config.json remains ignored.

## Facts
- **context_tree_ignore_policy**: context-tree/ should not be ignored because it is durable ByteRover memory in this repo [project]
- **brv_gitignore_bootstrap_behavior**: The fix upgrades an existing .brv/.gitignore by appending missing managed generated-state rules instead of doing nothing when the file already exists [project]
- **brv_gitignore_custom_rules**: The regression test verifies existing custom .brv/.gitignore rules are preserved [project]
- **brv_config_ignore_rule**: The regression test verifies .brv/config.json is ignored [project]
- **context_tree_markdown_ignore_rule**: The regression test verifies .brv/context-tree/**/*.md is not ignored [project]
- **changeset_file**: A patch changeset was added at .changeset/fix-brv-gitignore-bootstrap.md [project]
- **verification_commands**: Verification passed with pnpm format:check, pnpm lint, pnpm test, pnpm typecheck, and pnpm build [project]
