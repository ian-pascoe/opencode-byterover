---
confidence: 0.94
sources:
  - architecture/_index.md
  - facts/_index.md
  - tests/_index.md
synthesized_at: '2026-04-26T11:05:26.139Z'
type: synthesis
---

# Converging emphasis on dedupe as a correctness boundary

Multiple domains identify duplicate processing as a correctness risk, not just an optimization. The system uses bounded cache state, in-flight turn protection, and test coverage to prevent the same turn or curation path from being processed twice under overlapping session and compacting conditions.

## Evidence

- **architecture**: Concurrency deduplication is handled by adding an in-flight turn cache/map so the same turn is processed only once, specifically to protect against duplicate curation when `session.idle` and `experimental.session.compacting` overlap.
- **facts**: `curated_turns_cache_bound.md` documents bounded dedupe-state handling by moving curated-turn state into `ByteroverPlugin` and using an LRU-style `Map` capped at 500 sessions with recency refresh on hit and oldest-entry eviction.
- **tests**: `src/index.test.ts` retains idle curation dedupe coverage, while module tests cover the LRU cache eviction and recency refresh behavior in `src/lru-cache.test.ts`.
