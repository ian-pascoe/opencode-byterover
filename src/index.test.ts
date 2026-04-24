import type { PluginInput } from "@opencode-ai/plugin";
import type { Message, Part } from "@opencode-ai/sdk";
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

const createPlugin = async (messages: Array<SessionMessage>, options?: Record<string, unknown>) => {
  const client = {
    app: { log: vi.fn(async () => undefined) },
    session: { messages: vi.fn(async () => ({ data: messages })) },
  };

  const hooks = await ByteroverPlugin(
    {
      client,
      directory: "/repo",
    } as unknown as PluginInput,
    options,
  );

  return { client, hooks, bridge: bridgeInstances[bridgeInstances.length - 1] };
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
