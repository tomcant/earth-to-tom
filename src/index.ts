import { loadConfig } from "./config";

try {
  const config = await loadConfig();
  console.log("[earth-to-tom] Configuration loaded");
} catch (error) {
  console.error(`[earth-to-tom] ${(error as Error).message}`);
  process.exit(1);
}
