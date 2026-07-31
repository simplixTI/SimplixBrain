import { getProvider, type AIProvider } from "../provider";
import type { AIProviderName, ChatMessage, ChatOptions, ChatResult } from "../types";

const CHAT_CHAIN: AIProviderName[] = ["anthropic", "openai", "google"];

export interface ChatWithFallbackInput {
  messages: ChatMessage[];
  options?: ChatOptions;
  preferred?: AIProviderName;
}

export interface ChatWithFallbackResult extends ChatResult {
  provider: AIProviderName;
  attempts: Array<{ provider: AIProviderName; error: string }>;
}

/**
 * Try providers in order until one succeeds. Preferred provider is tried
 * first; the rest follow CHAT_CHAIN order minus any already tried.
 * Missing env vars are silently skipped so the chain degrades gracefully.
 */
export async function chatWithFallback(
  input: ChatWithFallbackInput,
): Promise<ChatWithFallbackResult> {
  const order: AIProviderName[] = [];
  if (input.preferred) order.push(input.preferred);
  for (const p of CHAT_CHAIN) if (!order.includes(p)) order.push(p);

  const attempts: ChatWithFallbackResult["attempts"] = [];

  for (const providerName of order) {
    let provider: AIProvider;
    try {
      provider = getProvider(providerName);
    } catch (err) {
      attempts.push({
        provider: providerName,
        error: err instanceof Error ? err.message : "unregistered",
      });
      continue;
    }

    try {
      const result = await provider.chat(input.messages, input.options);
      return { ...result, provider: providerName, attempts };
    } catch (err) {
      attempts.push({
        provider: providerName,
        error: err instanceof Error ? err.message : "chat failed",
      });
    }
  }

  throw new Error(
    `All chat providers failed: ${attempts.map((a) => `${a.provider}=${a.error}`).join(" | ")}`,
  );
}
