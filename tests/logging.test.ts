import { afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { chmod } from "node:fs/promises";
import { join } from "node:path";
import { type AgentMessage, analyseChat, type ChatModel } from "../src/agent";
import { sendNotification } from "../src/notifications";
import { listChats, listMessages, syncChats } from "../src/whatsapp";

const fixturesDir = join(import.meta.dir, "fixtures");

let logs: string[];
let origLog: typeof console.log;

beforeEach(() => {
  logs = [];
  origLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(" "));
});

afterEach(() => {
  console.log = origLog;
});

beforeAll(async () => {
  await chmod(join(fixturesDir, "whatsapp-cli-sync-success.sh"), 0o755);
  await chmod(join(fixturesDir, "whatsapp-cli-chats-success.sh"), 0o755);
  await chmod(join(fixturesDir, "whatsapp-cli-messages-success.sh"), 0o755);
});

describe("whatsapp logging", () => {
  test("sync logs with [whatsapp] prefix", async () => {
    await syncChats(join(fixturesDir, "whatsapp-cli-sync-success.sh"));

    expect(logs.some((l) => l.startsWith("[whatsapp]") && l.includes("sync"))).toBe(true);
  });

  test("list chats logs with [whatsapp] prefix", async () => {
    await listChats(join(fixturesDir, "whatsapp-cli-chats-success.sh"));

    expect(logs.some((l) => l.startsWith("[whatsapp]") && l.includes("chats"))).toBe(true);
  });

  test("list messages logs with [whatsapp] prefix", async () => {
    await listMessages(
      join(fixturesDir, "whatsapp-cli-messages-success.sh"),
      "alice@s.whatsapp.net",
      "2026-03-12T07:00:00.000Z",
    );

    expect(logs.some((l) => l.startsWith("[whatsapp]") && l.includes("messages"))).toBe(true);
  });
});

describe("agent logging", () => {
  test("tool calls are logged with [analyser:<name>] prefix", async () => {
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
              arguments: { message: "Urgent!" },
            },
          },
        ],
      },
      { role: "assistant", content: "Done." },
    ]);

    await analyseChat(
      "system",
      "model",
      "alice@s.whatsapp.net",
      "Alice",
      "2026-03-12T07:00:00.000Z",
      {
        chatModel,
        listMessages: async () => [],
        sendNotification: async () => {},
      },
    );

    expect(logs.some((l) => l.startsWith("[analyser:Alice]") && l.includes("list_messages"))).toBe(
      true,
    );
    expect(
      logs.some((l) => l.startsWith("[analyser:Alice]") && l.includes("send_notification")),
    ).toBe(true);
  });

  test("turn limit exceeded is logged with [analyser:<id>] prefix", async () => {
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

    await analyseChat(
      "system",
      "model",
      "x@s.whatsapp.net",
      "Infinite",
      "2026-03-12T07:00:00.000Z",
      {
        chatModel,
        listMessages: async () => [],
        sendNotification: async () => {},
      },
    );

    expect(
      logs.some(
        (l) =>
          l.startsWith("[analyser:x@s.whatsapp.net]") && l.includes("exceeded") && l.includes("10"),
      ),
    ).toBe(true);
  });
});

describe("pushover logging", () => {
  let savedToken: string | undefined;

  beforeEach(() => {
    savedToken = process.env.PUSHOVER_TOKEN;
    process.env.PUSHOVER_TOKEN = "test-token";
  });

  afterEach(() => {
    if (savedToken !== undefined) process.env.PUSHOVER_TOKEN = savedToken;
    else delete process.env.PUSHOVER_TOKEN;
  });

  test("notification request is logged with [pushover] prefix", async () => {
    const fetchStub = async () => new Response(JSON.stringify({ status: 1, request: "abc" }));

    await sendNotification("user-key", "Test message", fetchStub as typeof fetch);

    expect(logs.some((l) => l.startsWith("[pushover]") && l.includes("POST"))).toBe(true);
  });
});

function createStubChatModel(responses: AgentMessage[]): ChatModel {
  let callIndex = 0;
  return {
    async chat() {
      return responses[callIndex++];
    },
  };
}
