import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type {
  Json,
  NodeInsert,
  NodeKind,
  NodeRow,
  NodeUpdate,
} from "./types";

type Client = SupabaseClient<Database>;

export interface CreateNodeInput {
  workspaceId: string;
  kind: NodeKind;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  meta?: Json;
}

export interface ListNodesInput {
  workspaceId: string;
  kind?: NodeKind;
  includeDeleted?: boolean;
  limit?: number;
  before?: string;
}

export interface SearchNodesInput {
  workspaceId: string;
  query: string;
  kind?: NodeKind;
  limit?: number;
}

export async function createNode(
  client: Client,
  input: CreateNodeInput,
): Promise<NodeRow> {
  const payload: NodeInsert = {
    workspace_id: input.workspaceId,
    kind: input.kind,
    title: input.title,
    subtitle: input.subtitle ?? null,
    body: input.body ?? null,
    meta: input.meta ?? {},
  };

  const { data, error } = await client
    .from("nodes")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateNode(
  client: Client,
  id: string,
  patch: NodeUpdate,
): Promise<NodeRow> {
  const { data, error } = await client
    .from("nodes")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getNode(
  client: Client,
  id: string,
  { includeDeleted = false }: { includeDeleted?: boolean } = {},
): Promise<NodeRow | null> {
  let q = client.from("nodes").select("*").eq("id", id);
  if (!includeDeleted) q = q.is("deleted_at", null);

  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data;
}

export async function softDeleteNode(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from("nodes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function restoreNode(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from("nodes")
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) throw error;
}

export async function listNodes(
  client: Client,
  { workspaceId, kind, includeDeleted = false, limit = 50, before }: ListNodesInput,
): Promise<NodeRow[]> {
  let q = client
    .from("nodes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (kind) q = q.eq("kind", kind);
  if (!includeDeleted) q = q.is("deleted_at", null);
  if (before) q = q.lt("updated_at", before);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/**
 * Full-text search on nodes.search_tsv (title/subtitle/body weighted A/B/C).
 * Uses Postgres websearch_to_tsquery for a natural query syntax.
 */
export async function searchNodesByText(
  client: Client,
  { workspaceId, query, kind, limit = 20 }: SearchNodesInput,
): Promise<NodeRow[]> {
  let q = client
    .from("nodes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .textSearch("search_tsv", query, { config: "simple", type: "websearch" })
    .limit(limit);

  if (kind) q = q.eq("kind", kind);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
