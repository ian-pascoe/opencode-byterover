---
title: src/index.ts Refactor Boundaries
summary: Refactor split config, message selection/formatting, recall sanitization, and LRU cache into separate modules while keeping hook orchestration in src/index.ts, with full verification passing.
tags: []
related: [facts/project/context.md, architecture/src_index_refactor/src_index_ts_refactor_boundaries.md]
keywords: []
createdAt: '2026-04-24T19:08:23.501Z'
updatedAt: '2026-04-24T19:12:00.072Z'
---
## Reason
Document the durable refactor boundaries and verification outcomes from the module split

## Raw Concept
**Task:**
Refactor the OpenCode plugin entrypoint into focused modules while preserving behavior

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

**Files:**
- src/index.ts
- src/config.ts
- src/messages.ts
- src/lru-cache.ts
- src/recall.ts
- .brv/context-tree/architecture/src_index_refactor/

**Flow:**
plugin entrypoint -> config/schema + message helpers + cache helper + recall sanitizer -> index.ts orchestration -> verification

**Timestamp:** 2026-04-24T19:11:54.761Z

**Author:** assistant

## Narrative
### Structure
The refactor separates stable pure modules from the plugin entrypoint. src/index.ts now owns hook wiring and orchestration, while the supporting behavior lives in dedicated modules for config, message handling, caching, and recall sanitization.

### Dependencies
The change depends on preserving the existing cache behavior and maintaining the same test expectations after the split.

### Highlights
Verification completed successfully with pnpm format:check, pnpm lint, pnpm test (14 tests), pnpm typecheck, and pnpm build.

### Rules
Best split:

- `src/config.ts`
  Config defaults, schema, and ByteRover gitignore bootstrap content.

- `src/messages.ts`
  `SessionMessage`, `formatMessage`, `formatMessages`, `turnKey`, recall/turn selection helpers if they stay pure.

- `src/lru-cache.ts`
  Small bounded cache helper, tested directly or indirectly.

- `src/recall.ts`
  Recall-response sanitization helpers.

Keep in `src/index.ts`:
- OpenCode plugin entrypoint
- Hook wiring
- Bridge construction
- Toast/log adapters
- High-level orchestration

I’d avoid extracting `curateTurn` and recall hook logic into separate service classes right now. The file is still readable, and over-splitting would make the plugin harder to follow. The useful boundary is “pure reusable pieces out, hook flow stays in.”

If we do it, I’d make it a refactor-only commit with no behavior changes, after the cache fix is committed.

### Examples
The split explicitly preserves hook orchestration in src/index.ts while moving stable logic into smaller modules.
