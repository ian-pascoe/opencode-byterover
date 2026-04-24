import type { Plugin } from "@opencode-ai/plugin";
import type { Message, Part } from "@opencode-ai/sdk";
import { BrvBridge } from "@byterover/brv-bridge";
import * as z from "zod/v4";

const defaults = {
  brvPath: "brv",
  searchTimeoutMs: 10_000,
  recallTimeoutMs: 10_000,
  persistTimeoutMs: 10_000,
  maxRecallTurns: 3,
  maxRecallChars: 4096,
};

const Config = z
  .object({
    // BrvBridge options
    brvPath: z.string().optional().default(defaults.brvPath),
    searchTimeoutMs: z.number().default(defaults.searchTimeoutMs),
    recallTimeoutMs: z.number().default(defaults.recallTimeoutMs),
    persistTimeoutMs: z.number().default(defaults.persistTimeoutMs),
    // Plugin options
    maxRecallTurns: z.number().default(defaults.maxRecallTurns),
    maxRecallChars: z.number().default(defaults.maxRecallChars),
  })
  .optional()
  .default(defaults);
type Config = z.infer<typeof Config>;

type SessionMessage = { info: Message; parts: Array<Part> };

const state = {
  curatedTurns: new Map<string, string>(),
};

export const ByteroverPlugin: Plugin = async ({ client, directory: cwd }, options) => {
  const logBrv = (level: "debug" | "info" | "warn" | "error", message: string) => {
    client.app.log({
      body: {
        service: "byterover",
        level,
        message,
      },
    });
  };

  const configParseResult = Config.safeParse(options);
  if (!configParseResult.success) {
    logBrv(
      "error",
      `Invalid Byterover plugin configuration: ${JSON.stringify(configParseResult.error)}`,
    );
    return {};
  }

  const config = configParseResult.data;

  const brvBridge = new BrvBridge({
    brvPath: config.brvPath ?? "brv",
    searchTimeoutMs: config.searchTimeoutMs,
    recallTimeoutMs: config.recallTimeoutMs,
    persistTimeoutMs: config.persistTimeoutMs,
    cwd,
    logger: {
      debug: (message) => logBrv("debug", message),
      info: (message) => logBrv("info", message),
      warn: (message) => logBrv("warn", message),
      error: (message) => logBrv("error", message),
    },
  });

  const fetchSessionMessages = async (sessionID: string): Promise<Array<SessionMessage>> => {
    const messagesResponse = await client.session.messages({
      path: { id: sessionID },
    });
    if (messagesResponse.error) {
      logBrv(
        "error",
        `Failed to fetch messages for session ${sessionID}: ${JSON.stringify(messagesResponse.error.data)}`,
      );
      return [];
    }
    return messagesResponse.data;
  };

  const fetchMessagesInTurn = async (sessionID: string) => {
    const messages = await fetchSessionMessages(sessionID);
    const messagesInTurn: Array<SessionMessage> = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]!;
      messagesInTurn.unshift(message);
      if (message.info.role === "user") break;
    }
    return messagesInTurn;
  };

  const formatMessage = (message: SessionMessage) => {
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text.trim())
      .filter(Boolean)
      .join("\n");
    if (!text) return "";
    return `[${message.info.role}]: ${text}`;
  };

  const formatMessages = (messages: Array<SessionMessage>) => {
    return messages.map(formatMessage).filter(Boolean).join("\n\n");
  };

  const turnKey = (messages: Array<SessionMessage>) => {
    return messages.map((message) => message.info.id).join(":");
  };

  const fetchMessagesForRecall = async (sessionID: string) => {
    const messages = await fetchSessionMessages(sessionID);
    const selected: typeof messages = [];
    let userTurns = 0;
    let charCount = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]!;
      const formatted = formatMessage(message);
      if (!formatted) continue;

      const separatorLength = selected.length === 0 ? 0 : 2;
      const nextCharCount = charCount + separatorLength + formatted.length;
      if (selected.length > 0 && nextCharCount > config.maxRecallChars) break;

      selected.unshift(message);
      charCount = nextCharCount;

      if (message.info.role === "user") {
        userTurns++;
        if (userTurns >= config.maxRecallTurns) break;
      }
    }

    return selected;
  };

  const curateTurn = async (sessionID: string) => {
    const messagesInTurn = await fetchMessagesInTurn(sessionID);
    if (messagesInTurn.length === 0) return;

    const key = turnKey(messagesInTurn);
    if (state.curatedTurns.get(sessionID) === key) {
      logBrv("debug", `Skipping duplicate ByteRover curation for session ${sessionID}`);
      return;
    }

    const formattedMessages = formatMessages(messagesInTurn);
    if (formattedMessages.length === 0) return;

    const brvResult = await brvBridge.persist(
      `The following is a conversation between a user and an AI assistant.\n` +
        `Curate only information with lasting value: facts, decisions, technical details, preferences, or notable outcomes.\n` +
        `Skip trivial messages such as greetings, acknowledgments ("ok", "thanks", "sure", "got it"), one-word replies, anything with no substantive content.\n\n` +
        `Conversation:\n\n---\n${formattedMessages}`,
      { cwd },
    );
    if (brvResult.status === "error") {
      logBrv("error", `Byterover process failed for session ${sessionID}: ${brvResult.message}`);
      return;
    }

    state.curatedTurns.set(sessionID, key);
  };

  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const sessionID = event.properties.sessionID;
        await curateTurn(sessionID);
      }
    },
    "experimental.session.compacting": async ({ sessionID }) => {
      await curateTurn(sessionID);
    },
    "experimental.chat.system.transform": async ({ sessionID }, { system }) => {
      if (!sessionID) return;

      const isReady = await brvBridge.ready();
      if (!isReady) {
        logBrv("warn", "Byterover bridge not ready, skipping recall");
        return;
      }

      const messagesForRecall = await fetchMessagesForRecall(sessionID);
      if (messagesForRecall.length === 0) return;

      const formattedMessages = formatMessages(messagesForRecall);
      if (formattedMessages.length === 0) return;

      logBrv(
        "debug",
        `ByteRover recall using ${messagesForRecall.length} messages / ${formattedMessages.length} chars`,
      );

      try {
        const brvResult = await brvBridge.recall(
          `Recall any relevant context that would help answer the latest user message.\n` +
            `Use the recent conversation only to resolve references and intent.\n` +
            `Do not restate the query in your findings.\n\n` +
            `Recent conversation:\n\n---\n${formattedMessages}`,
          { cwd },
        );
        const content = brvResult.content.trim();
        if (content.length === 0) return;

        system.push(`<byterover-context>\n${content}\n</byterover-context>`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logBrv("error", `Byterover recall failed for session ${sessionID}: ${message}`);
      }
    },
  };
};
