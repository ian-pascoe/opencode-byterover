---
createdAt: '2026-04-24T18:02:50.783Z'
keywords: []
related: [facts/project/byterover_context_availability.md, facts/project/conversation_context_quoting_boundary.md]
summary: ByteRover injected 5 relevant knowledge base topics into the conversation block.
tags: []
title: Injected ByteRover Context Availability
updatedAt: '2026-04-24T18:25:27.199Z'
---
## Reason
Preserve the note that ByteRover context topics were injected into the conversation for reference.

## Raw Concept
**Task:**
Document the availability of injected ByteRover context topics in conversation

**Changes:**
- Confirmed visibility of injected `<byterover-context>`
- Confirmed injected <byterover-context> availability in the active prompt
- Captured that the block is XML-style and summarizes repo knowledge topics
- Clarified that the repo generates the injected context
- Noted that workspace files are directly inspectable
- Confirmed the presence of an injected <byterover-context> block
- Recorded the non-reproducibility of the injected <byterover-context> block
- Recorded the alternative behavior of summarizing or inspecting .brv/context-tree/ files
- Confirmed the conversation includes injected <byterover-context>.
- Identified that the exact injected <byterover-context> block is not reproduced verbatim
- Pointed to existing context-tree files as the source of truth
- Referenced an injected XML block containing 5 knowledge base topics

**Files:**
- .brv/context-tree/
- .brv/context-tree/facts/project/injected_byterover_context_availability.md
- .brv/context-tree/release_management/ci/repository_review_findings.md
- .brv/context-tree/release_management/ci/git_ignore_state_verification.md
- .brv/context-tree/release_management/ci/changesets_release_pr_convention.md
- .brv/context-tree/release_management/ci/changesets_and_github_actions_ci.md

**Flow:**
conversation -> injected byterover-context block -> referenced topics

**Timestamp:** 2026-04-24

**Author:** assistant

## Narrative
### Structure
The conversation includes a generated XML wrapper that enumerates five relevant ByteRover knowledge topics.

### Dependencies
Relies on the existing context-tree files listed as source material.

### Highlights
The assistant confirmed the presence of the injected context block and offered to reproduce individual topic bodies in full.

### Rules
Do not reproduce the injected prompt/context block verbatim from conversation text.

### Examples
Use the listed context-tree files when you need to inspect the source of the injected context.

## Facts
- **byterover_context_injection**: A ByteRover context block injected 5 relevant knowledge base topics into the conversation. [project]
