---
consolidated_at: '2026-04-26T11:05:18.979Z'
consolidated_from:
  - {date: '2026-04-26T11:05:18.979Z', path: tests/build/high_value_plugin_tests.abstract.md, reason: 'These three files describe the same test-suite split and cover overlapping content at different levels of detail; the markdown file is the richest source and already contains the full structured knowledge, while the abstract and overview are condensed duplicates.'}
  - {date: '2026-04-26T11:05:18.979Z', path: tests/build/high_value_plugin_tests.overview.md, reason: 'These three files describe the same test-suite split and cover overlapping content at different levels of detail; the markdown file is the richest source and already contains the full structured knowledge, while the abstract and overview are condensed duplicates.'}
createdAt: '2026-04-24T17:15:40.250Z'
keywords: []
related: []
summary: Test suite split into module-level tests for messages, recall stripping, and LRU cache behavior, while plugin-level tests retain integration coverage for config, hooks, persistence, and bootstrap behavior.
tags: []
title: High Value Plugin Tests
updatedAt: '2026-04-24T19:14:59.432Z'
---
## Reason
Record the test suite split and the remaining integration coverage boundaries

## Raw Concept
**Task:**
Document the test split and the value retained in plugin-level tests

**Changes:**
- Added Vitest and pnpm test
- Kept src/index.test.ts focused on plugin integration behavior
- Added module-level tests for message helpers, recall sanitization, and LRU cache behavior
- Removed plugin tests that redundantly re-tested extracted helper internals through mocks
- Fixed missing-options handling with Config.safeParse(options ?? {})
- Added src/messages.test.ts for message formatting, latest-turn selection, recall selection, and turn keys
- Added src/recall.test.ts for echoed recall-query stripping
- Added src/lru-cache.test.ts for eviction and recency refresh
- Trimmed src/index.test.ts back to plugin integration behavior
- Removed redundant plugin-level tests that re-tested extracted helper internals through mocks
- Updated repository context to reflect the new test boundaries

**Files:**
- package.json
- pnpm-lock.yaml
- src/index.ts
- src/index.test.ts
- src/messages.test.ts
- src/recall.test.ts
- src/lru-cache.test.ts
- .github/workflows/ci.yml
- .husky/pre-commit
- README.md
- .brv/context-tree/tests/build/high_value_plugin_tests.md

**Flow:**
review current tests -> extract helper behavior into module tests -> trim plugin tests to integration coverage -> update repository memory

**Timestamp:** 2026-04-24T19:14:52Z

**Author:** assistant

## Narrative
### Structure
The test suite is now organized by behavior: helper-level logic is covered in dedicated unit tests, and src/index.test.ts focuses on end-to-end plugin wiring.

### Dependencies
The split preserves coverage for plugin bootstrap, recall and persist hooks, config passthrough, and invalid configuration handling while removing duplicated helper assertions.

### Highlights
pnpm format:check, pnpm lint, pnpm test, pnpm typecheck, and pnpm build all passed after the refactor; pnpm test reported 17 tests across 4 files.

### Rules
Keep plugin tests for integration behavior. Cover pure helpers directly at their module boundaries and avoid redundant plugin-level tests that only re-test helper internals through mocks.

### Examples
Kept in src/index.test.ts: bridge config passthrough, disabled plugin behavior, .brv/.gitignore bootstrap behavior, recall hook injection, auto-recall disabled behavior, custom recall prompt wiring, idle curation dedupe, auto-persist disabled behavior, custom persist prompt wiring, and invalid config logging/no hooks.

## Facts
- **test_suite_split**: The test suite was split into module-level files for messages, recall stripping, and LRU cache behavior. [project]
- **redundant_plugin_tests_removed**: Redundant plugin-level tests were removed after behavior was extracted into dedicated unit coverage. [project]
- **remaining_plugin_test_coverage**: The remaining plugin-level tests keep integration coverage for bridge config passthrough, disabled plugin behavior, .brv/.gitignore bootstrap behavior, recall hook injection, auto-recall disabled behavior, custom recall prompt wiring, idle curation dedupe, auto-persist disabled behavior, custom persist prompt wiring, and invalid config logging/no hooks. [project]

## Consolidated overview content
- The test suite was split so pure helper behavior lives in module-level tests, while src/index.test.ts keeps only plugin integration coverage.
- New unit tests were added for message helpers, recall sanitization, and LRU cache behavior.
- Redundant plugin tests that re-checked extracted helper internals through mocks were removed.
- Missing-options handling was fixed with Config.safeParse(options ?? {}).
- The refactor preserved important plugin behavior coverage: config passthrough, bootstrap behavior, hooks, persistence, disabled-plugin behavior, and invalid config handling.
- Validation passed after the change: pnpm format:check, pnpm lint, pnpm test, pnpm typecheck, and pnpm build all succeeded.
- pnpm test reported 17 tests across 4 files.

## Consolidated abstract content
The test suite was split into module-level unit tests for helpers while plugin-level tests retain integration coverage for config, hooks, persistence, bootstrap, and invalid configuration handling.