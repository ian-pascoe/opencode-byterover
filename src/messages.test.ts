import type { Message, Part } from "@opencode-ai/sdk";
import { describe, expect, test } from "vitest";
import {
  formatMessages,
  selectMessagesForRecall,
  selectMessagesInTurn,
  type SessionMessage,
  turnKey,
} from "./messages.js";

const textPart = (text: string) => ({ type: "text", text }) as Part;

const message = (id: string, role: "user" | "assistant", text: string): SessionMessage => ({
  info: { id, role } as Message,
  parts: [textPart(text)],
});

describe("message helpers", () => {
  test("formats text message parts and skips empty messages", () => {
    expect(
      formatMessages([message("u1", "user", " question "), message("a1", "assistant", " ")]),
    ).toBe("[user]: question");
  });

  test("selects the latest turn back to the most recent user message", () => {
    const selected = selectMessagesInTurn([
      message("u1", "user", "old question"),
      message("a1", "assistant", "old answer"),
      message("u2", "user", "latest question"),
      message("a2", "assistant", "latest answer"),
    ]);

    expect(selected.map((item) => item.info.id)).toEqual(["u2", "a2"]);
    expect(turnKey(selected)).toBe("u2:a2");
  });

  test("selects recent substantive messages within turn and character limits", () => {
    const selected = selectMessagesForRecall(
      [
        message("u1", "user", "old question"),
        message("a1", "assistant", "old answer"),
        message("u2", "user", "middle question"),
        message("a2", "assistant", "middle answer"),
        message("empty", "assistant", "   "),
        message("u3", "user", "latest question"),
      ],
      { maxRecallTurns: 2, maxRecallChars: 4096 },
    );

    expect(selected.map((item) => item.info.id)).toEqual(["u2", "a2", "u3"]);
  });
});
