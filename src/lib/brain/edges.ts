import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { EdgeKind, EdgeRow, Json, Neighbor, NodeRow } from "./types";

type Client = SupabaseClient<Database>;

export interface ConnectInput {
  workspaceId: string;
  from: string;
  to: string;
  kind: EdgeKind;
  meta?: Json;
}

export interface NeighborsInput {
  nodeId: string;
  direction?: "outgoing" | "incoming" | "both";
  kind?: EdgeKind;
  limit?: number;
}

export async function connect(client: Client, input: ConnectInput): Promise<EdgeRow> {
  const { data, error } = await client
    .from("edges")
    .insert({
      workspace_id: input.workspaceId,
      from_node_id: input.from,
      to_node_id: input.to,
      kind: input.kind,
      meta: input.meta ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function disconnect(
  client: Client,
  { from, to, kind }: { from: string; to: string; kind: EdgeKind },
): Promise<void> {
  const { error } = await client
    .from("edges")
    .delete()
    .eq("from_node_id", from)
    .eq("to_node_id", to)
    .eq("kind", kind);

  if (error) throw error;
}

export async function disconnectById(client: Client, edgeId: string): Promise<void> {
  const { error } = await client.from("edges").delete().eq("id", edgeId);
  if (error) throw error;
}

async function fetchNodesByIds(client: Client, ids: string[]): Promise<Map<string, NodeRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await client
    .from("nodes")
    .select("*")
    .in("id", ids)
    .is("deleted_at", null);
  if (error) throw error;
  return new Map((data ?? []).map((n) => [n.id, n]));
}

export async function neighbors(
  client: Client,
  { nodeId, direction = "both", kind, limit = 50 }: NeighborsInput,
): Promise<Neighbor[]> {
  const outgoingQ = client
    .from("edges")
    .select("*")
    .eq("from_node_id", nodeId)
    .limit(limit);
  const incomingQ = client
    .from("edges")
    .select("*")
    .eq("to_node_id", nodeId)
    .limit(limit);

  const [outgoing, incoming] = await Promise.all([
    direction !== "incoming"
      ? (kind ? outgoingQ.eq("kind", kind) : outgoingQ)
      : Promise.resolve({ data: [] as EdgeRow[], error: null }),
    direction !== "outgoing"
      ? (kind ? incomingQ.eq("kind", kind) : incomingQ)
      : Promise.resolve({ data: [] as EdgeRow[], error: null }),
  ]);

  if (outgoing.error) throw outgoing.error;
  if (incoming.error) throw incoming.error;

  const outEdges = outgoing.data ?? [];
  const inEdges = incoming.data ?? [];
  const otherIds = [
    ...outEdges.map((e) => e.to_node_id),
    ...inEdges.map((e) => e.from_node_id),
  ];

  const nodesById = await fetchNodesByIds(client, otherIds);

  const results: Neighbor[] = [];
  for (const e of outEdges) {
    const node = nodesById.get(e.to_node_id);
    if (node) results.push({ node, edge: e, direction: "outgoing" });
  }
  for (const e of inEdges) {
    const node = nodesById.get(e.from_node_id);
    if (node) results.push({ node, edge: e, direction: "incoming" });
  }
  return results;
}
