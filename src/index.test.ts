import type { PluginInput } from "@opencode-ai/plugin";
import type { Message, Part } from "@opencode-ai/sdk";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ByteroverPlugin } from "./index.js";

type SessionMessage = { info: Message; parts: Array<Part> };

const bridgeInstances = vi.hoisted(
  () =>
    [] as Array<{
      config: Record<string, unknown>;
      ready: ReturnType<typeof vi.fn>;
      recall: ReturnType<typeof vi.fn>;
      persist: ReturnType<typeof vi.fn>;
    }>,
);

vi.mock("@byterover/brv-bridge", () => {
  class MockBrvBridge {
    config: Record<string, unknown>;
    ready = vi.fn(async () => true);
    recall = vi.fn(async () => ({ content: "remembered context" }));
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

  test("returns no hooks or bridge when disabled", async () => {
    const { hooks } = await createPlugin([], { enabled: false });

    expect(hooks).toEqual({});
    expect(bridgeInstances).toHaveLength(0);
  });

  test("bootstraps the ByteRover gitignore during setup", async () => {
    await withTempDirectory(async (directory) => {
      await createPlugin([], undefined, directory);

      const gitignore = await readFile(join(directory, ".brv", ".gitignore"), "utf8");
      expect(gitignore).toContain("# Dream state and logs");
      expect(gitignore).toContain("dream-log/");
      expect(gitignore).toContain("review-backups/");
      expect(gitignore).toContain("*.overview.md");
    });
  });

  test("does not overwrite an existing ByteRover gitignore", async () => {
    await withTempDirectory(async (directory) => {
      const existing = "custom-rule\n";
      await mkdir(join(directory, ".brv"));
      await writeFile(join(directory, ".brv", ".gitignore"), existing, "utf8");

      await createPlugin([], undefined, directory);

      await expect(readFile(join(directory, ".brv", ".gitignore"), "utf8")).resolves.toBe(existing);
    });
  });

  test("recalls only recent substantive turns and injects returned context", async () => {
    const { bridge, hooks } = await createPlugin(
      [
        message("u1", "user", "old question"),
        message("a1", "assistant", "old answer"),
        message("u2", "user", "middle question"),
        message("a2", "assistant", "middle answer"),
        message("empty", "assistant", "   "),
        message("u3", "user", "latest question"),
      ],
      { maxRecallTurns: 2 },
    );
    const system: Array<string> = [];
    const transform = hooks["experimental.chat.system.transform"];

    expect(transform).toBeDefined();
    await transform!({ sessionID: "recall-session", model: {} as never }, { system });

    expect(bridge?.recall).toHaveBeenCalledTimes(1);
    const query = bridge?.recall.mock.calls[0]?.[0] as string;
    expect(query).toContain("[user]: middle question");
    expect(query).toContain("[assistant]: middle answer");
    expect(query).toContain("[user]: latest question");
    expect(query).not.toContain("old question");
    expect(query).not.toContain("old answer");
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

  test("uses a custom context tag name for recalled context", async () => {
    const { hooks } = await createPlugin([message("u9", "user", "latest question")], {
      contextTagName: "project-memory",
    });
    const system: Array<string> = [];
    const transform = hooks["experimental.chat.system.transform"];

    expect(transform).toBeDefined();
    await transform!({ sessionID: "recall-session", model: {} as never }, { system });

    expect(system).toEqual(["<project-memory>\nremembered context\n</project-memory>"]);
  });

  test("strips echoed recall query from ByteRover summary before injecting context", async () => {
    const { bridge, hooks } = await createPlugin([message("u5", "user", "latest question")]);
    bridge?.recall.mockImplementation(async (query: string) => ({
      content:
        `**Summary**: Found 1 relevant topic for "${query}":\n\n` +
        `**Details**:\n\n### useful_context\n\nKeep this recalled context.`,
    }));
    const system: Array<string> = [];
    const transform = hooks["experimental.chat.system.transform"];

    expect(transform).toBeDefined();
    await transform!({ sessionID: "recall-session", model: {} as never }, { system });

    expect(system).toHaveLength(1);
    expect(system[0]).toContain("**Summary**: Found 1 relevant topic:");
    expect(system[0]).toContain("Keep this recalled context.");
    expect(system[0]).not.toContain("Recall any relevant context");
    expect(system[0]).not.toContain("Recent conversation:");
    expect(system[0]).not.toContain("[user]: latest question");
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
});
