import { log } from "./logger";

export interface SyncResult {
  chats: number;
  messages: number;
}

export interface Chat {
  jid: string;
  name: string;
  last_is_from_me: boolean;
  last_message_time: string;
}

export async function syncChats(whatsappCliPath: string): Promise<SyncResult> {
  log("whatsapp", "sync");
  let proc: ReturnType<typeof Bun.spawn>;

  try {
    proc = Bun.spawn([whatsappCliPath, "sync"], {
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch {
    throw new Error(`whatsapp-cli binary not found at ${whatsappCliPath}.`);
  }

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`whatsapp-cli sync failed (exit code ${exitCode}): ${stderr.trim()}`);
  }

  const stdout = await new Response(proc.stdout).text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error("whatsapp-cli sync returned invalid JSON.");
  }

  const result = parsed as SyncResult;

  return { chats: result.chats, messages: result.messages };
}

export async function listChats(whatsappCliPath: string): Promise<Chat[]> {
  log("whatsapp", "chats --format json");
  let proc: ReturnType<typeof Bun.spawn>;

  try {
    proc = Bun.spawn([whatsappCliPath, "chats", "--format", "json"], {
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch {
    throw new Error(`whatsapp-cli binary not found at ${whatsappCliPath}.`);
  }

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`whatsapp-cli chats failed (exit code ${exitCode}): ${stderr.trim()}`);
  }

  const stdout = await new Response(proc.stdout).text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error("whatsapp-cli chats returned invalid JSON.");
  }

  return parsed as Chat[];
}

export interface Message {
  chat_jid: string;
  content: string;
}

export async function listMessages(
  whatsappCliPath: string,
  chatJid: string,
  after: string,
): Promise<Message[]> {
  log("whatsapp", `messages ${chatJid} --after ${after} --format json`);
  let proc: ReturnType<typeof Bun.spawn>;

  try {
    proc = Bun.spawn([whatsappCliPath, "messages", chatJid, "--after", after, "--format", "json"], {
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch {
    throw new Error(`whatsapp-cli binary not found at ${whatsappCliPath}.`);
  }

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`whatsapp-cli messages failed (exit code ${exitCode}): ${stderr.trim()}`);
  }

  const stdout = await new Response(proc.stdout).text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error("whatsapp-cli messages returned invalid JSON.");
  }

  return parsed as Message[];
}

export function filterEligibleChats(chats: Chat[], lastRunAt: string): Chat[] {
  const cutoff = new Date(lastRunAt);
  return chats.filter((chat) => new Date(chat.last_message_time) > cutoff && !chat.last_is_from_me);
}
