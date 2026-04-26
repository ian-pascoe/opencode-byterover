import type { Plugin } from "@opencode-ai/plugin";
import { BrvBridge } from "@byterover/brv-bridge";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  brvGitignore,
  brvGitignoreBeginMarker,
  brvGitignoreEndMarker,
  brvGitignoreRules,
  ConfigSchema,
  maxCuratedTurnCacheSize,
} from "./config.js";
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

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const managedGitignoreRules = new Set(
  brvGitignoreRules.split("\n").filter((line) => line.length > 0 && !line.startsWith("#")),
);

const managedGitignoreBlock = new RegExp(
  `(?:^|\\r?\\n)${escapeRegExp(brvGitignoreBeginMarker)}[\\s\\S]*?${escapeRegExp(
    brvGitignoreEndMarker,
  )}\\r?\\n?`,
  "gu",
);

const normalizeBrvGitignore = (existing: string) => {
  const output: Array<string> = [];
  let insertedManagedBlock = false;
  let skippingManagedBlock = false;

  const insertManagedBlock = () => {
    if (insertedManagedBlock) return;
    if (output.length > 0 && output[output.length - 1] !== "") output.push("");
    output.push(...brvGitignore.trimEnd().split("\n"));
    insertedManagedBlock = true;
  };

  for (const line of existing
    .replace(managedGitignoreBlock, `\n${brvGitignore}\n`)
    .split(/\r?\n/)) {
    if (line === brvGitignoreBeginMarker) {
      insertManagedBlock();
      skippingManagedBlock = true;
      continue;
    }
    if (skippingManagedBlock) {
      if (line === brvGitignoreEndMarker) skippingManagedBlock = false;
      continue;
    }
    if (line === "# ByteRover generated files" || managedGitignoreRules.has(line)) {
      insertManagedBlock();
      continue;
    }
    output.push(line);
  }

  while (output.length > 0 && output[output.length - 1] === "") output.pop();
  if (!insertedManagedBlock) insertManagedBlock();

  return `${output.join("\n")}\n`;
};

const ensureBrvGitignore = async (cwd: string) => {
  await access(cwd);
  await mkdir(join(cwd, ".brv"), { recursive: true });

  const gitignorePath = join(cwd, ".brv", ".gitignore");

  try {
    const existing = await readFile(gitignorePath, "utf8");
    const normalized = normalizeBrvGitignore(existing);
    if (existing === normalized) return;
    await writeFile(gitignorePath, normalized, "utf8");
  } catch (error) {
    if (!hasCode(error, "ENOENT")) throw error;
    await writeFile(gitignorePath, brvGitignore, "utf8");
  }
};

export const ByteroverPlugin: Plugin = async ({ client, directory: cwd }, options) => {
  const curatedTurns = new LruCache<string, string>(maxCuratedTurnCacheSize);
  const inFlightCurations = new Map<string, { key: string; promise: Promise<void> }>();

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
    await ensureBrvGitignore(cwd);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    toastBrv("warning", "Failed to initialize ByteRover storage, some features may not work");
    logBrv("warn", `Failed to bootstrap .brv/.gitignore: ${message}`);
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
    const inFlightCuration = inFlightCurations.get(sessionID);
    if (inFlightCuration?.key === key) {
      logBrv("debug", `Skipping in-flight ByteRover curation for session ${sessionID}`);
      await inFlightCuration.promise;
      return;
    }

    const formattedMessages = formatMessages(messagesInTurn);
    if (formattedMessages.length === 0) return;

    const persistCuration = async () => {
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

    const curationPromise = persistCuration();
    inFlightCurations.set(sessionID, { key, promise: curationPromise });
    try {
      await curationPromise;
    } finally {
      if (inFlightCurations.get(sessionID)?.promise === curationPromise) {
        inFlightCurations.delete(sessionID);
      }
    }
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
