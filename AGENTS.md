# AGENTS.md

Earth-to-Tom is an AI agent that detects urgency signals in WhatsApp messages with a local Ollama model and delivers high-priority notifications with Pushover.

## Commands

| Task   | Command                |
| ------ | ---------------------- |
| Run    | `bun run src/index.ts` |
| Test   | `bun test`             |
| Lint   | `bun lint`             |
| Format | `bun format`           |

## Conventions

- **Language:** TypeScript
- **Package manager:** Bun
- **Bun APIs:**
  - `Bun.spawn()` for child processes
  - `Bun.file().text()` for reading files
  - `Bun.write()` for writing files

## Architecture

```
src/index.ts           → Entry point. Loads config, syncs chats, runs the agent, persists state
src/config.ts          → Loads and validates config from `<HOME>/.config/earth-to-tom/config.json`
src/state.ts           → Atomic read/write of run state to `<HOME>/.config/earth-to-tom/state.json`
src/agent.ts           → Agentic loop that analyses a single chat via LLM tool-use
src/whatsapp.ts        → Wraps `whatsapp-cli` to sync, list chats and messages
src/ollama.ts          → `ChatModel` adapter for the local Ollama instance
src/notifications.ts   → Sends push notifications via the Pushover API
src/logger.ts          → Prefixed logging helper
```

`PROMPT.md` at the project root defines the system prompt given to the analysis agent.

## Testing

- **Framework:** Bun's built-in test runner (`bun:test`)
- **Location:** `tests/*.test.ts`, fixtures in `tests/fixtures/`
- **Philosophy:** Classical (Detroit) school — behavior-focused, real objects over mocks, AAA pattern

Always follow the rules and conventions in [docs/TESTING.md](docs/TESTING.md) when writing tests.
