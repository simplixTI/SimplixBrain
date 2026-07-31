import { retrieve } from "@/lib/brain/retrieval";

import type { OrchestratedHit, Strategy } from "../types";

/**
 * Vector-only strategy — for document lookups where the answer is
 * literally "here are the top matches". No LLM call, just formatted hits.
 */
export const vectorStrategy: Strategy = async (ctx) => {
  let embedding: number[] | undefined;
  if (ctx.embedProvider) {
    try {
      const embed = await ctx.embedProvider.embed([ctx.request.query]);
      embedding = embed.vectors[0];
    } catch {
      // No embedding provider available — fall back to FTS below.
    }
  }

  const result = await retrieve(ctx.supabase, {
    workspaceId: ctx.request.workspaceId,
    query: ctx.request.query,
    embedding,
    focusNodeId: ctx.request.focusNodeId,
    limits: { total: 8 },
  });

  if (result.hits.length === 0) {
    return {
      answer: "Nenhum documento relevante encontrado no Brain.",
      hits: [],
      meta: { llmSkipped: true },
    };
  }

  const lines = result.hits.slice(0, 8).map((h, i) => {
    const subtitle = h.node.subtitle ? ` — ${h.node.subtitle}` : "";
    return `${i + 1}. [${h.node.kind}] ${h.node.title}${subtitle}`;
  });

  const hits: OrchestratedHit[] = result.hits.map((h) => ({
    nodeId: h.node.id,
    kind: h.node.kind,
    title: h.node.title,
    snippet: h.node.body?.slice(0, 200),
    score: h.score,
    sources: h.sources,
  }));

  return {
    answer: `Encontrei ${result.hits.length} resultado(s):\n\n${lines.join("\n")}`,
    hits,
    meta: { llmSkipped: true },
  };
};
