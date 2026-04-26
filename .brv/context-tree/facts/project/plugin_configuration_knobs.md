---
createdAt: '2026-04-24T18:31:26.327Z'
keywords: []
related: [facts/project/package_and_build_changes.md, facts/project/configurable_recall_and_persist_prompts.md, facts/project/byterover_recall_query_echo_fix.md, facts/project/byterover_recall_query_echo_issue.md, facts/project/curated_turns_cache_bound.md, facts/project/conversation_fragment_pending_completion.md]
summary: Plugin supports enabled, autoRecall, autoPersist, and contextTagName; defaults preserved and verified by 13 tests plus docs updates.
tags: []
title: Plugin Configuration Knobs
updatedAt: '2026-04-24T18:36:01.138Z'
---
## Reason
Document implemented plugin configuration options and verification outcomes

## Raw Concept
**Task:**
Document plugin configuration knobs implemented from the conversation

**Changes:**
- Identified the small set of recommended operational controls
- Rejected exposing raw prompt templates and bridge internals
- Marked several additional knobs as optional or not recommended
- Added enabled config knob
- Added autoRecall config knob
- Added autoPersist config knob
- Added contextTagName config knob
- Added tests for all four knobs
- Updated README config list and example

**Flow:**
configure plugin -> parse config -> apply hooks/bridge behavior -> run tests -> update docs -> verify

**Timestamp:** 2026-04-24T18:35:55.166Z

## Narrative
### Structure
The plugin configuration now exposes four user-facing knobs while preserving current defaults and behavior for existing paths.

### Dependencies
Behavior was validated with tests before documentation updates, and the final verification set included formatting, linting, type checking, and build checks.

### Highlights
The approved knobs were implemented without changing existing default behavior. The suite increased to 13 tests and all listed verification commands passed.

### Examples
Examples include disabling the plugin with enabled=false, skipping recall injection with autoRecall=false, skipping idle curation with autoPersist=false, and changing the wrapper tag with contextTagName.

## Facts
- **plugin_enabled_flag**: The plugin now supports an enabled flag that disables plugin setup entirely when false. [project]
- **plugin_auto_recall**: The plugin now supports autoRecall, which skips recall/system injection when false. [project]
- **plugin_auto_persist**: The plugin now supports autoPersist, which skips idle/compaction curation when false. [project]
- **plugin_context_tag_name**: The plugin now supports contextTagName, which customizes the injected wrapper tag. [project]
- **plugin_test_count**: Coverage was added for all four knobs and the suite now has 13 tests. [project]
- **plugin_verification_commands**: Verification passed for pnpm test, pnpm format:check, pnpm lint, pnpm typecheck, and pnpm build. [project]
