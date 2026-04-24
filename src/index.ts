import type { Plugin } from "@opencode-ai/plugin";
import { BrvBridge } from "@byterover/brv-bridge";
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { brvGitignore, ConfigSchema, maxCuratedTurnCacheSize } from "./config.js";
import { LruCache } from "./lru-cache.js";
import {
  formatMessages,
  selectMessagesForRecall,
  selectMessagesInTurn,
  type SessionMessage,
  turnKey,
} from "./messages.js";
import { stripEchoedRecallQuery } from "./recall.js";

const hasCode = (error: unknown, code: string) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
};

export const ByteroverPlugin: Plugin = async ({ client, directory: cwd }, options) => {
  const curatedTurns = new LruCache<string, string>(maxCuratedTurnCacheSize);

  const logBrv = (level: "debug" | "info" | "warn" | "error", message: string) => {
    client.app.log({
      body: {
        service: "byterover",
        level,
        message,
      },
    });
  };

  const configParseResult = ConfigSchema.safeParse(options);
  if (!configParseResult.success) {
    client.tui.showToast({
      body: {
        variant: "error",
        message: "Invalid Byterover plugin configuration, see logs for details",
      },
    });
    logBrv("error", `Invalid Byterover plugin configuration: ${configParseResult.error.message}`);
    return {};
  }

  const config = configParseResult.data;
  if (!config.enabled) return {};

  const toastBrv = (variant: "success" | "info" | "warning" | "error", message: string) => {
    if (config.quiet) return;
    client.tui.showToast({
      body: {
        variant,
        message,
      },
    });
  };

  try {
    await access(cwd);
    await mkdir(join(cwd, ".brv"), { recursive: true });
    await writeFile(join(cwd, ".brv", ".gitignore"), brvGitignore, {
      encoding: "utf8",
      flag: "wx",
    });
  } catch (error) {
    if (!hasCode(error, "EEXIST")) {
      const message = error instanceof Error ? error.message : String(error);
      toastBrv("warning", "Failed to initialize ByteRover storage, some features may not work");
      logBrv("warn", `Failed to bootstrap .brv/.gitignore: ${message}`);
    }
  }

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
      toastBrv("error", "Failed to fetch session messages, see logs for details");
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
    return selectMessagesInTurn(messages);
  };

  const fetchMessagesForRecall = async (sessionID: string) => {
    const messages = await fetchSessionMessages(sessionID);
    return selectMessagesForRecall(messages, config);
  };

  const curateTurn = async (sessionID: string) => {
    if (!config.autoPersist) return;

    const messagesInTurn = await fetchMessagesInTurn(sessionID);
    if (messagesInTurn.length === 0) return;

    const key = turnKey(messagesInTurn);
    if (curatedTurns.get(sessionID) === key) {
      logBrv("debug", `Skipping duplicate ByteRover curation for session ${sessionID}`);
      return;
    }

    const formattedMessages = formatMessages(messagesInTurn);
    if (formattedMessages.length === 0) return;

    const brvResult = await brvBridge.persist(
      `${config.persistPrompt.trim()}\n\nConversation:\n\n---\n${formattedMessages}`,
      { cwd },
    );
    if (brvResult.status === "error") {
      toastBrv("error", "Failed to curate conversation turn, see logs for details");
      logBrv("error", `Byterover process failed for session ${sessionID}: ${brvResult.message}`);
      return;
    }

    curatedTurns.set(sessionID, key);
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
      if (!config.autoRecall) return;
      if (!sessionID) return;

      const isReady = await brvBridge.ready();
      if (!isReady) {
        toastBrv("warning", "ByteRover bridge not ready, skipping recall");
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
        const recallQuery = `${config.recallPrompt.trim()}\n\nRecent conversation:\n\n---\n${formattedMessages}`;
        const brvResult = await brvBridge.recall(recallQuery, { cwd });
        const content = stripEchoedRecallQuery(brvResult.content, recallQuery);
        if (content.length === 0) return;

        system.push(`<${config.contextTagName}>\n${content}\n</${config.contextTagName}>`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toastBrv("error", "Failed to recall context from ByteRover, see logs for details");
        logBrv("error", `Byterover recall failed for session ${sessionID}: ${message}`);
      }
    },
  };
};
