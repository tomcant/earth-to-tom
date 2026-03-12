export interface SyncResult {
  chats: number;
  messages: number;
}

export async function syncChats(whatsappCliPath: string): Promise<SyncResult> {
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
