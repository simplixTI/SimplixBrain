import { getProvider, type AIProvider } from "./provider";

export interface ResolvedProviders {
  chat: AIProvider;
  embed: AIProvider | null;
}

export function resolveProviders(): ResolvedProviders {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  if (!hasAnthropic && !hasOpenAI) {
    throw new Error(
      "No AI provider configured. Set ANTHROPIC_API_KEY and/or OPENAI_API_KEY.",
    );
  }

  const chat: AIProvider = hasAnthropic
    ? getProvider("anthropic")
    : getProvider("openai");

  const embed: AIProvider | null = hasOpenAI ? getProvider("openai") : null;

  return { chat, embed };
}
