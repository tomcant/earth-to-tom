import type { Message as WhatsAppMessage } from "./whatsapp";

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: AgentToolCall[];
}

export interface AgentToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface AgentTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export interface ChatModel {
  chat(model: string, messages: AgentMessage[], tools: AgentTool[]): Promise<AgentMessage>;
}

export interface AgentDeps {
  chatModel: ChatModel;
  listMessages: (chatJid: string, after: string) => Promise<WhatsAppMessage[]>;
  sendNotification: (message: string) => Promise<void>;
}

export interface AgentResult {
  notificationSent: boolean;
}

const MAX_TURNS = 10;

const TOOLS: AgentTool[] = [
  {
    type: "function",
    function: {
      name: "list_messages",
      description: "List messages for a given chat sent after a specific date and time.",
      parameters: {
        type: "object",
        properties: {
          chat_jid: { type: "string", description: "The chat JID to list messages for." },
          after: {
            type: "string",
            description: "ISO 8601 timestamp. Only messages after this time are returned.",
          },
        },
        required: ["chat_jid", "after"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_notification",
      description: "Send a high-priority notification.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "The notification body text." },
        },
        required: ["message"],
      },
    },
  },
];

export async function analyseChat(
  systemPrompt: string,
  model: string,
  chatJid: string,
  chatName: string,
  lastRunAt: string,
  deps: AgentDeps,
): Promise<AgentResult> {
  const messages: AgentMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Analyse chat "${chatName}" (JID: ${chatJid}). Messages since: ${lastRunAt}`,
    },
  ];

  let notificationSent = false;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await deps.chatModel.chat(model, messages, TOOLS);
    messages.push(response);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      return { notificationSent };
    }

    for (const toolCall of response.tool_calls) {
      const { name, arguments: args } = toolCall.function;

      if (name === "list_messages") {
        const result = await deps.listMessages(args.chat_jid as string, args.after as string);
        messages.push({
          role: "tool",
          content: JSON.stringify(result),
        });
      } else if (name === "send_notification") {
        await deps.sendNotification(args.message as string);
        notificationSent = true;
        messages.push({
          role: "tool",
          content: "Notification sent successfully.",
        });
      }
    }
  }

  console.log(`Agent loop exceeded ${MAX_TURNS} turns for chat "${chatName}".`);
  return { notificationSent };
}
