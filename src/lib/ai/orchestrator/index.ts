import { getProvider, type AIProvider } from "../provider";
import type { AIProviderName } from "../types";

import { cacheKey, getCached, setCached } from "./cache";
import { classify } from "./classifier";
import { recordUsage } from "./cost";
import { runStrategies } from "./router";
import type {
  OrchestratedResponse,
  OrchestratorContext,
  OrchestratorRequest,
  SupaClient,
} from "./types";

export * from "./types";
export { classify } from "./classifier";
export { selectModel, estimateCost, invalidateModelsCache } from "./models";
export { clearCache, cacheKey } from "./cache";
export { chatWithFallback } from "./fallback";

function tryGetProvider(name: AIProviderName): AIProvider | null {
  try {
    return getProvider(name);
  } catch {
    return null;
  }
}

function resolveChatProvider(): AIProvider | null {
  if (process.env.ANTHROPIC_API_KEY) return tryGetProvider("anthropic");
  if (process.env.OPENAI_API_KEY) return tryGetProvider("openai");
  return null;
}

function resolveEmbedProvider(): AIProvider | null {
  if (process.env.OPENAI_API_KEY) return tryGetProvider("openai");
  return null;
}

export interface OrchestrateOptions {
  supabase: SupaClient;
  admin?: SupaClient | null;
}

/**
 * Main entry point for all AI-mediated queries in SimplixBrain.
 * Nothing in the app should import providers directly — always go through here.
 *
 * Flow: cache → classify → pick strategies → run → record usage → cache set.
 */
export async function orchestrate(
  request: OrchestratorRequest,
  { supabase, admin }: OrchestrateOptions,
): Promise<OrchestratedResponse> {
  const t0 = Date.now();
  const intent = request.forceTaskClass
    ? { taskClass: request.forceTaskClass, confidence: 1, keywords: [] }
    : classify(request.query);

  const key = cacheKey({
    workspaceId: request.workspaceId,
    query: request.query,
    focusNodeId: request.focusNodeId,
  });

  if (!request.bypassCache) {
    const cached = getCached(key);
    if (cached) {
      recordUsage(admin, {
        workspaceId: request.workspaceId,
        actorId: request.actorId,
        provider: "cache",
        model: "cache",
        taskClass: intent.taskClass,
        cacheHit: true,
        durationMs: Date.now() - t0,
      });
      return cached;
    }
  }

  const ctx: OrchestratorContext = {
    supabase,
    admin: admin ?? null,
    request,
    intent,
    chatProvider: resolveChatProvider(),
    embedProvider: resolveEmbedProvider(),
  };

  const { result, strategy } = await runStrategies(ctx);

  const response: OrchestratedResponse = {
    answer: result.answer,
    hits: result.hits,
    meta: {
      intent,
      strategy,
      cacheHit: false,
      llmSkipped: result.meta.llmSkipped ?? true,
      provider: result.meta.provider,
      model: result.meta.model,
      inputTokens: result.meta.inputTokens,
      outputTokens: result.meta.outputTokens,
      estimatedCost: result.meta.estimatedCost,
      tookMs: Date.now() - t0,
    },
  };

  setCached(key, response);

  if (!response.meta.llmSkipped) {
    recordUsage(admin, {
      workspaceId: request.workspaceId,
      actorId: request.actorId,
      provider: response.meta.provider ?? "unknown",
      model: response.meta.model ?? "unknown",
      taskClass: intent.taskClass,
      inputTokens: response.meta.inputTokens,
      outputTokens: response.meta.outputTokens,
      estimatedCost: response.meta.estimatedCost,
      durationMs: response.meta.tookMs,
      requestMeta: { strategy, focusNodeId: request.focusNodeId },
    });
  }

  return response;
}
