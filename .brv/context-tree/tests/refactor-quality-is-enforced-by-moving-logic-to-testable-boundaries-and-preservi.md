---
confidence: 0.96
sources:
  - architecture/_index.md
  - tests/_index.md
  - architecture/_index.md
synthesized_at: '2026-04-26T11:05:26.134Z'
type: synthesis
---

# Refactor quality is enforced by moving logic to testable boundaries and preserving integration coverage

The architecture and test summaries show a deliberate split between pure helper modules and plugin orchestration, with tests following the same boundary: helpers are tested directly, while `src/index.test.ts` keeps only integration and bootstrap behavior. This pattern reduces mock-heavy redundancy while keeping the plugin entrypoint responsible for orchestration and failure-path handling.

## Evidence

- **architecture**: The refactor keeps orchestration in `src/index.ts` as the main hook entrypoint, while helpers are split into `src/config.ts`, `src/messages.ts`, `src/lru-cache.ts`, and `src/recall.ts`; the decision is explicitly not to split `curateTurn` or recall hook logic into separate service classes.
- **tests**: Module-level tests cover `src/messages.test.ts`, `src/recall.test.ts`, and `src/lru-cache.test.ts`, while `src/index.test.ts` was reduced to plugin integration and boundary coverage such as bridge config passthrough, `.brv/.gitignore` bootstrap, recall hook injection, and idle curation dedupe.
- **architecture**: Regression coverage is required for persist failures, dedupe behavior, and other failure paths, especially around `brvBridge.ready()` and `brvBridge.persist()`.
