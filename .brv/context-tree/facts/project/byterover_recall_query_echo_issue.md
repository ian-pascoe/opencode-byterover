---
createdAt: '2026-04-24T18:05:09.757Z'
keywords: []
related: [facts/project/injected_byterover_context_availability.md, facts/project/package_and_build_changes.md, facts/project/plugin_configuration_knobs.md, facts/project/configurable_recall_and_persist_prompts.md, facts/project/byterover_recall_query_echo_fix.md, facts/project/curated_turns_cache_bound.md, facts/project/conversation_fragment_pending_completion.md]
summary: Recall results echo the full instruction/conversation because brvBridge.recall is called with the entire formatted prompt; fix by using a concise query and optionally stripping ByteRover boilerplate before injection.
tags: []
title: Byterover recall query echo issue
updatedAt: '2026-04-24T18:05:09.757Z'
---
## Reason
Document the cause of query and conversation echo in recall results from src/index.ts

## Raw Concept
**Task:**
Explain why query and conversation text appears in recall results in src/index.ts and document the relevant implementation details.

**Changes:**
- Identified that brvBridge.recall is passed a multiline prompt containing instructions and recent conversation
- Observed that recall content is injected back into system messages via <byterover-context>
- Noted that future recall requests can include previously injected context

**Files:**
- src/index.ts

**Flow:**
session.idle or session.compacting -> curateTurn -> brvBridge.persist; system.transform -> fetchMessagesForRecall -> brvBridge.recall -> system.push(<byterover-context>)

**Timestamp:** 2026-04-24

**Author:** ByteRover context engineer

## Narrative
### Structure
The plugin curates conversation turns when a session idles or compacts, then recalls context during system transform by fetching recent messages and pushing recalled content into the system prompt.

### Dependencies
Relies on BrvBridge recall/persist behavior and the session message history returned by client.session.messages.

### Highlights
The root cause is query construction: the recall API receives the full instruction block and recent conversation rather than a narrow search query. A secondary mitigation is sanitizing known ByteRover response boilerplate before injection.

### Rules
Do not use the full formatted conversation as the recall query. Prefer a concise query derived from the latest user message. Strip known ByteRover boilerplate before pushing recalled content when needed.

### Examples
Example problematic query text begins with: Recall any relevant context that would help answer the latest user message.
Use the recent conversation only to resolve references and intent.
Recent conversation:

---
[user]...

## Facts
- **byterover_recall_query**: ByteroverPlugin calls brvBridge.recall with the entire recall instruction plus recent conversation as the query string. [project]
- **byterover_recall_output**: The recall output can echo ByteRover boilerplate such as Summary, Details, Sources, and Gaps into the injected system context. [project]
- **byterover_recall_feedback_loop**: A feedback loop can occur because injected <byterover-context> content becomes part of future session history and can be included in later recall queries. [project]
