import type { SupaClient, TaskClass } from "./types";

export interface RecordUsageInput {
  workspaceId?: string | null;
  actorId?: string | null;
  provider: string;
  model: string;
  taskClass?: TaskClass;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  durationMs?: number;
  cacheHit?: boolean;
  requestMeta?: Record<string, unknown>;
}

/**
 * Fire-and-forget usage insert. Uses the passed client (admin if RLS bypass
 * needed). Never throws — cost tracking is best-effort and must not affect
 * the request flow.
 */
export function recordUsage(client: SupaClient | null | undefined, input: RecordUsageInput) {
  if (!client) return;

  client
    .from("ai_usage")
    .insert({
      workspace_id: input.workspaceId ?? null,
      actor_id: input.actorId ?? null,
      provider: input.provider,
      model: input.model,
      task_class: input.taskClass ?? null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      estimated_cost: input.estimatedCost ?? null,
      duration_ms: input.durationMs ?? null,
      cache_hit: input.cacheHit ?? false,
      request_meta: (input.requestMeta ?? {}) as never,
    })
    .then(({ error }) => {
      if (error) console.error("[orchestrator.cost] recordUsage failed", error.message);
    });
}
