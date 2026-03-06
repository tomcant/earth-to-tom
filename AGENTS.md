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

## Testing

- **Framework:** Bun's built-in test runner (`bun:test`)
- **Location:** `tests/*.test.ts`, fixtures in `tests/fixtures/`
- **Philosophy:** Classical (Detroit) school — behavior-focused, real objects over mocks, AAA pattern

Always follow the rules and conventions in [docs/TESTING.md](docs/TESTING.md) when writing tests.
