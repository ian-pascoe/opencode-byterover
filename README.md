<div align='center'>
    <br/>
    <br/>
    <h3>opencode-byterover</h3>
    <p>ByteRover memory integration for OpenCode.</p>
    <a href="https://www.npmjs.com/package/opencode-byterover"><img src="https://img.shields.io/npm/v/opencode-byterover?style=for-the-badge&logo=npm&label=npm&color=cb3837" alt="npm version" /></a>
    <br/>
    <br/>
</div>

## Overview

`opencode-byterover` is an OpenCode plugin that connects OpenCode sessions to ByteRover through `@byterover/brv-bridge`.

The plugin persists useful session context when sessions become idle or compact, then recalls relevant context during system prompt transformation.

## Configuration

The plugin accepts these optional settings:

- `enabled`: enable or disable the plugin without removing it from config. Defaults to `true`.
- `brvPath`: custom ByteRover CLI path. Defaults to `brv` (assuming it's in the system `PATH`).
- `searchTimeoutMs`: ByteRover search timeout in milliseconds. Defaults to `15000`.
- `recallTimeoutMs`: ByteRover recall timeout in milliseconds. Defaults to `15000`.
- `persistTimeoutMs`: ByteRover persist timeout in milliseconds. Defaults to `15000`.
- `quiet`: suppress toast notifications for ByteRover operations. Defaults to `false`.
- `autoRecall`: automatically recall and inject ByteRover context into prompts. Defaults to `true`.
- `autoPersist`: automatically curate session turns into ByteRover. Defaults to `true`.
- `contextTagName`: XML-style tag name used for injected recall context. Defaults to `byterover-context`.
- `recallPrompt`: custom instruction text used before the recent conversation sent to ByteRover recall.
- `persistPrompt`: custom instruction text used before the conversation turn sent to ByteRover curation.
- `maxRecallTurns`: maximum recent user turns used to resolve recall context. Defaults to `3`.
- `maxRecallChars`: maximum recent conversation characters used for recall. Defaults to `4096`.

### Example

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    [
      "opencode-byterover",
      {
        "enabled": true,
        "brvPath": "brv",
        "searchTimeoutMs": 15000,
        "recallTimeoutMs": 15000,
        "persistTimeoutMs": 15000,
        "autoRecall": true,
        "autoPersist": true,
        "contextTagName": "byterover-context",
        "recallPrompt": "Recall relevant project context for the latest user request.",
        "persistPrompt": "Curate durable facts, decisions, preferences, and technical details.",
        "maxRecallTurns": 3,
        "maxRecallChars": 4096
      }
    ]
  ]
}
```

## Development

```bash
pnpm install
pnpm format:check
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

## Releases

This package uses Changesets and GitHub Actions for releases.

Create a release note for user-facing changes:

```bash
pnpm changeset
```

Merging the generated release PR publishes the package to npm through trusted publishing.
