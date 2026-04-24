import type { Message, Part } from "@opencode-ai/sdk";

export type SessionMessage = { info: Message; parts: Array<Part> };

export const formatMessage = (message: SessionMessage) => {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n");
  if (!text) return "";
  return `[${message.info.role}]: ${text}`;
};

export const formatMessages = (messages: Array<SessionMessage>) => {
  return messages.map(formatMessage).filter(Boolean).join("\n\n");
};

export const turnKey = (messages: Array<SessionMessage>) => {
  return messages.map((message) => message.info.id).join(":");
};

export const selectMessagesInTurn = (messages: Array<SessionMessage>) => {
  const selected: Array<SessionMessage> = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]!;
    selected.unshift(message);
    if (message.info.role === "user") break;
  }
  return selected;
};

export const selectMessagesForRecall = (
  messages: Array<SessionMessage>,
  options: { maxRecallTurns: number; maxRecallChars: number },
) => {
  const selected: Array<SessionMessage> = [];
  let userTurns = 0;
  let charCount = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]!;
    const formatted = formatMessage(message);
    if (!formatted) continue;

    const separatorLength = selected.length === 0 ? 0 : 2;
    const nextCharCount = charCount + separatorLength + formatted.length;
    if (selected.length > 0 && nextCharCount > options.maxRecallChars) break;

    selected.unshift(message);
    charCount = nextCharCount;

    if (message.info.role === "user") {
      userTurns++;
      if (userTurns >= options.maxRecallTurns) break;
    }
  }

  return selected;
};
