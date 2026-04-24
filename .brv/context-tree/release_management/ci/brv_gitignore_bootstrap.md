---
title: Brv Gitignore Bootstrap
summary: .brv/.gitignore is bootstrapped from a reference template during plugin setup, using exclusive-create semantics to preserve existing files and warning on non-EEXIST failures.
tags: []
related: []
keywords: []
createdAt: '2026-04-24T17:44:23.736Z'
updatedAt: '2026-04-24T17:44:23.736Z'
---
## Reason
Document the bootstrap behavior for .brv/.gitignore during plugin setup

## Raw Concept
**Task:**
Document .brv/.gitignore bootstrapping during plugin setup

**Changes:**
- Added a reference .brv/.gitignore template
- Created .brv/ during plugin setup when the project directory exists
- Wrote .brv/.gitignore with wx to avoid overwriting existing files
- Logged warnings for non-file-exists bootstrap failures

**Files:**
- src/index.ts
- src/index.test.ts

**Flow:**
plugin setup -> ensure .brv/ exists -> write .brv/.gitignore with exclusive create -> preserve existing file or warn on failure

**Timestamp:** 2026-04-24

**Author:** assistant

## Narrative
### Structure
The implementation lives in src/index.ts and is verified by tests in src/index.test.ts.

### Dependencies
Depends on the project directory existing and the reference ignore template used during setup.

### Highlights
The bootstrap is best-effort and non-destructive: it creates the ignore file only when missing and does not clobber pre-existing content.

### Examples
A successful setup creates .brv/.gitignore; a pre-existing .brv/.gitignore remains unchanged.

## Facts
- **brv_gitignore_bootstrap**: The plugin setup bootstraps .brv/.gitignore when the project directory exists. [project]
- **brv_gitignore_write_mode**: The .brv/.gitignore file is written with wx exclusive-create semantics so existing files are preserved. [project]
- **brv_gitignore_failure_handling**: Bootstrap failures are warned about unless the error is file-already-exists. [project]
- **brv_gitignore_tests**: Tests cover both creation of .brv/.gitignore and preservation of an existing file. [project]
