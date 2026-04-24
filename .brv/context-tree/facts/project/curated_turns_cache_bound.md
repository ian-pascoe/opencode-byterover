---
title: Curated Turns Cache Bound
summary: Curated-turn dedupe state now lives inside ByteroverPlugin with an LRU-style Map capped at 500 sessions, plus a regression test and verified repo checks.
tags: []
related: []
keywords: []
createdAt: '2026-04-24T19:02:28.099Z'
updatedAt: '2026-04-24T19:04:51.693Z'
---
## Reason
Document the implemented bounded cache fix and verification outcomes

## Raw Concept
**Task:**
Implement and document a bounded cache fix for curated-turn dedupe state

**Changes:**
- Replaced state.curatedTurns with a per-plugin Map scoped inside ByteroverPlugin
- Added LRU-style recency refresh on cache get
- Added oldest-entry eviction when the cache exceeds 500 sessions
- Added a regression test proving old session entries are evicted instead of accumulating without bound
- Moved dedupe state into ByteroverPlugin
- Replaced unbounded accumulation with an LRU-style Map capped at 500 sessions
- Added recency refresh on cache hit
- Evicted the oldest entry when capacity is exceeded
- Added a regression test for repeated unique sessions
- Updated the changeset note

**Files:**
- src/index.ts
- src/index.test.ts
- .brv/context-tree/facts/project/curated_turns_cache_bound.md
- changeset note

**Flow:**
regression test -> bounded cache implementation -> eviction behavior -> repo checks -> release/context note update

**Timestamp:** 2026-04-24T19:04:41.935Z

**Author:** assistant

## Narrative
### Structure
The fix centers on ByteroverPlugin owning per-plugin dedupe state rather than a module-level map, which prevents unbounded growth across repeated unique sessions.

### Dependencies
Depends on the new regression test to prove the old behavior fails, and on repo verification commands to confirm the implementation is safe.

### Highlights
The bounded cache implementation passed the targeted LRU regression and the full repo verification sequence, with 14 tests passing.

### Rules
Keep the generated .brv/context-tree note for commit per repo convention.

### Examples
Use the cache to store up to 500 sessions, refresh recency on hit, and evict the oldest session when a new entry would exceed capacity.

## Facts
- **dedupe_state_location**: Curated-turn dedupe state was moved inside ByteroverPlugin instead of module-level shared state. [project]
- **cache_capacity**: The cache uses an LRU-style Map capped at 500 sessions. [project]
- **cache_hit_behavior**: Cache hit refreshes recency. [project]
- **eviction_policy**: The cache evicts the oldest session entry when over capacity. [project]
- **regression_test**: A regression test was added that fails on the old unbounded behavior and passes with eviction. [project]
- **changeset_note_updated**: The changeset note was updated. [project]
- **context_tree_commit_policy**: The generated .brv/context-tree/facts/project/curated_turns_cache_bound.md file should be kept for commit per repo convention. [convention]
- **verification_commands**: Verified commands included pnpm format:check, pnpm lint, pnpm test, pnpm typecheck, and pnpm build. [project]
- **test_count**: pnpm test passed with 14 tests. [project]
- **working_tree_state**: Current changes are local and uncommitted. [project]
