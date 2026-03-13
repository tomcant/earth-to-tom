import { mkdir, rename } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface State {
  lastRunAt: string;
  totalChats: number;
  totalMessages: number;
}

function statePath(homeDir: string): string {
  return join(homeDir, ".config", "earth-to-tom", "state.json");
}

export async function hasState(homeDir: string = homedir()): Promise<boolean> {
  return Bun.file(statePath(homeDir)).exists();
}

export async function loadState(homeDir: string = homedir()): Promise<State> {
  const path = statePath(homeDir);

  let raw: string;
  try {
    raw = await Bun.file(path).text();
  } catch {
    throw new Error(`Failed to read state at ${path}. Ensure the file exists.`);
  }

  if (raw.trim() === "") {
    throw new Error(`State file at ${path} is empty.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`State file at ${path} contains invalid JSON.`);
  }

  return parsed as State;
}

export async function saveState(state: State, homeDir: string = homedir()): Promise<void> {
  const path = statePath(homeDir);
  const dir = dirname(path);
  const tempFile = join(dir, `state.json.${Date.now()}.tmp`);

  await mkdir(dir, { recursive: true });
  await Bun.write(tempFile, JSON.stringify(state, null, 2));
  await rename(tempFile, path);
}
