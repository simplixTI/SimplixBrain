import OpenAI from "openai";

import { registerProvider, type AIProvider } from "./provider";
import type {
  ChatMessage,
  ChatOptions,
  ChatResult,
  EmbedOptions,
  EmbedResult,
} from "./types";

interface OpenAIConfig {
  apiKey?: string;
  defaultChatModel?: string;
  defaultEmbedModel?: string;
}

class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  readonly defaultChatModel: string;
  readonly defaultEmbedModel: string;
  private client: OpenAI;

  constructor(config: OpenAIConfig = {}) {
    const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is required for OpenAI provider.");
    this.client = new OpenAI({ apiKey });
    this.defaultChatModel = config.defaultChatModel ?? "gpt-4o-mini";
    // text-embedding-3-small = 1536 dims, matches embeddings.embedding column
    this.defaultEmbedModel = config.defaultEmbedModel ?? "text-embedding-3-small";
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    const response = await this.client.chat.completions.create(
      {
        model: opts.model ?? this.defaultChatModel,
        max_tokens: opts.maxTokens ?? 4096,
        temperature: opts.temperature,
        stop: opts.stopSequences,
        messages: messages.map((m) => ({
          role: m.role === "tool" ? "user" : m.role,
          content: m.content,
        })),
      },
      { signal: opts.signal },
    );

    const text = response.choices[0]?.message?.content ?? "";
    return {
      text,
      model: response.model,
      usage: {
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      },
      raw: response,
    };
  }

  async embed(inputs: string[], opts: EmbedOptions = {}): Promise<EmbedResult> {
    const model = opts.model ?? this.defaultEmbedModel;
    const response = await this.client.embeddings.create(
      { model, input: inputs },
      { signal: opts.signal },
    );
    const vectors = response.data.map((d) => d.embedding);
    return {
      vectors,
      model: response.model,
      dimensions: vectors[0]?.length ?? 0,
    };
  }
}

registerProvider("openai", {
  create: (config) => new OpenAIProvider(config as OpenAIConfig),
});
