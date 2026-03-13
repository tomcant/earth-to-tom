import { describe, expect, test } from "bun:test";
import { type AgentMessage, type AgentTool, analyseChat, type ChatModel } from "../src/agent";
import type { Message as WhatsAppMessage } from "../src/whatsapp";

function createStubChatModel(responses: AgentMessage[]): ChatModel {
  let callIndex = 0;
  return {
    async chat() {
      return responses[callIndex++];
    },
  };
}

const SYSTEM_PROMPT = "You are an urgency detection agent.";

describe("message analysis agent", () => {
  test("calls list_messages then send_notification when urgency is detected", async () => {
    const chatModel = createStubChatModel([
      {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "list_messages",
              arguments: { chat_jid: "alice@s.whatsapp.net", after: "2026-03-12T07:00:00.000Z" },
            },
          },
        ],
      },
      {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "send_notification",
              arguments: { message: "Alice: I need help ASAP! — Reason: emergency language" },
            },
          },
        ],
      },
      {
        role: "assistant",
        content: "Analysis complete. Notification sent.",
      },
    ]);

    const listMessagesStub = async (): Promise<WhatsAppMessage[]> => [
      { chat_jid: "alice@s.whatsapp.net", content: "I need help ASAP!", is_from_me: false },
    ];

    const notifications: string[] = [];
    const sendNotificationStub = async (message: string) => {
      notifications.push(message);
    };

    const result = await analyseChat(
      SYSTEM_PROMPT,
      "test-model",
      "alice@s.whatsapp.net",
      "Alice",
      "2026-03-12T07:00:00.000Z",
      { chatModel, listMessages: listMessagesStub, sendNotification: sendNotificationStub },
    );

    expect(result.notificationSent).toBe(true);
    expect(notifications).toEqual(["Alice: I need help ASAP! — Reason: emergency language"]);
  });

  test("returns without notification when no urgency is detected", async () => {
    const chatModel = createStubChatModel([
      {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "list_messages",
              arguments: { chat_jid: "bob@s.whatsapp.net", after: "2026-03-12T07:00:00.000Z" },
            },
          },
        ],
      },
      {
        role: "assistant",
        content: "No urgent messages found.",
      },
    ]);

    const listMessagesStub = async (): Promise<WhatsAppMessage[]> => [
      { chat_jid: "bob@s.whatsapp.net", content: "See you tomorrow!", is_from_me: false },
    ];

    const notifications: string[] = [];

    const result = await analyseChat(
      SYSTEM_PROMPT,
      "test-model",
      "bob@s.whatsapp.net",
      "Bob",
      "2026-03-12T07:00:00.000Z",
      {
        chatModel,
        listMessages: listMessagesStub,
        sendNotification: async (msg) => {
          notifications.push(msg);
        },
      },
    );

    expect(result.notificationSent).toBe(false);
    expect(notifications).toHaveLength(0);
  });

  test("sends system prompt and user message to the model", async () => {
    const capturedMessages: AgentMessage[][] = [];
    const chatModel: ChatModel = {
      async chat(_model, messages, _tools) {
        capturedMessages.push([...messages]);
        return { role: "assistant", content: "No urgent messages." };
      },
    };

    await analyseChat(
      SYSTEM_PROMPT,
      "test-model",
      "alice@s.whatsapp.net",
      "Alice",
      "2026-03-12T07:00:00.000Z",
      { chatModel, listMessages: async () => [], sendNotification: async () => {} },
    );

    expect(capturedMessages[0][0]).toEqual({ role: "system", content: SYSTEM_PROMPT });
    expect(capturedMessages[0][1].role).toBe("user");
    expect(capturedMessages[0][1].content).toContain("Alice");
    expect(capturedMessages[0][1].content).toContain("alice@s.whatsapp.net");
  });

  test("passes tool definitions to the model", async () => {
    let capturedTools: AgentTool[] = [];
    const chatModel: ChatModel = {
      async chat(_model, _messages, tools) {
        capturedTools = tools;
        return { role: "assistant", content: "Done." };
      },
    };

    await analyseChat(
      SYSTEM_PROMPT,
      "test-model",
      "alice@s.whatsapp.net",
      "Alice",
      "2026-03-12T07:00:00.000Z",
      { chatModel, listMessages: async () => [], sendNotification: async () => {} },
    );

    const toolNames = capturedTools.map((t) => t.function.name);
    expect(toolNames).toContain("list_messages");
    expect(toolNames).toContain("send_notification");
  });

  test("logs a warning when turn limit is exceeded", async () => {
    const chatModel = createStubChatModel(
      Array.from({ length: 10 }, () => ({
        role: "assistant" as const,
        content: "",
        tool_calls: [
          {
            function: {
              name: "list_messages",
              arguments: { chat_jid: "x@s.whatsapp.net", after: "2026-03-12T07:00:00.000Z" },
            },
          },
        ],
      })),
    );

    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));

    try {
      await analyseChat(
        SYSTEM_PROMPT,
        "test-model",
        "x@s.whatsapp.net",
        "Infinite",
        "2026-03-12T07:00:00.000Z",
        { chatModel, listMessages: async () => [], sendNotification: async () => {} },
      );

      expect(
        logs.some(
          (l) =>
            l.startsWith("[analyser:x@s.whatsapp.net]") &&
            l.includes("exceeded") &&
            l.includes("10"),
        ),
      ).toBe(true);
    } finally {
      console.log = origLog;
    }
  });
});
