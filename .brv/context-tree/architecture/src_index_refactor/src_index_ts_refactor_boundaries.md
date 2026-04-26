---
consolidated_at: '2026-04-26T11:05:11.118Z'
consolidated_from:
  - {date: '2026-04-26T11:05:11.118Z', path: architecture/src_index_refactor/context.md, reason: 'These files all describe the same src_index_refactor topic and the same refactor recommendations; the abstract and overview are derivative summaries of the detailed document, while context.md is the topic container for the same knowledge. They are overlapping rather than complementary, so they should be consolidated into the richer detailed file.'}
  - {date: '2026-04-26T11:05:11.118Z', path: architecture/src_index_refactor/src_index_ts_refactor_boundaries.abstract.md, reason: 'These files all describe the same src_index_refactor topic and the same refactor recommendations; the abstract and overview are derivative summaries of the detailed document, while context.md is the topic container for the same knowledge. They are overlapping rather than complementary, so they should be consolidated into the richer detailed file.'}
  - {date: '2026-04-26T11:05:11.118Z', path: architecture/src_index_refactor/src_index_ts_refactor_boundaries.overview.md, reason: 'These files all describe the same src_index_refactor topic and the same refactor recommendations; the abstract and overview are derivative summaries of the detailed document, while context.md is the topic container for the same knowledge. They are overlapping rather than complementary, so they should be consolidated into the richer detailed file.'}
---
# Src Index TS Refactor Boundaries

## Reason
Capture repo-specific recommendations about src/index.ts and src/config.ts improvements.

## Raw Concept
**Task:**
Document prioritized improvements for the plugin surface and tests.

**Changes:**
- Extracted config defaults, schema, and ByteRover gitignore bootstrap content into src/config.ts
- Extracted message formatting and pure turn-selection helpers into src/messages.ts
- Extracted the bounded cache helper into src/lru-cache.ts
- Extracted recall-response sanitization into src/recall.ts
- Kept entrypoint, hook wiring, bridge construction, toast/log adapters, and orchestration in src/index.ts
- Avoided splitting curateTurn and recall hook logic into separate service classes
- Split config defaults, schema, .brv/.gitignore bootstrap content, and cache limit into src/config.ts
- Moved SessionMessage formatting, turn keying, and recall/turn selection into src/messages.ts
- Extracted bounded LRU cache helper into src/lru-cache.ts
- Moved echoed recall query stripping into src/recall.ts
- Kept src/index.ts focused on OpenCode hook orchestration, bridge setup, logging/toasts, and orchestration
- Tighten config validation in src/config.ts
- Add error handling and readiness checks around persistence in src/index.ts
- Prevent duplicate concurrent curation with an in-flight cache
- Add published type metadata and package exports
- Add failure-path and concurrency regression tests

**Files:**
- src/index.ts
- src/config.ts
- src/messages.ts
- src/lru-cache.ts
- src/recall.ts
- .brv/context-tree/architecture/src_index_refactor/
- src/index.test.ts
- tsconfig.json
- package.json

**Flow:**
inspect plugin surface -> identify gaps -> prioritize fixes -> add tests and packaging metadata

**Timestamp:** 2026-04-26

**Author:** assistant

## Narrative
### Structure
The recommendations focus on validation in src/config.ts, runtime safety in src/index.ts, test coverage for failure paths, and package metadata in package.json and tsconfig.json.

### Dependencies
Persist behavior depends on brvBridge.persist() and brvBridge.ready(); concurrency safety depends on session.idle and experimental.session.compacting not double-invoking curateTurn.

### Highlights
Highest-value changes were identified as config validation, persist error handling/readiness, concurrent curation dedupe, and packaging types/exports.

### Rules
Add an in-flight turn cache/map so the same turn is only curated once at a time. Recall has a try/catch, but curateTurn does not. Check bridge readiness before persist.

### Examples
Invalid config values to test include maxRecallTurns: 0, contextTagName: "bad tag", and persistTimeoutMs: -1.