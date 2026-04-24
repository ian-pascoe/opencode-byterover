---
title: ByteRover recall query echo fix
summary: ByteRover recall responses are sanitized by stripping only the echoed query from the Summary header; tests, lint, typecheck, and build all passed.
tags: []
related: []
keywords: []
createdAt: '2026-04-24T18:13:13.757Z'
updatedAt: '2026-04-24T18:13:13.757Z'
---
## Reason
Document the durable code change that strips echoed recall queries from ByteRover summaries while preserving retrieved context.

## Raw Concept
**Task:**
Strip echoed ByteRover recall queries from formatted responses without removing the retrieved context.

**Changes:**
- Added stripEchoedRecallQuery(content, query) in src/index.ts
- Added regression coverage in src/index.test.ts
- Fixed a test harness gap by mocking tui.showToast so setup warnings do not crash tests

**Files:**
- src/index.ts
- src/index.test.ts

**Flow:**
recall query -> ByteRover response -> sanitize summary header -> preserve details/sources/gaps -> push into system

**Author:** assistant

## Narrative
### Structure
The fix is intentionally narrow: it targets only the echoed query fragment inside the ByteRover Summary header and leaves the rest of the response intact.

### Dependencies
The test suite uses a mocked brvBridge.recall path, so the behavior is covered without contacting ByteRover directly.

### Highlights
Verification succeeded across targeted tests and repository-wide checks, confirming the sanitizer did not break formatting or type safety.

### Examples
The preserved response sections include **Summary**, **Details**, **Sources**, and **Gaps**.

## Facts
- **recall_query_sanitizer**: The project added stripEchoedRecallQuery(content, query) in src/index.ts to remove only the echoed recall query from ByteRover summary headers. [project]
- **recall_query_sanitization_scope**: The sanitizer removes only the ` for "<full recall query>"` portion from a ByteRover `**Summary**: Found ...` header and preserves the rest of the returned context. [project]
- **recall_query_regression_test**: A regression test was added in src/index.test.ts that simulates ByteRover echoing the full recall query. [project]
- **verification_commands**: Repository verification passed with pnpm test -- src/index.test.ts, pnpm format:check, pnpm lint, pnpm typecheck, pnpm test, and pnpm build. [project]
