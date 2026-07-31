import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { AuditLogInsert, Json } from "./types";

type Client = SupabaseClient<Database>;

type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "connect"
  | "disconnect"
  | "login"
  | "system";

export interface RecordAuditInput {
  workspaceId?: string | null;
  actorId?: string | null;
  action: AuditAction;
  entityKind: string;
  entityId?: string | null;
  before?: Json | null;
  after?: Json | null;
  metadata?: Json;
}

export async function recordAudit(client: Client, input: RecordAuditInput) {
  const payload: AuditLogInsert = {
    workspace_id: input.workspaceId ?? null,
    actor_id: input.actorId ?? null,
    action: input.action,
    entity_kind: input.entityKind,
    entity_id: input.entityId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    metadata: input.metadata ?? {},
  };

  const { error } = await client.from("audit_log").insert(payload);
  if (error) throw error;
}
