import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hasState, loadState, saveState } from "../src/state";

describe("first run detection and deferral", () => {
  const tempDirs: string[] = [];

  async function createTempDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "earth-to-tom-"));
    tempDirs.push(dir);
    return dir;
  }

  async function writeState(dir: string, content: string): Promise<void> {
    const path = join(dir, ".config", "earth-to-tom", "state.json");
    await Bun.write(path, content);
  }

  afterEach(async () => {
    setSystemTime();
    for (const dir of tempDirs) {
      await rm(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  test("no prior state is detected when state file does not exist", async () => {
    const home = await createTempDir();

    const exists = await hasState(home);

    expect(exists).toBe(false);
  });

  test("prior state is detected when state file exists", async () => {
    const home = await createTempDir();
    await writeState(home, JSON.stringify({ lastRunAt: "2026-03-10T12:00:00.000Z" }));

    const exists = await hasState(home);

    expect(exists).toBe(true);
  });

  test("first run records current timestamp", async () => {
    setSystemTime(new Date("2026-03-12T10:00:00.000Z"));
    const home = await createTempDir();

    await saveState({ lastRunAt: new Date().toISOString() }, home);

    const state = await loadState(home);
    expect(state.lastRunAt).toBe("2026-03-12T10:00:00.000Z");
  });
});
