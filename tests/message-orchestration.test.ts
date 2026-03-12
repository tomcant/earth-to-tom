import { describe, test, expect, beforeAll } from "bun:test";
import { join } from "node:path";
import { chmod } from "node:fs/promises";
import { listChats, filterEligibleChats, type Chat } from "../src/whatsapp";

const fixturesDir = join(import.meta.dir, "fixtures");

beforeAll(async () => {
  await chmod(join(fixturesDir, "whatsapp-cli-chats-success.sh"), 0o755);
  await chmod(join(fixturesDir, "whatsapp-cli-chats-failure.sh"), 0o755);
});

describe("listing chats", () => {
  test("returns parsed chat list on success", async () => {
    const cli = join(fixturesDir, "whatsapp-cli-chats-success.sh");

    const chats = await listChats(cli);

    expect(chats).toHaveLength(3);
    expect(chats[0]).toEqual({
      jid: "alice@s.whatsapp.net",
      name: "Alice",
      last_is_from_me: false,
      last_message_time: "2026-03-12T09:00:00.000Z",
    });
  });

  test("throws on subprocess failure", async () => {
    const cli = join(fixturesDir, "whatsapp-cli-chats-failure.sh");

    const error = await listChats(cli).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("whatsapp-cli chats failed");
    expect(error.message).toContain("failed to list chats");
  });

  test("throws when binary does not exist", async () => {
    const error = await listChats("/nonexistent/whatsapp-cli").catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("not found");
  });
});

describe("message analysis orchestration", () => {
  test("identifies chats with new messages since last run", () => {
    const chats: Chat[] = [
      {
        jid: "alice@s.whatsapp.net",
        name: "Alice",
        last_is_from_me: false,
        last_message_time: "2026-03-12T09:00:00.000Z",
      },
      {
        jid: "old@s.whatsapp.net",
        name: "Old",
        last_is_from_me: false,
        last_message_time: "2026-03-11T06:00:00.000Z",
      },
    ];

    const eligible = filterEligibleChats(chats, "2026-03-12T07:00:00.000Z");

    expect(eligible).toHaveLength(1);
    expect(eligible[0].jid).toBe("alice@s.whatsapp.net");
  });

  test("filters out chats where last message is from the user", () => {
    const chats: Chat[] = [
      {
        jid: "alice@s.whatsapp.net",
        name: "Alice",
        last_is_from_me: false,
        last_message_time: "2026-03-12T09:00:00.000Z",
      },
      {
        jid: "bob@s.whatsapp.net",
        name: "Bob",
        last_is_from_me: true,
        last_message_time: "2026-03-12T08:00:00.000Z",
      },
    ];

    const eligible = filterEligibleChats(chats, "2026-03-12T07:00:00.000Z");

    expect(eligible).toHaveLength(1);
    expect(eligible[0].jid).toBe("alice@s.whatsapp.net");
  });

  test("returns empty list when no chats have new messages", () => {
    const chats: Chat[] = [
      {
        jid: "alice@s.whatsapp.net",
        name: "Alice",
        last_is_from_me: false,
        last_message_time: "2026-03-12T09:00:00.000Z",
      },
    ];

    const eligible = filterEligibleChats(chats, "2026-03-12T10:00:00.000Z");

    expect(eligible).toHaveLength(0);
  });
});
