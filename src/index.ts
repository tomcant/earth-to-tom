import { loadConfig } from "./config";
import { hasState, loadState, saveState } from "./state";
import { syncChats, listChats, listMessages, filterEligibleChats } from "./whatsapp";
import { analyseChat } from "./agent";
import { createOllamaChatModel } from "./ollama";
import { sendNotification } from "./notifications";

try {
  const config = await loadConfig();

  if (!(await hasState())) {
    console.log("First run detected. Recording current timestamp and exiting.");
    await saveState({ lastRunAt: new Date().toISOString() });
    process.exit(0);
  }

  const state = await loadState();

  await syncChats(config.whatsappCliPath);

  const chats = await listChats(config.whatsappCliPath);
  const eligibleChats = filterEligibleChats(chats, state.lastRunAt);

  const systemPrompt = await Bun.file("PROMPT.md").text();
  const chatModel = createOllamaChatModel();

  for (const chat of eligibleChats) {
    await analyseChat(systemPrompt, config.ollamaModel, chat.jid, chat.name, state.lastRunAt, {
      chatModel,
      listMessages: (chatJid, after) => listMessages(config.whatsappCliPath, chatJid, after),
      sendNotification: (message) => sendNotification(config.pushoverUserKey, message),
    });
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
