import { loadConfig } from "./config";
import { hasState, loadState, saveState } from "./state";

try {
  const config = await loadConfig();

  if (!(await hasState())) {
    console.log("First run detected. Recording current timestamp and exiting.");
    await saveState({ lastRunAt: new Date().toISOString() });
    process.exit(0);
  }

  const state = await loadState();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
