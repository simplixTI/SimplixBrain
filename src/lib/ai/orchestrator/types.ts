import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { AIProvider } from "../provider";
import type { ChatMessage } from "../types";

export type TaskClass =
  | "sql"
  | "vector"
  | "memory"
  | "planner"
  | "generation"
  | "summarization"
  | "translation"
  | "extraction"
  | "coding"
  | "conversation"
  | "classifier"
  | "embed"
  | "vision";

export type StrategyName = "sql" | "vector" | "hybrid" | "generation" | "planner";

export interface Intent {
  taskClass: TaskClass;
  confidence: number;
  keywords: string[];
  matchedPattern?: string;
}

export interface OrchestratorRequest {
  workspaceId: string;
  actorId?: string;
  query: string;
  history?: ChatMessage[];
  focusNodeId?: string;
  /** Force a specific task class (skips classifier). */
  forceTaskClass?: TaskClass;
  /** Disable cache for this call. */
  bypassCache?: boolean;
}

export interface OrchestratedHit {
  nodeId: string;
  kind: string;
  title: string;
  snippet?: string;
  score: number;
  sources: string[];
}

export interface OrchestratedResponse {
  answer: string;
  hits: OrchestratedHit[];
  meta: {
    intent: Intent;
    strategy: StrategyName;
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    estimatedCost?: number;
    cacheHit: boolean;
    llmSkipped: boolean;
    tookMs: number;
  };
}

export type SupaClient = SupabaseClient<Database>;

export interface OrchestratorContext {
  supabase: SupaClient;
  admin?: SupaClient | null;
  request: OrchestratorRequest;
  intent: Intent;
  chatProvider: AIProvider | null;
  embedProvider: AIProvider | null;
}

export type StrategyResult = Omit<OrchestratedResponse, "meta"> & {
  meta: Partial<OrchestratedResponse["meta"]>;
};

export type Strategy = (ctx: OrchestratorContext) => Promise<StrategyResult | null>;
