<div align='center'>
    <br/>
    <br/>
    <h3>opencode-byterover</h3>
    <p>ByteRover memory integration for OpenCode plugin workflows.</p>
    <br/>
    <br/>
</div>

## Overview

`opencode-byterover` is an OpenCode plugin that connects OpenCode sessions to ByteRover through `@byterover/brv-bridge`.

The plugin persists useful session context when sessions become idle or compact, then recalls relevant context during system prompt transformation.

## Configuration

The plugin accepts these optional settings:

- `brvPath`: custom ByteRover CLI path.
- `searchTimeoutMs`: ByteRover search timeout in milliseconds. Defaults to `10000`.
- `recallTimeoutMs`: ByteRover recall timeout in milliseconds. Defaults to `10000`.
- `persistTimeoutMs`: ByteRover persist timeout in milliseconds. Defaults to `10000`.
- `maxRecallTurns`: maximum recent user turns used to resolve recall context. Defaults to `3`.
- `maxRecallChars`: maximum recent conversation characters used for recall. Defaults to `4096`.

## Development

```bash
pnpm install
pnpm format:check
pnpm lint
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
