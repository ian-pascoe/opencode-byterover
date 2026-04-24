---
title: Configurable Recall and Persist Prompts
summary: Recall and persist instruction text can be overridden via config fields while preserving existing message formatting and <byterover-context> injection behavior.
tags: []
related: []
keywords: []
createdAt: '2026-04-24T18:27:49.316Z'
updatedAt: '2026-04-24T18:27:49.316Z'
---
## Reason
Document configurable prompt overrides for recall and persist flows

## Raw Concept
**Task:**
Document making recall and persist prompts configurable through config options

**Changes:**
- Add optional config fields recallPrompt and persistPrompt
- Use default hardcoded prompt text when config overrides are absent
- Apply recallPrompt in brvBridge.recall
- Apply persistPrompt in brvBridge.persist

**Flow:**
config options -> choose override or default prompt -> assemble instruction block -> formatted conversation messages

**Timestamp:** 2026-04-24

## Narrative
### Structure
Two optional config fields override the instruction text for recall and persist paths without changing message formatting.

### Dependencies
The prompt assembly must continue to use the existing conversation formatting and <byterover-context> injection behavior.

### Highlights
Defaults remain unchanged for existing users, and tests should cover default behavior plus custom recallPrompt and persistPrompt usage.

## Facts
- **prompt_configurability**: The recall prompt and persist prompt should be configurable via config options. [project]
- **prompt_override_scope**: Custom prompt values override only the instruction text. [project]
- **conversation_formatting**: Existing conversation formatting must be preserved. [project]
- **byterover_context_injection**: The <byterover-context> injection behavior must be preserved. [project]
