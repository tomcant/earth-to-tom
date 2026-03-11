import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadState, type State, saveState } from "../src/state";

describe("persistent state tracking", () => {
  const tempDirs: string[] = [];

  async function createTempDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "earth-to-tom-"));
    tempDirs.push(dir);
    return dir;
  }

  function statePath(homeDir: string): string {
    return join(homeDir, ".config", "earth-to-tom", "state.json");
  }

  async function writeState(dir: string, content: string): Promise<void> {
    await Bun.write(statePath(dir), content);
  }

  afterEach(async () => {
    for (const dir of tempDirs) {
      await rm(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  test("loads valid state", async () => {
    const home = await createTempDir();
    await writeState(home, JSON.stringify({ lastRunAt: "2026-03-10T12:00:00.000Z" }));

    const state = await loadState(home);

    expect(state).toEqual({ lastRunAt: "2026-03-10T12:00:00.000Z" });
  });

  test("missing state file exits with message", async () => {
    const home = await createTempDir();

    const result = await loadState(home).catch((e) => e);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("state");
  });

  test("corrupt JSON exits with message", async () => {
    const home = await createTempDir();
    await writeState(home, "not valid json{{{");

    const result = await loadState(home).catch((e) => e);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("state");
  });

  test("empty state file exits with message", async () => {
    const home = await createTempDir();
    await writeState(home, "");

    const result = await loadState(home).catch((e) => e);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("state");
  });

  test("saves state atomically", async () => {
    const home = await createTempDir();
    const state: State = { lastRunAt: "2026-03-11T08:00:00.000Z" };

    await saveState(state, home);

    const saved = await Bun.file(statePath(home)).json();
    expect(saved).toEqual({ lastRunAt: "2026-03-11T08:00:00.000Z" });
  });

  test("saves state to a new file when none exists", async () => {
    const home = await createTempDir();
    const state: State = { lastRunAt: "2026-03-11T08:00:00.000Z" };

    await saveState(state, home);

    const saved = await Bun.file(statePath(home)).json();
    expect(saved).toEqual({ lastRunAt: "2026-03-11T08:00:00.000Z" });
  });

  test("overwrites existing state", async () => {
    const home = await createTempDir();
    await writeState(home, JSON.stringify({ lastRunAt: "2026-03-10T12:00:00.000Z" }));

    await saveState({ lastRunAt: "2026-03-11T08:00:00.000Z" }, home);

    const saved = await Bun.file(statePath(home)).json();
    expect(saved).toEqual({ lastRunAt: "2026-03-11T08:00:00.000Z" });
  });
});
