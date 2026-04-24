import type { Plugin } from "@opencode-ai/plugin";
import type { Message, Part } from "@opencode-ai/sdk";
import { BrvBridge } from "@byterover/brv-bridge";
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as z from "zod/v4";

const brvGitignore = `# Dream state and logs
dream-log/
dream-state.json
dream.lock

# Review backups
review-backups/

# Generated files
config.json
_queue_status.json
.snapshot.json
_manifest.json
_index.md
*.abstract.md
*.overview.md
`;

const configDefaults = {
  enabled: true,
  brvPath: "brv",
  searchTimeoutMs: 15_000,
  recallTimeoutMs: 15_000,
  persistTimeoutMs: 15_000,
  quiet: false,
  autoRecall: true,
  autoPersist: true,
  contextTagName: "byterover-context",
  recallPrompt:
    `Recall any relevant context that would help answer the latest user message.\n` +
    `Use the recent conversation only to resolve references and intent.\n` +
    `Do not restate the query in your findings.`,
  persistPrompt:
    `The following is a conversation between a user and an AI assistant.\n` +
    `Curate only information with lasting value: facts, decisions, technical details, preferences, or notable outcomes.\n` +
    `Skip trivial messages such as greetings, acknowledgments ("ok", "thanks", "sure", "got it"), one-word replies, anything with no substantive content.`,
  maxRecallTurns: 3,
  maxRecallChars: 4096,
};

const ConfigSchema = z
  .object({
    enabled: z.boolean().default(configDefaults.enabled),
    // BrvBridge options
    brvPath: z.string().optional().default(configDefaults.brvPath),
    searchTimeoutMs: z.number().default(configDefaults.searchTimeoutMs),
    recallTimeoutMs: z.number().default(configDefaults.recallTimeoutMs),
    persistTimeoutMs: z.number().default(configDefaults.persistTimeoutMs),
    // Plugin options
    quiet: z.boolean().default(configDefaults.quiet),
    autoRecall: z.boolean().default(configDefaults.autoRecall),
    autoPersist: z.boolean().default(configDefaults.autoPersist),
    contextTagName: z.string().default(configDefaults.contextTagName),
    recallPrompt: z.string().default(configDefaults.recallPrompt),
    persistPrompt: z.string().default(configDefaults.persistPrompt),
    maxRecallTurns: z.number().default(configDefaults.maxRecallTurns),
    maxRecallChars: z.number().default(configDefaults.maxRecallChars),
  })
  .optional()
  .default(configDefaults);

type SessionMessage = { info: Message; parts: Array<Part> };

const hasCode = (error: unknown, code: string) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
};

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const stripEchoedRecallQuery = (content: string, query: string) => {
  const trimmedContent = content.trim();
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) return trimmedContent;

  return trimmedContent
    .replace(
      new RegExp(
        `(\\*\\*Summary\\*\\*:[^\\n]*?)\\s+for\\s+"${escapeRegExp(trimmedQuery)}"(?=:)`,
        "u",
      ),
      "$1",
    )
    .trim();
};

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
    if (!config.autoPersist) return;

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
      `${config.persistPrompt.trim()}\n\nConversation:\n\n---\n${formattedMessages}`,
      { cwd },
    );
    if (brvResult.status === "error") {
      toastBrv("error", "Failed to curate conversation turn, see logs for details");
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
