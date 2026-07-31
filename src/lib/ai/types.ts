export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  signal?: AbortSignal;
}

export interface ChatResult {
  text: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
  raw?: unknown;
}

export interface EmbedOptions {
  model?: string;
  signal?: AbortSignal;
}

export interface EmbedResult {
  vectors: number[][];
  model: string;
  dimensions: number;
}

export type AIProviderName = "anthropic" | "openai" | "google" | "mock";
