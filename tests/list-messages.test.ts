import { describe, test, expect, beforeAll } from "bun:test";
import { join } from "node:path";
import { chmod } from "node:fs/promises";
import { listMessages } from "../src/whatsapp";

const fixturesDir = join(import.meta.dir, "fixtures");

beforeAll(async () => {
  await chmod(join(fixturesDir, "whatsapp-cli-messages-success.sh"), 0o755);
  await chmod(join(fixturesDir, "whatsapp-cli-messages-failure.sh"), 0o755);
});

describe("listing messages", () => {
  test("returns parsed messages on success", async () => {
    const cli = join(fixturesDir, "whatsapp-cli-messages-success.sh");

    const messages = await listMessages(cli, "alice@s.whatsapp.net", "2026-03-12T07:00:00.000Z");

    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({
      chat_jid: "alice@s.whatsapp.net",
      content: "Hey, are you there?",
    });
    expect(messages[1].content).toBe("I need help ASAP!");
  });

  test("throws on subprocess failure", async () => {
    const cli = join(fixturesDir, "whatsapp-cli-messages-failure.sh");

    const error = await listMessages(cli, "alice@s.whatsapp.net", "2026-03-12T07:00:00.000Z").catch(
      (e) => e,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("whatsapp-cli messages failed");
    expect(error.message).toContain("failed to list messages");
  });

  test("throws when binary does not exist", async () => {
    const error = await listMessages(
      "/nonexistent/whatsapp-cli",
      "a@b",
      "2026-03-12T07:00:00.000Z",
    ).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("not found");
  });
});
