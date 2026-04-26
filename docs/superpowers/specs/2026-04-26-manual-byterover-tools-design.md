# Manual ByteRover Tools Design

## Goal

Add manual ByteRover recall, search, and persist tools to the OpenCode plugin so agents can explicitly query or update project memory without relying only on automatic lifecycle hooks.

## Architecture

The plugin will register three OpenCode tools through the existing plugin `tool` hook. These tools will reuse the single `BrvBridge` instance already created by `ByteroverPlugin`, so configuration, logging, timeouts, working directory handling, and ByteRover readiness behavior stay consistent with the automatic hooks.

The automatic hooks remain unchanged:

- `experimental.chat.system.transform` continues to provide automatic recall.
- `session.idle` and `experimental.session.compacting` continue to curate recent turns when `autoPersist` is enabled.

Manual tools are additive and can be disabled with a new `manualTools` boolean option.

## Tool Surface

### `brv_recall`

Inputs:

- `query`: raw query string.

Behavior:

- Check `brvBridge.ready()`.
- Call `brvBridge.recall(query, { cwd })`.
- Strip echoed query text with the existing `stripEchoedRecallQuery` helper.
- Return a concise text result.

### `brv_search`

Inputs:

- `query`: raw search string.
- `limit`: optional result limit, constrained to ByteRover's supported `1..50` range.
- `scope`: optional path prefix used to scope results.

Behavior:

- Check `brvBridge.ready()`.
- Call `brvBridge.search(query, { cwd, limit, scope })`.
- Return ranked file-level results with path, title, score, symbol kind, excerpt, backlinks, and related paths when present.

### `brv_persist`

Inputs:

- `context`: raw memory text.

Behavior:

- Check `brvBridge.ready()`.
- Call `brvBridge.persist(context, { cwd, detach: false })`.
- Return the bridge status and message. The tool must not wrap the raw text in `persistPrompt` or session transcript formatting.

## Configuration

Add `manualTools` to `ConfigSchema` with a default of `true`.

When `manualTools` is `false`, the plugin should keep automatic hooks enabled or disabled according to the existing options, but return no manual tools.

## Error Handling

Manual tools should return readable tool output for expected operational failures:

- If ByteRover is not ready, return `ByteRover bridge is not ready.` and log a warning.
- If a bridge call throws, return a failure message and log the error.
- If recall returns empty content, return `No relevant ByteRover context found.`
- If search returns no results, include the bridge message when available.
- If persist returns `error`, return the bridge error message.

This keeps agent flows non-blocking and matches the bridge's best-effort contract.

## Testing

Add Vitest coverage in `src/index.test.ts` for:

- Tool registration defaults.
- `manualTools: false` disables tools.
- `brv_recall` passes raw query and returns cleaned content.
- `brv_search` passes `query`, `limit`, `scope`, and formats result output.
- `brv_persist` passes raw memory text with `detach: false` and does not include the automatic curation prompt.
- Invalid non-boolean `manualTools` config is rejected.

## Documentation

Update `README.md` configuration docs and add a short manual tools section with examples of when to use recall, search, and persist.
