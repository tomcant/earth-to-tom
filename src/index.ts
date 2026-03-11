import { loadConfig } from "./config";

try {
  const config = await loadConfig();
} catch (error) {
  process.exit(1);
}
