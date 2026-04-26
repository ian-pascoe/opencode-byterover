# Manual ByteRover Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add manual `brv_recall`, `brv_search`, and `brv_persist` OpenCode tools to the plugin.

**Architecture:** Register native OpenCode plugin tools from `ByteroverPlugin` using the existing `BrvBridge` instance. Keep automatic recall and persistence hooks unchanged, and gate only the manual tool registration behind a new `manualTools` config option.

**Tech Stack:** TypeScript ESM, `@opencode-ai/plugin` tool API, `@byterover/brv-bridge`, Zod v4, Vitest.

**Execution Status:** Implemented in this session. The checklist below is retained as the implementation record and review aid.

---

## File Structure

- Modify `src/config.ts` to add the `manualTools` option with a default of `true`.
- Modify `src/index.ts` to import `tool`, register the three `brv_*` tools, share readiness/error handling helpers, and format search results.
- Modify `src/index.test.ts` to extend the bridge mock with `search` and cover tool behavior.
- Modify `README.md` to document the new option and manual tools.
- Add a Changeset because the package gains user-facing tool functionality.

### Task 1: Add Failing Tests For Tool Registration And Config

**Files:**

- Modify: `src/index.test.ts`
- Modify: `src/config.ts`

- [ ] **Step 1: Add tests for default tool registration, disabling tools, and invalid config**

```ts
test("registers manual ByteRover tools by default", async () => {
  const { hooks } = await createPlugin([]);

  expect(Object.keys(hooks.tool ?? {}).sort()).toEqual(["brv_persist", "brv_recall", "brv_search"]);
});

test("omits manual ByteRover tools when manualTools is disabled", async () => {
  const { hooks } = await createPlugin([], { manualTools: false });

  expect(hooks.tool).toBeUndefined();
});

test("rejects invalid manualTools configuration", async () => {
  const { client, hooks } = await createPlugin([], { manualTools: "yes" });

  expect(hooks).toEqual({});
  expect(bridgeInstances).toHaveLength(0);
  expect(client.app.log).toHaveBeenCalledWith({
    body: expect.objectContaining({
      level: "error",
      service: "byterover",
      message: expect.stringContaining("Invalid Byterover plugin configuration"),
    }),
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test src/index.test.ts`

Expected: tests fail because `hooks.tool` is missing and `manualTools` is not validated.

- [ ] **Step 3: Add `manualTools` to config**

```ts
export const configDefaults = {
  enabled: true,
  brvPath: "brv",
  searchTimeoutMs: 15_000,
  recallTimeoutMs: 15_000,
  persistTimeoutMs: 15_000,
  quiet: false,
  autoRecall: true,
  autoPersist: true,
  manualTools: true,
  contextTagName: "byterover-context",
  // existing prompts and limits remain unchanged
};
```

```ts
manualTools: z.boolean().default(configDefaults.manualTools),
```

- [ ] **Step 4: Add minimal tool registration**

```ts
tool: config.manualTools
  ? {
      brv_recall: tool({ description: "Recall ByteRover context for a query.", args: {}, execute: async () => "" }),
      brv_search: tool({ description: "Search ByteRover memory.", args: {}, execute: async () => "" }),
      brv_persist: tool({ description: "Persist raw ByteRover memory.", args: {}, execute: async () => "" }),
    }
  : undefined,
```

- [ ] **Step 5: Run tests and verify registration passes**

Run: `pnpm test src/index.test.ts`

Expected: new registration/config tests pass, behavior tests added in later tasks still need to be written.

### Task 2: Add Manual Recall Tool Behavior

**Files:**

- Modify: `src/index.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Add failing recall behavior tests**

```ts
test("manual recall passes raw query and returns cleaned context", async () => {
  const { bridge, hooks } = await createPlugin([]);
  bridge?.recall.mockResolvedValue({
    content: '**Summary**: useful context for "manual query": details',
  });

  const result = await hooks.tool?.brv_recall.execute({ query: "manual query" }, toolContext());

  expect(bridge?.recall).toHaveBeenCalledWith("manual query", { cwd: "/repo" });
  expect(result).toBe("**Summary**: useful context: details");
});

