import { homedir } from "node:os";
import { join } from "node:path";

export interface Config {
  whatsappCliPath: string;
  ollamaModel: string;
  pushoverUserKey: string;
}

const REQUIRED_FIELDS: (keyof Config)[] = ["whatsappCliPath", "ollamaModel", "pushoverUserKey"];

export async function loadConfig(homeDir: string = homedir()): Promise<Config> {
  const configPath = join(homeDir, ".config", "earth-to-tom", "config.json");

  let raw: string;
  try {
    raw = await Bun.file(configPath).text();
  } catch {
    throw new Error(`Failed to read config at ${configPath}. Ensure the file exists.`);
  }

  if (raw.trim() === "") {
    throw new Error(`Config file at ${configPath} is empty. All fields are required.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Config file at ${configPath} contains invalid JSON.`);
  }

  const config = parsed as Record<string, unknown>;

  for (const field of REQUIRED_FIELDS) {
    const value = config[field];
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`Invalid config: "${field}" is required and must not be empty.`);
    }
  }

  return {
    whatsappCliPath: config.whatsappCliPath as string,
    ollamaModel: config.ollamaModel as string,
    pushoverUserKey: config.pushoverUserKey as string,
  };
}
