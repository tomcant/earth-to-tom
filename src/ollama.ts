import { Ollama } from "ollama";
import type { AgentMessage, ChatModel } from "./agent";

export function createOllamaChatModel(): ChatModel {
  const client = new Ollama();

  return {
    async chat(model, messages, tools) {
      const response = await client.chat({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          tool_calls: m.tool_calls,
        })),
        tools: tools as Parameters<typeof client.chat>[0]["tools"],
      });

      return {
        role: "assistant",
        content: response.message.content,
        tool_calls: response.message.tool_calls as AgentMessage["tool_calls"],
      };
    },
  };
}
