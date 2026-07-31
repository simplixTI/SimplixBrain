import type { AIProviderName } from "../types";

import type { SupaClient, TaskClass } from "./types";

export interface ModelChoice {
  provider: AIProviderName;
  model: string;
  maxTokens: number;
  temperature: number;
  inputCostPerMtok: number | null;
  outputCostPerMtok: number | null;
}

interface ModelRow {
  provider: string;
  model: string;
  task_class: string;
  priority: number;
  enabled: boolean;
  max_tokens: number;
  temperature: number;
  input_cost_per_mtok: number | null;
  output_cost_per_mtok: number | null;
  cost_priority: number;
  quality_priority: number;
  workspace_id: string | null;
}

const CACHE_TTL_MS = 5 * 60_000;
let cache: { at: number; rows: ModelRow[] } | null = null;

async function loadModels(client: SupaClient, workspaceId: string): Promise<ModelRow[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.rows;

  const { data, error } = await client
    .from("ai_models")
    .select("*")
    .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
    .eq("enabled", true)
    .order("priority", { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as unknown as ModelRow[];
  cache = { at: Date.now(), rows };
  return rows;
}

export function invalidateModelsCache() {
  cache = null;
}

/**
 * Pick the best enabled model for a task class. Workspace-specific overrides
 * (rows with matching workspace_id) win over global defaults. Within a scope,
 * lowest priority number wins (matches ORDER BY priority ASC).
 */
export async function selectModel(
  client: SupaClient,
  workspaceId: string,
  taskClass: TaskClass,
  preferredProvider?: AIProviderName,
): Promise<ModelChoice | null> {
  const rows = await loadModels(client, workspaceId);
  const candidates = rows.filter((r) => r.task_class === taskClass);
  if (candidates.length === 0) return null;

  const wsScoped = candidates.filter((r) => r.workspace_id === workspaceId);
  const scoped = wsScoped.length > 0 ? wsScoped : candidates;

  const preferred = preferredProvider
    ? scoped.find((r) => r.provider === preferredProvider)
    : undefined;
  const pick = preferred ?? scoped[0];
  if (!pick) return null;

  return {
    provider: pick.provider as AIProviderName,
    model: pick.model,
    maxTokens: pick.max_tokens,
    temperature: Number(pick.temperature),
    inputCostPerMtok: pick.input_cost_per_mtok,
    outputCostPerMtok: pick.output_cost_per_mtok,
  };
}

export function estimateCost(
  inputTokens: number | undefined,
  outputTokens: number | undefined,
  choice: Pick<ModelChoice, "inputCostPerMtok" | "outputCostPerMtok">,
): number | undefined {
  if (choice.inputCostPerMtok == null && choice.outputCostPerMtok == null) return undefined;
  const inCost = ((inputTokens ?? 0) / 1_000_000) * (choice.inputCostPerMtok ?? 0);
  const outCost = ((outputTokens ?? 0) / 1_000_000) * (choice.outputCostPerMtok ?? 0);
  return Number((inCost + outCost).toFixed(6));
}
