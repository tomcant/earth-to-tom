import { describe, test, expect, beforeAll } from "bun:test";
import { join } from "node:path";
import { chmod } from "node:fs/promises";
import { syncChats } from "../src/whatsapp";

const fixturesDir = join(import.meta.dir, "fixtures");

beforeAll(async () => {
  await chmod(join(fixturesDir, "whatsapp-cli-sync-success.sh"), 0o755);
  await chmod(join(fixturesDir, "whatsapp-cli-sync-failure.sh"), 0o755);
});

describe("WhatsApp synchronisation", () => {
  test("returns sync result on success", async () => {
    const cli = join(fixturesDir, "whatsapp-cli-sync-success.sh");

    const result = await syncChats(cli);

    expect(result).toEqual({ chats: 5, messages: 42 });
  });

  test("throws on subprocess failure", async () => {
    const cli = join(fixturesDir, "whatsapp-cli-sync-failure.sh");

    const error = await syncChats(cli).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("whatsapp-cli sync failed");
    expect(error.message).toContain("something went wrong");
  });

  test("throws when binary does not exist", async () => {
    const cli = "/nonexistent/whatsapp-cli";

    const error = await syncChats(cli).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("not found");
  });
});
