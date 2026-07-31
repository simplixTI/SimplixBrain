import { retrieve } from "@/lib/brain/retrieval";

import { chatWithFallback } from "../fallback";
import { estimateCost, selectModel } from "../models";
import { buildMessages } from "../prompt-builder";
import type { OrchestratedHit, Strategy, StrategyResult } from "../types";

/**
 * Retrieval + LLM strategy — the general default when SQL/Vector can't
 * fully answer. Enforces "no invention" via short-circuit when retrieval
 * returns 0 hits.
 */
export const hybridStrategy: Strategy = async (ctx): Promise<StrategyResult> => {
  let embedding: number[] | undefined;
  if (ctx.embedProvider) {
    try {
      const embed = await ctx.embedProvider.embed([ctx.request.query]);
      embedding = embed.vectors[0];
    } catch {
      // Vector branch will just be skipped.
    }
  }

  const retrieval = await retrieve(ctx.supabase, {
    workspaceId: ctx.request.workspaceId,
    query: ctx.request.query,
    focusNodeId: ctx.request.focusNodeId,
    embedding,
  });

  if (retrieval.hits.length === 0) {
    return {
      answer: "Não encontrei essa informação no Brain.",
      hits: [],
      meta: { llmSkipped: true },
    };
  }

  const choice = await selectModel(
    ctx.supabase,
    ctx.request.workspaceId,
    ctx.intent.taskClass === "conversation" ? "conversation" : ctx.intent.taskClass,
  );

  const messages = buildMessages({
    query: ctx.request.query,
    hits: retrieval.hits,
    history: ctx.request.history,
    taskClass: ctx.intent.taskClass,
  });

  if (!choice) {
    return {
      answer:
        "Encontrei referências mas não há modelo LLM habilitado para essa task.\n\n" +
        retrieval.hits
          .slice(0, 5)
          .map((h, i) => `[#${i + 1}] ${h.node.kind}: ${h.node.title}`)
          .join("\n"),
      hits: retrieval.hits.map(toHit),
      meta: { llmSkipped: true },
    };
  }

  const response = await chatWithFallback({
    messages,
    preferred: choice.provider,
    options: {
      model: choice.model,
      maxTokens: choice.maxTokens,
      temperature: choice.temperature,
    },
  });

  return {
    answer: response.text,
    hits: retrieval.hits.map(toHit),
    meta: {
      provider: response.provider,
      model: response.model,
      inputTokens: response.usage?.inputTokens,
      outputTokens: response.usage?.outputTokens,
      estimatedCost: estimateCost(response.usage?.inputTokens, response.usage?.outputTokens, choice),
      llmSkipped: false,
    },
  };
};

function toHit(h: import("@/lib/brain/retrieval").RetrievalHit): OrchestratedHit {
  return {
    nodeId: h.node.id,
    kind: h.node.kind,
    title: h.node.title,
    snippet: h.node.body?.slice(0, 200),
    score: h.score,
    sources: h.sources,
  };
}
