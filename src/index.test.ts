import type { PluginInput } from "@opencode-ai/plugin";
import type { Message, Part } from "@opencode-ai/sdk";
import type { ToolContext } from "@opencode-ai/plugin";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ByteroverPlugin } from "./index.js";

type SessionMessage = { info: Message; parts: Array<Part> };

const execFileAsync = promisify(execFile);

const countOccurrences = (value: string, search: string) => value.split(search).length - 1;

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const bridgeInstances = vi.hoisted(
  () =>
    [] as Array<{
      config: Record<string, unknown>;
      ready: ReturnType<typeof vi.fn>;
      recall: ReturnType<typeof vi.fn>;
      search: ReturnType<typeof vi.fn>;
      persist: ReturnType<typeof vi.fn>;
    }>,
);

vi.mock("@byterover/brv-bridge", () => {
  class MockBrvBridge {
    config: Record<string, unknown>;
    ready = vi.fn(async () => true);
    recall = vi.fn(async () => ({ content: "remembered context" }));
    search = vi.fn(async () => ({ results: [], totalFound: 0, message: "No matches" }));
    persist = vi.fn(async () => ({ status: "completed", message: "ok" }));

    constructor(config: Record<string, unknown>) {
      this.config = config;
      bridgeInstances.push(this);
    }
  }

  return { BrvBridge: vi.fn(MockBrvBridge) };
});

const textPart = (text: string) => ({ type: "text", text }) as Part;

const message = (id: string, role: "user" | "assistant", text: string): SessionMessage => ({
  info: { id, role } as Message,
  parts: [textPart(text)],
});

const toolContext = (overrides: Partial<ToolContext> = {}) =>
  ({
    sessionID: "tool-session",
    messageID: "tool-message",
    agent: "build",
    directory: "/repo",
    worktree: "/repo",
    abort: new AbortController().signal,
    metadata: vi.fn(),
    ask: vi.fn(),
    ...overrides,
  }) as unknown as ToolContext;

const createPlugin = async (
  messages: Array<SessionMessage>,
  options?: Record<string, unknown>,
  directory = "/repo",
) => {
  const client = {
    app: { log: vi.fn(async () => undefined) },
    session: { messages: vi.fn(async () => ({ data: messages })) },
    tui: { showToast: vi.fn(async () => undefined) },
  };

  const hooks = await ByteroverPlugin(
    {
      client,
      directory,
    } as unknown as PluginInput,
    options,
  );

  return { client, hooks, bridge: bridgeInstances[bridgeInstances.length - 1] };
};

