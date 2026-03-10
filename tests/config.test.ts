import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/config";

describe("user configuration", () => {
  const tempDirs: string[] = [];

  async function createTempDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "earth-to-tom-"));
    tempDirs.push(dir);
    return dir;
  }

  async function writeConfig(dir: string, content: string): Promise<string> {
    const configDir = join(dir, ".config", "earth-to-tom");
    await Bun.write(join(configDir, "config.json"), content);
    return dir;
  }

  afterEach(async () => {
    for (const dir of tempDirs) {
      await rm(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  test("loads valid configuration", async () => {
    const home = await createTempDir();
    await writeConfig(
      home,
      JSON.stringify({
        whatsappCliPath: "/usr/local/bin/whatsapp-cli",
        ollamaModel: "llama3",
        pushoverUserKey: "user123",
      }),
    );

    const config = await loadConfig(home);

    expect(config).toEqual({
      whatsappCliPath: "/usr/local/bin/whatsapp-cli",
      ollamaModel: "llama3",
      pushoverUserKey: "user123",
    });
  });

  test("missing config file exits with message", async () => {
    const home = await createTempDir();

    const result = await loadConfig(home).catch((e) => e);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("config");
  });

  test("corrupt JSON exits with message", async () => {
    const home = await createTempDir();
    await writeConfig(home, "not valid json{{{");

    const result = await loadConfig(home).catch((e) => e);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("config");
  });

  test("empty config file exits with message", async () => {
    const home = await createTempDir();
    await writeConfig(home, "");

    const result = await loadConfig(home).catch((e) => e);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("config");
  });

  test("missing whatsappCliPath exits with message", async () => {
    const home = await createTempDir();
    await writeConfig(
      home,
      JSON.stringify({
        ollamaModel: "llama3",
        pushoverUserKey: "user123",
      }),
    );

    const result = await loadConfig(home).catch((e) => e);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("whatsappCliPath");
  });

  test("empty ollamaModel exits with message", async () => {
    const home = await createTempDir();
    await writeConfig(
      home,
      JSON.stringify({
        whatsappCliPath: "/usr/local/bin/whatsapp-cli",
        ollamaModel: "",
        pushoverUserKey: "user123",
      }),
    );

    const result = await loadConfig(home).catch((e) => e);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("ollamaModel");
  });

  test("empty pushoverUserKey exits with message", async () => {
    const home = await createTempDir();
    await writeConfig(
      home,
      JSON.stringify({
        whatsappCliPath: "/usr/local/bin/whatsapp-cli",
        ollamaModel: "llama3",
        pushoverUserKey: "",
      }),
    );

    const result = await loadConfig(home).catch((e) => e);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("pushoverUserKey");
  });
});
