import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { neighbors } from "./edges";
import { searchNodesByText } from "./nodes";
import type { NodeKind, NodeRow } from "./types";

type Client = SupabaseClient<Database>;

export type HitSource =
  | "fts"
  | "vector"
  | "graph"
  | "timeline"
  | "memory";

export interface RetrievalHit {
  node: NodeRow;
  score: number;
  sources: HitSource[];
  reason?: string;
}

export interface RetrievalRequest {
  workspaceId: string;
  query?: string;
  focusNodeId?: string;
  kinds?: NodeKind[];
  /** Precomputed query embedding — enables vector search when provided. */
  embedding?: number[];
  limits?: {
    fts?: number;
    vector?: number;
    graph?: number;
    timeline?: number;
    memories?: number;
    total?: number;
  };
}

export interface RetrievalResult {
  hits: RetrievalHit[];
  meta: {
    ranBranches: HitSource[];
    counts: Partial<Record<HitSource, number>>;
    tookMs: number;
  };
}

const DEFAULTS = {
  fts: 15,
  vector: 15,
  graph: 20,
  timeline: 10,
  memories: 10,
  total: 30,
};

async function fromFts(
  client: Client,
  req: RetrievalRequest,
  limit: number,
): Promise<RetrievalHit[]> {
  if (!req.query) return [];
  const nodes = await searchNodesByText(client, {
    workspaceId: req.workspaceId,
    query: req.query,
    limit,
  });
  return nodes.map((node) => ({
    node,
    score: 0.6,
    sources: ["fts"],
    reason: "Match textual (título/subtítulo/corpo)",
  }));
}

async function fromGraph(
  client: Client,
  req: RetrievalRequest,
  limit: number,
): Promise<RetrievalHit[]> {
  if (!req.focusNodeId) return [];
  const hop1 = await neighbors(client, {
    nodeId: req.focusNodeId,
    direction: "both",
    limit,
  });
  return hop1.map(({ node, edge, direction }) => ({
    node,
    score: 0.5,
    sources: ["graph"],
    reason: `${direction === "outgoing" ? "→" : "←"} ${edge.kind}`,
  }));
}

async function fromTimeline(
  client: Client,
  req: RetrievalRequest,
  limit: number,
): Promise<RetrievalHit[]> {
  const { data, error } = await client
    .from("timeline_events")
    .select("entity_id, entity_kind, title, timestamp")
    .eq("workspace_id", req.workspaceId)
    .eq("entity_kind", "node")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const ids = (data ?? []).map((e) => e.entity_id).filter((v): v is string => !!v);
  if (ids.length === 0) return [];

  const { data: nodes, error: nErr } = await client
    .from("nodes")
    .select("*")
    .in("id", ids)
    .is("deleted_at", null);
  if (nErr) throw nErr;

  return (nodes ?? []).map((node) => ({
    node,
    score: 0.3,
    sources: ["timeline"],
    reason: "Atividade recente",
  }));
}

async function fromMemories(
  client: Client,
  req: RetrievalRequest,
  limit: number,
): Promise<RetrievalHit[]> {
  const { data, error } = await client
    .from("memories")
    .select("node_id")
    .eq("workspace_id", req.workspaceId)
    .not("node_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const ids = (data ?? []).map((m) => m.node_id).filter((v): v is string => !!v);
  if (ids.length === 0) return [];

  const { data: nodes, error: nErr } = await client
    .from("nodes")
    .select("*")
    .in("id", ids)
    .is("deleted_at", null);
  if (nErr) throw nErr;

  return (nodes ?? []).map((node) => ({
    node,
    score: 0.7,
    sources: ["memory"],
    reason: "Memória consolidada",
  }));
}

async function fromVector(
  _client: Client,
  req: RetrievalRequest,
  _limit: number,
): Promise<RetrievalHit[]> {
  if (!req.embedding) return [];
  // TODO: requires match_nodes RPC (pgvector <=> operator).
  // Next migration will add: `create function match_nodes(query vector, ws uuid, k int)`.
  return [];
}

function mergeHits(batches: RetrievalHit[][], total: number): RetrievalHit[] {
  const byNode = new Map<string, RetrievalHit>();
  for (const batch of batches) {
    for (const hit of batch) {
      const existing = byNode.get(hit.node.id);
      if (!existing) {
        byNode.set(hit.node.id, { ...hit, sources: [...hit.sources] });
        continue;
      }
      existing.score = Math.min(1, existing.score + hit.score * 0.4);
      for (const s of hit.sources) {
        if (!existing.sources.includes(s)) existing.sources.push(s);
      }
      if (!existing.reason && hit.reason) existing.reason = hit.reason;
    }
  }
  return Array.from(byNode.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, total);
}

/**
 * Parallel retrieval pipeline for the Brain.
 * Query strategies (FTS, vector, graph, timeline, memories) run concurrently,
 * then merged with dedup + score boost when the same node hits multiple sources.
 *
 * A branch that throws is logged (via console.error) and returns 0 hits — so a
 * failing subsystem never takes the whole pipeline down.
 */
export async function retrieve(
  client: Client,
  req: RetrievalRequest,
): Promise<RetrievalResult> {
  const t0 = Date.now();
  const limits = { ...DEFAULTS, ...(req.limits ?? {}) };
  const ran: HitSource[] = [];

  const branches: Array<{ source: HitSource; run: () => Promise<RetrievalHit[]> }> = [
    { source: "fts",      run: () => fromFts(client, req, limits.fts) },
    { source: "vector",   run: () => fromVector(client, req, limits.vector) },
    { source: "graph",    run: () => fromGraph(client, req, limits.graph) },
    { source: "timeline", run: () => fromTimeline(client, req, limits.timeline) },
    { source: "memory",   run: () => fromMemories(client, req, limits.memories) },
  ];

  const settled = await Promise.allSettled(branches.map((b) => b.run()));
  const results: RetrievalHit[][] = [];
  const counts: Partial<Record<HitSource, number>> = {};

  settled.forEach((r, i) => {
    const source = branches[i]!.source;
    if (r.status === "fulfilled") {
      if (r.value.length > 0) ran.push(source);
      results.push(r.value);
      counts[source] = r.value.length;
    } else {
      console.error(`[brain.retrieval] ${source} branch failed`, r.reason);
      results.push([]);
      counts[source] = 0;
    }
  });

  const hits = mergeHits(results, limits.total);
  return {
    hits,
    meta: { ranBranches: ran, counts, tookMs: Date.now() - t0 },
  };
}
