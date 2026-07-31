import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { createNode } from "./nodes";
import type { InboxItemRow, Json, NodeKind } from "./types";

type Client = SupabaseClient<Database>;

export interface CaptureInboxInput {
  workspaceId: string;
  source: string;
  rawContent?: string | null;
  rawMeta?: Json;
  suggestedKind?: NodeKind;
  suggestedMeta?: Json;
}

export async function captureInbox(
  client: Client,
  input: CaptureInboxInput,
): Promise<InboxItemRow> {
  const { data, error } = await client
    .from("inbox_items")
    .insert({
      workspace_id: input.workspaceId,
      source: input.source,
      raw_content: input.rawContent ?? null,
      raw_meta: input.rawMeta ?? {},
      suggested_kind: input.suggestedKind ?? null,
      suggested_meta: input.suggestedMeta ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listPendingInbox(
  client: Client,
  workspaceId: string,
  limit = 50,
) {
  const { data, error } = await client
    .from("inbox_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .in("state", ["pending", "ready"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export interface PromoteInboxInput {
  inboxId: string;
  workspaceId: string;
  kind: NodeKind;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  meta?: Json;
}

export async function promoteInbox(client: Client, input: PromoteInboxInput) {
  const node = await createNode(client, {
    workspaceId: input.workspaceId,
    kind: input.kind,
    title: input.title,
    subtitle: input.subtitle,
    body: input.body,
    meta: input.meta,
  });

  const { error } = await client
    .from("inbox_items")
    .update({
      state: "promoted",
      promoted_to_node_id: node.id,
      processed_at: new Date().toISOString(),
    })
    .eq("id", input.inboxId);

  if (error) throw error;
  return node;
}

export async function dismissInbox(client: Client, inboxId: string): Promise<void> {
  const { error } = await client
    .from("inbox_items")
    .update({ state: "dismissed", processed_at: new Date().toISOString() })
    .eq("id", inboxId);

  if (error) throw error;
}
