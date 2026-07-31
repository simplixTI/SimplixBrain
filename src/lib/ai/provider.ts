import type {
  AIProviderName,
  ChatMessage,
  ChatOptions,
  ChatResult,
  EmbedOptions,
  EmbedResult,
} from "./types";

export interface AIProvider {
  name: AIProviderName;
  defaultChatModel: string;
  defaultEmbedModel: string;
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult>;
  embed(inputs: string[], opts?: EmbedOptions): Promise<EmbedResult>;
}

export interface AIProviderFactory {
  create(config: Record<string, unknown>): AIProvider;
}

const registry = new Map<AIProviderName, AIProviderFactory>();

export function registerProvider(name: AIProviderName, factory: AIProviderFactory) {
  registry.set(name, factory);
}

export function getProvider(
  name: AIProviderName,
  config: Record<string, unknown> = {},
): AIProvider {
  const factory = registry.get(name);
  if (!factory) {
    throw new Error(
      `AI provider "${name}" not registered. Available: ${Array.from(registry.keys()).join(", ") || "(none)"}`,
    );
  }
  return factory.create(config);
}

registerProvider("mock", {
  create(): AIProvider {
    return {
      name: "mock",
      defaultChatModel: "mock-chat",
      defaultEmbedModel: "mock-embed",
      async chat(messages) {
        const last = messages[messages.length - 1]?.content ?? "";
        return {
          text: `[mock] ${last.slice(0, 200)}`,
          model: "mock-chat",
          usage: { inputTokens: 0, outputTokens: 0 },
        };
      },
      async embed(inputs) {
        const vectors = inputs.map(() => new Array(1536).fill(0));
        return { vectors, model: "mock-embed", dimensions: 1536 };
      },
    };
  },
});