const withTempDirectory = async (run: (directory: string) => Promise<void>) => {
  const directory = await mkdtemp(join(tmpdir(), "opencode-byterover-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

describe("ByteroverPlugin", () => {
  beforeEach(() => {
    bridgeInstances.length = 0;
    vi.clearAllMocks();
  });

  test("passes ByteRover configuration into the bridge", async () => {
    const { bridge } = await createPlugin([], {
      brvPath: "/custom/brv",
      searchTimeoutMs: 1_000,
      recallTimeoutMs: 2_000,
      persistTimeoutMs: 3_000,
    });

    expect(bridge?.config).toMatchObject({
      brvPath: "/custom/brv",
      cwd: "/repo",
      searchTimeoutMs: 1_000,
      recallTimeoutMs: 2_000,
      persistTimeoutMs: 3_000,
    });
  });

  test("uses a longer default persist timeout", async () => {
    const { bridge } = await createPlugin([]);

    expect(bridge?.config).toMatchObject({
      searchTimeoutMs: 30_000,
      recallTimeoutMs: 30_000,
      persistTimeoutMs: 60_000,
    });
  });

  test("returns no hooks or bridge when disabled", async () => {
    const { hooks } = await createPlugin([], { enabled: false });

    expect(hooks).toEqual({});
    expect(bridgeInstances).toHaveLength(0);
  });

  test("registers manual ByteRover tools by default", async () => {
    const { hooks } = await createPlugin([]);

    expect(Object.keys(hooks.tool ?? {}).sort()).toEqual([
      "brv_persist",
      "brv_recall",
      "brv_search",
    ]);
  });

  test("omits manual ByteRover tools when manualTools is disabled", async () => {
    const { hooks } = await createPlugin([], { manualTools: false });

    expect(hooks.tool).toBeUndefined();
  });

  test("bootstraps the ByteRover gitignore during setup", async () => {
    await withTempDirectory(async (directory) => {
      await createPlugin([], undefined, directory);

      const gitignore = await readFile(join(directory, ".brv", ".gitignore"), "utf8");
      expect(gitignore).toContain("# Dream state and logs");
      expect(gitignore).toContain("# BEGIN opencode-byterover");
      expect(gitignore).toContain("# END opencode-byterover");
      expect(gitignore).toContain("dream-log/");
      expect(gitignore).toContain("review-backups/");
      expect(gitignore).toContain("*.overview.md");
    });
  });

  test("preserves existing ByteRover gitignore rules while adding generated state ignores", async () => {
    await withTempDirectory(async (directory) => {
      const existing = "custom-rule\n\n# ByteRover generated files\nconfig.json\n*.overview.md\n";
      await execFileAsync("git", ["init"], { cwd: directory });
      await mkdir(join(directory, ".brv"));
      await writeFile(join(directory, ".brv", ".gitignore"), existing, "utf8");

      await createPlugin([], undefined, directory);
      await writeFile(join(directory, ".brv", "config.json"), "{}\n", "utf8");

      const gitignore = await readFile(join(directory, ".brv", ".gitignore"), "utf8");
      expect(gitignore).toContain("custom-rule");
      expect(gitignore).toContain("# BEGIN opencode-byterover");
      expect(gitignore).toContain("# END opencode-byterover");
      expect(gitignore).not.toContain("# ByteRover generated files");
      expect(countOccurrences(gitignore, "config.json")).toBe(1);
      expect(countOccurrences(gitignore, "*.overview.md")).toBe(1);
      await expect(
        execFileAsync("git", ["check-ignore", ".brv/config.json"], {
          cwd: directory,
        }),
      ).resolves.toBeDefined();
    });
  });

  test("preserves custom gitignore overrides after managed ByteRover rules", async () => {
    await withTempDirectory(async (directory) => {
      await execFileAsync("git", ["init"], { cwd: directory });
      await mkdir(join(directory, ".brv"));
      await writeFile(
        join(directory, ".brv", ".gitignore"),
        "custom-before\nconfig.json\n!config.json\ncustom-after\n",
        "utf8",
      );

      await createPlugin([], undefined, directory);
      await writeFile(join(directory, ".brv", "config.json"), "{}\n", "utf8");

      const gitignore = await readFile(join(directory, ".brv", ".gitignore"), "utf8");
      expect(gitignore.indexOf("custom-before")).toBeLessThan(
        gitignore.indexOf("# BEGIN opencode-byterover"),
      );
      expect(gitignore.indexOf("!config.json")).toBeGreaterThan(
        gitignore.indexOf("# END opencode-byterover"),
      );
      expect(gitignore.indexOf("custom-after")).toBeGreaterThan(gitignore.indexOf("!config.json"));
      await expect(
        execFileAsync("git", ["check-ignore", ".brv/config.json"], {
          cwd: directory,
        }),
      ).rejects.toMatchObject({ code: 1 });
    });
  });

  test("does not ignore ByteRover context tree source files", async () => {
    await withTempDirectory(async (directory) => {
      await execFileAsync("git", ["init"], { cwd: directory });
      await createPlugin([], undefined, directory);
      await mkdir(join(directory, ".brv", "context-tree", "facts"), { recursive: true });
      await writeFile(
        join(directory, ".brv", "context-tree", "facts", "generated.md"),
        "# Generated\n",
        "utf8",
      );

      await expect(
        execFileAsync("git", ["check-ignore", ".brv/context-tree/facts/generated.md"], {
          cwd: directory,
        }),
      ).rejects.toMatchObject({ code: 1 });
    });
  });

  test("recalls and injects returned context", async () => {
    const { bridge, hooks } = await createPlugin([message("u3", "user", "latest question")]);
    const system: Array<string> = [];
    const transform = hooks["experimental.chat.system.transform"];

    expect(transform).toBeDefined();
    await transform!({ sessionID: "recall-session", model: {} as never }, { system });

    expect(bridge?.recall).toHaveBeenCalledTimes(1);
    const query = bridge?.recall.mock.calls[0]?.[0] as string;
    expect(query).toContain("[user]: latest question");
    expect(system).toEqual(["<byterover-context>\nremembered context\n</byterover-context>"]);
  });

  test("skips recall injection when autoRecall is disabled", async () => {
    const { bridge, hooks } = await createPlugin([message("u8", "user", "latest question")], {
      autoRecall: false,
    });
    const system: Array<string> = [];
    const transform = hooks["experimental.chat.system.transform"];

    expect(transform).toBeDefined();
    await transform!({ sessionID: "recall-session", model: {} as never }, { system });

    expect(bridge?.recall).not.toHaveBeenCalled();
    expect(system).toEqual([]);
  });

  test("uses a custom recall prompt before the recent conversation block", async () => {
    const { bridge, hooks } = await createPlugin([message("u6", "user", "custom recall target")], {
      recallPrompt: "Find durable project context only.",
    });
    const system: Array<string> = [];
    const transform = hooks["experimental.chat.system.transform"];

    expect(transform).toBeDefined();
    await transform!({ sessionID: "recall-session", model: {} as never }, { system });

    const query = bridge?.recall.mock.calls[0]?.[0] as string;
    expect(query).toBe(
      "Find durable project context only.\n\n" +
        "Recent conversation:\n\n---\n[user]: custom recall target",
    );
  });

  test("manual recall passes raw query and returns cleaned context", async () => {
    const { bridge, hooks } = await createPlugin([]);
    bridge?.recall.mockResolvedValue({
      content: '**Summary**: useful context for "manual query": details',
    });
    const abort = new AbortController();

    const result = await hooks.tool!.brv_recall!.execute(
      { query: "manual query" },
      toolContext({ directory: "/workspace", abort: abort.signal }),
    );

    expect(bridge?.recall).toHaveBeenCalledWith("manual query", {
      cwd: "/workspace",
      signal: abort.signal,
    });
    expect(result).toBe("**Summary**: useful context: details");
  });

  test("manual recall reports when ByteRover is not ready", async () => {
    const { bridge, hooks } = await createPlugin([]);
    bridge?.ready.mockResolvedValue(false);

    const result = await hooks.tool!.brv_recall!.execute({ query: "manual query" }, toolContext());

    expect(bridge?.recall).not.toHaveBeenCalled();
    expect(result).toBe("ByteRover bridge is not ready.");
  });

  test("manual recall can override the recall timeout", async () => {
    const { hooks } = await createPlugin([]);

    const result = await hooks.tool!.brv_recall!.execute(
      { query: "manual query", timeoutMs: 45_000 },
      toolContext({ directory: "/workspace" }),
    );
    const overrideBridge = bridgeInstances[bridgeInstances.length - 1];

    expect(overrideBridge?.config).toMatchObject({
      cwd: "/workspace",
      recallTimeoutMs: 45_000,
    });
    expect(overrideBridge?.recall).toHaveBeenCalledWith("manual query", {
      cwd: "/workspace",
      signal: expect.any(AbortSignal),
    });
    expect(result).toBe("remembered context");
  });

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

    const result = await hooks.tool!.brv_search!.execute(
      { query: "manual tools", limit: 5, scope: "architecture" },
      toolContext({ directory: "/workspace" }),
    );

    expect(bridge?.search).toHaveBeenCalledWith("manual tools", {
      cwd: "/workspace",
      limit: 5,
      scope: "architecture",
    });
    expect(result).toContain("Found 1 ByteRover result");
    expect(result).toContain("architecture/plugin-tools.md");
    expect(result).toContain("score: 0.92");
    expect(result).toContain("related: architecture/hooks.md");
  });

  test("manual search can override the search timeout", async () => {
    const { hooks } = await createPlugin([]);

    const result = await hooks.tool!.brv_search!.execute(
      { query: "manual tools", timeoutMs: 45_000 },
      toolContext({ directory: "/workspace" }),
    );
    const overrideBridge = bridgeInstances[bridgeInstances.length - 1];

    expect(overrideBridge?.config).toMatchObject({
      cwd: "/workspace",
      searchTimeoutMs: 45_000,
    });
    expect(overrideBridge?.search).toHaveBeenCalledWith("manual tools", {
      cwd: "/workspace",
    });
    expect(result).toBe("No matches");
  });

  test("manual persist stores raw memory text without curation prompt", async () => {
    const { bridge, hooks } = await createPlugin([]);

    const result = await hooks.tool!.brv_persist!.execute(
      { context: "Use pnpm for this repository." },
      toolContext({ directory: "/workspace" }),
    );

    expect(bridge?.persist).toHaveBeenCalledWith("Use pnpm for this repository.", {
      cwd: "/workspace",
      detach: true,
    });
    expect(bridge?.persist.mock.calls[0]?.[0]).not.toContain("Conversation:");
    expect(result).toBe("ByteRover persist completed: ok");
  });

  test("manual persist can override the persist timeout", async () => {
    const { hooks } = await createPlugin([]);

    const result = await hooks.tool!.brv_persist!.execute(
      { context: "Remember the release checklist.", timeoutMs: 120_000 },
      toolContext({ directory: "/workspace" }),
    );
    const overrideBridge = bridgeInstances[bridgeInstances.length - 1];

    expect(overrideBridge?.config).toMatchObject({
      cwd: "/workspace",
      persistTimeoutMs: 120_000,
    });
    expect(overrideBridge?.persist).toHaveBeenCalledWith("Remember the release checklist.", {
      cwd: "/workspace",
      detach: true,
    });
    expect(result).toBe("ByteRover persist completed: ok");
  });

  test("curates an idle turn once per unchanged session turn", async () => {
    const { bridge, hooks } = await createPlugin([
      message("u4", "user", "persist this decision"),
      message("a4", "assistant", "decision persisted"),
    ]);
    const event = hooks.event;

    expect(event).toBeDefined();
    await event!({
      event: { type: "session.idle", properties: { sessionID: "curation-session" } } as never,
    });
    await event!({
      event: { type: "session.idle", properties: { sessionID: "curation-session" } } as never,
    });

    expect(bridge?.persist).toHaveBeenCalledTimes(1);
    expect(bridge?.persist.mock.calls[0]?.[0]).toContain("[user]: persist this decision");
  });

  test("deduplicates concurrent curation for the same session turn", async () => {
    const { bridge, hooks } = await createPlugin([
      message("u4", "user", "persist this decision"),
      message("a4", "assistant", "decision persisted"),
    ]);
    const event = hooks.event;
    const compacting = hooks["experimental.session.compacting"];
    const pendingPersist = deferred<{ status: "completed"; message: string }>();
    bridge?.persist.mockReturnValue(pendingPersist.promise);

    expect(event).toBeDefined();
    expect(compacting).toBeDefined();
    const idlePromise = event!({
      event: { type: "session.idle", properties: { sessionID: "curation-session" } } as never,
    });
    let compactingResolved = false;
    const compactingPromise = compacting!({ sessionID: "curation-session" }, { context: [] }).then(
      () => {
        compactingResolved = true;
      },
    );

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(bridge?.persist).toHaveBeenCalledTimes(1);
    expect(compactingResolved).toBe(false);

    pendingPersist.resolve({ status: "completed", message: "ok" });
    await Promise.all([idlePromise, compactingPromise]);
    expect(bridge?.persist).toHaveBeenCalledTimes(1);
    expect(compactingResolved).toBe(true);
  });

  test("keeps newer in-flight curation marked when an older turn finishes first", async () => {
    const messages = [message("u4", "user", "first decision")];
    const { bridge, hooks } = await createPlugin(messages);
    const event = hooks.event;
    const compacting = hooks["experimental.session.compacting"];
    const firstPersist = deferred<{ status: "completed"; message: string }>();
    const secondPersist = deferred<{ status: "completed"; message: string }>();
    bridge?.persist
      .mockReturnValueOnce(firstPersist.promise)
      .mockReturnValueOnce(secondPersist.promise)
      .mockResolvedValue({ status: "completed", message: "ok" });

    expect(event).toBeDefined();
    expect(compacting).toBeDefined();
    const firstPromise = event!({
      event: { type: "session.idle", properties: { sessionID: "curation-session" } } as never,
    });
    await Promise.resolve();
    await Promise.resolve();

    messages.splice(0, messages.length, message("u5", "user", "second decision"));
    const secondPromise = event!({
      event: { type: "session.idle", properties: { sessionID: "curation-session" } } as never,
    });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(bridge?.persist).toHaveBeenCalledTimes(2);

    firstPersist.resolve({ status: "completed", message: "ok" });
    await firstPromise;
    const duplicateSecondPromise = compacting!({ sessionID: "curation-session" }, { context: [] });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(bridge?.persist).toHaveBeenCalledTimes(2);

    secondPersist.resolve({ status: "completed", message: "ok" });
    await Promise.all([secondPromise, duplicateSecondPromise]);
  });

  test("skips curation when autoPersist is disabled", async () => {
    const { bridge, hooks } = await createPlugin([message("u10", "user", "do not persist")], {
      autoPersist: false,
    });
    const event = hooks.event;
    const compacting = hooks["experimental.session.compacting"];

    expect(event).toBeDefined();
    expect(compacting).toBeDefined();
    await event!({
      event: { type: "session.idle", properties: { sessionID: "no-persist-session" } } as never,
    });
    await compacting!({ sessionID: "no-persist-session" }, { context: [] });

    expect(bridge?.persist).not.toHaveBeenCalled();
  });

  test("uses a custom persist prompt before the conversation block", async () => {
    const { bridge, hooks } = await createPlugin([message("u7", "user", "custom persist target")], {
      persistPrompt: "Store only architectural decisions.",
    });
    const event = hooks.event;

    expect(event).toBeDefined();
    await event!({
      event: { type: "session.idle", properties: { sessionID: "custom-persist-session" } } as never,
    });

    expect(bridge?.persist.mock.calls[0]?.[0]).toBe(
      "Store only architectural decisions.\n\n" +
        "Conversation:\n\n---\n[user]: custom persist target",
    );
  });

  test("logs configuration errors without creating hooks or a bridge", async () => {
    const { client, hooks } = await createPlugin([], { recallTimeoutMs: "slow" });

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

  test.each([
    ["empty brvPath", { brvPath: "" }],
    ["blank recallPrompt", { recallPrompt: "   " }],
    ["blank persistPrompt", { persistPrompt: "   " }],
    ["non-positive maxRecallTurns", { maxRecallTurns: 0 }],
    ["fractional maxRecallChars", { maxRecallChars: 10.5 }],
    ["negative persistTimeoutMs", { persistTimeoutMs: -1 }],
    ["non-boolean manualTools", { manualTools: "yes" }],
    ["unsafe contextTagName", { contextTagName: "bad tag" }],
  ])("rejects invalid configuration: %s", async (_name, options) => {
    const { client, hooks } = await createPlugin([], options);

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
});
