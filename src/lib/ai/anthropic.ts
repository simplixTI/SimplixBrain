import Anthropic from "@anthropic-ai/sdk";

import { registerProvider, type AIProvider } from "./provider";
import type {
  ChatMessage,
  ChatOptions,
  ChatResult,
} from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

interface AnthropicConfig {
  apiKey?: string;
  defaultModel?: string;
}

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;
  readonly defaultChatModel: string;
  readonly defaultEmbedModel = "n/a";
  private client: Anthropic;

  constructor(config: AnthropicConfig = {}) {
    const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required for Anthropic provider.");
    this.client = new Anthropic({ apiKey });
    this.defaultChatModel = config.defaultModel ?? DEFAULT_MODEL;
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
    const convo = messages.filter((m) => m.role !== "system");

    const response = await this.client.messages.create(
      {
        model: opts.model ?? this.defaultChatModel,
        max_tokens: opts.maxTokens ?? 4096,
        temperature: opts.temperature,
        stop_sequences: opts.stopSequences,
        system: systemParts.length
          ? [{ type: "text", text: systemParts.join("\n\n"), cache_control: { type: "ephemeral" } }]
          : undefined,
        messages: convo.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      },
      { signal: opts.signal },
    );

    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");

    return {
      text,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      raw: response,
    };
  }

  async embed(): Promise<never> {
    throw new Error("Anthropic provider does not implement embeddings. Use OpenAI or Voyage.");
  }
}

registerProvider("anthropic", {
  create: (config) => new AnthropicProvider(config as AnthropicConfig),
});
