import { analyseChat } from "./agent";
import { loadConfig } from "./config";
import { log } from "./logger";
import { sendNotification } from "./notifications";
import { createOllamaChatModel } from "./ollama";
import { hasState, loadState, saveState } from "./state";
import { filterEligibleChats, listChats, listMessages, syncChats } from "./whatsapp";

try {
  const dryRun = !!process.env.DRY_RUN;
  if (dryRun) log("earth-to-tom", "dry-run mode enabled");

  const config = await loadConfig();
  const syncResult = await syncChats(config.whatsappCliPath);

  if (!(await hasState())) {
    log(
      "earth-to-tom",
      `first run; ${syncResult.chats} synced chats, ${syncResult.messages} synced messages`,
    );
    if (!dryRun) {
      await saveState({
        lastRunAt: new Date().toISOString(),
        totalChats: syncResult.chats,
        totalMessages: syncResult.messages,
      });
    }
    process.exit(0);
  }

  const state = await loadState();
  const newChats = syncResult.chats - state.totalChats;
  const newMessages = syncResult.messages - state.totalMessages;
  log("whatsapp", `${newChats} new chats, ${newMessages} new messages`);

  const chats = await listChats(config.whatsappCliPath);
  const eligibleChats = filterEligibleChats(chats, state.lastRunAt);
  log("whatsapp", `${eligibleChats.length} eligible chats for analysis`);

  if (eligibleChats.length === 0) process.exit(0);

  const systemPrompt = await Bun.file("PROMPT.md").text();
  const chatModel = createOllamaChatModel();

  let totalNotifications = 0;

  for (const chat of eligibleChats) {
    const result = await analyseChat(
      systemPrompt,
      config.ollamaModel,
      chat.jid,
      chat.name,
      state.lastRunAt,
      {
        chatModel,
        listMessages: (chatJid, after) => listMessages(config.whatsappCliPath, chatJid, after),
        sendNotification: dryRun
          ? async (_message) => log("pushover", `dry-run: skipped notification`)
          : (message) => sendNotification(config.pushoverUserKey, message),
      },
    );

    if (result.notificationSent) {
      totalNotifications++;
    }
  }

  log(
    "summary",
    `${eligibleChats.length} chats analysed, ${totalNotifications} notifications sent`,
  );

  if (!dryRun) {
    await saveState({
      lastRunAt: new Date().toISOString(),
      totalChats: syncResult.chats,
      totalMessages: syncResult.messages,
    });
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