test("manual recall reports when ByteRover is not ready", async () => {
  const { bridge, hooks } = await createPlugin([]);
  bridge?.ready.mockResolvedValue(false);

  const result = await hooks.tool?.brv_recall.execute({ query: "manual query" }, toolContext());

  expect(bridge?.recall).not.toHaveBeenCalled();
  expect(result).toBe("ByteRover bridge is not ready.");
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test src/index.test.ts -t "manual recall"`

Expected: tests fail because recall tool has no args or behavior.

- [ ] **Step 3: Implement recall tool**

Use `tool.schema.object` fields for `query`, check readiness, call `brvBridge.recall`, strip echoed query text, return fallback text when empty, and log thrown errors.

- [ ] **Step 4: Run recall tests**

Run: `pnpm test src/index.test.ts -t "manual recall"`

Expected: PASS.

### Task 3: Add Manual Search Tool Behavior

**Files:**

- Modify: `src/index.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Extend bridge mock with `search` and add failing search test**

```ts
search = vi.fn(async () => ({ results: [], totalFound: 0, message: "No matches" }));
```

```ts
test("manual search passes options and formats ranked results", async () => {
  const { bridge, hooks } = await createPlugin([]);
  bridge?.search.mockResolvedValue({
    totalFound: 1,
    message: "Found 1 match",
    results: [
      {
        path: "architecture/plugin-tools.md",
        title: "Plugin tools",
        excerpt: "Manual tools expose ByteRover memory.",
        score: 0.92,
        symbolKind: "topic",
        backlinkCount: 3,
        relatedPaths: ["architecture/hooks.md"],
      },
    ],
  });

  const result = await hooks.tool?.brv_search.execute(
    { query: "manual tools", limit: 5, scope: "architecture" },
    toolContext(),
  );

  expect(bridge?.search).toHaveBeenCalledWith("manual tools", {
    cwd: "/repo",
    limit: 5,
    scope: "architecture",
  });
  expect(result).toContain("Found 1 ByteRover result");
  expect(result).toContain("architecture/plugin-tools.md");
  expect(result).toContain("score: 0.92");
  expect(result).toContain("related: architecture/hooks.md");
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test src/index.test.ts -t "manual search"`

Expected: tests fail because search behavior is not implemented.

- [ ] **Step 3: Implement search tool and formatter**

Add `query`, optional `limit`, optional `scope` args. Format empty results as the bridge message or `No ByteRover search results found.` Format non-empty results as a compact numbered list.

- [ ] **Step 4: Run search tests**

Run: `pnpm test src/index.test.ts -t "manual search"`

Expected: PASS.

### Task 4: Add Manual Persist Tool Behavior

**Files:**

- Modify: `src/index.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Add failing persist behavior test**

```ts
test("manual persist stores raw memory text without curation prompt", async () => {
  const { bridge, hooks } = await createPlugin([]);

  const result = await hooks.tool?.brv_persist.execute(
    { context: "Use pnpm for this repository." },
    toolContext(),
  );

  expect(bridge?.persist).toHaveBeenCalledWith("Use pnpm for this repository.", {
    cwd: "/repo",
    detach: false,
  });
  expect(bridge?.persist.mock.calls[0]?.[0]).not.toContain("Conversation:");
  expect(result).toBe("ByteRover persist completed: ok");
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test src/index.test.ts -t "manual persist"`

Expected: test fails because persist behavior is not implemented.

- [ ] **Step 3: Implement persist tool**

Add `context` arg, check readiness, call `brvBridge.persist(context, { cwd, detach: false })`, and return status text.

- [ ] **Step 4: Run persist tests**

Run: `pnpm test src/index.test.ts -t "manual persist"`

Expected: PASS.

### Task 5: Documentation, Changeset, And Full Verification

**Files:**

- Modify: `README.md`
- Create: `.changeset/<generated-name>.md`

- [ ] **Step 1: Document manual tools**

Add `manualTools` to the configuration list and JSON example. Add a `Manual Tools` section describing `brv_recall`, `brv_search`, and `brv_persist`.

- [ ] **Step 2: Add changeset**

Create a patch changeset:

```md
---
"opencode-byterover": patch
---

Add manual ByteRover recall, search, and persist tools.
```

- [ ] **Step 3: Run full checks**

Run: `pnpm format:check`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build`.

Expected: all commands pass.

## Self-Review

- Spec coverage: all approved requirements map to tasks above.
- Placeholder scan: no implementation step depends on unspecified files or unknown APIs.
- Type consistency: tool names, config option, and bridge methods match the local package type definitions.
