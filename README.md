# 🚨 Earth-to-Tom

An AI agent that detects urgency signals in Tom's WhatsApp messages (I'm Tom) and delivers high-priority notifications with Pushover. Uses a local Ollama model for privacy-preserving agentic reasoning — no message data leaves the device.

> [!CAUTION]
> This is a personal experiment — if you are not Tom, this project is probably not worth running. It was a simple excuse to play around with the agent loop concept, tool-calling with Ollama, and letting Ralph Wiggum write all the code while I sat back and watched.
>
> If you do decide to run this, bear in mind that due to its experimental nature, there are some obvious flaws — such as prompt-injection vulnerability — among other potential issues. This is in no way battle-tested.

> [!NOTE]
> If you're interested, see [SPEC.json](SPEC.json) for what was fed as input to the Ralph loop.

## Prerequisites

- [Bun](https://bun.sh) JavaScript runtime
- [Ollama](https://ollama.com) running locally
- [Pushover](https://pushover.net) account and API token
- [WhatsApp CLI](https://github.com/eddmann/whatsapp-cli) for reading messages

## Setup

Install dependencies:

```sh
bun install
```

Authenticate with WhatsApp:

```sh
whatsapp auth login
```

Pull an Ollama model:

```sh
ollama pull gpt-oss:20b # ~13 GB
ollama serve
```

Create the config file at `~/.config/earth-to-tom/config.json`:

```json
{
  "whatsappCliPath": "/path/to/whatsapp-cli",
  "ollamaModel": "gpt-oss:20b",
  "pushoverUserKey": "your-pushover-user-key"
}
```

Set the Pushover API token in your environment:

```sh
export PUSHOVER_TOKEN="your-pushover-token"
```

## Usage

```sh
bun run src/index.ts
```

Schedule it with cron to run periodically and you'll get pinged when something urgent comes in.

## Development

```sh
bun test    # run all tests
bun lint    # run Biome linter
bun format  # run Biome formatter
```

See [docs/TESTING.md](docs/TESTING.md) for an overview of testing philosophy and conventions.

Pre-commit checks are managed with [prek](https://github.com/j178/prek), a Rust re-implementation of [pre-commit](https://github.com/pre-commit/pre-commit). Run all pre-commit checks manually with:

```sh
prek -a  # format, lint, test
```

<sub>**Note:** I usually prefer to avoid running checks on pre-commit because it can feel cumbersome when a quick commit depends on potentially lengthy background processes, however I find it's a necessity in such agentic workflows because it enforces checks in a deterministic way.</sub>

## Privacy

All message analysis happens locally with Ollama. Messages are never sent to external AI services.
