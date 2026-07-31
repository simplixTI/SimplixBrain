import type { Database, Json } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];

export type NodeRow = Tables["nodes"]["Row"];
export type NodeInsert = Tables["nodes"]["Insert"];
export type NodeUpdate = Tables["nodes"]["Update"];

export type EdgeRow = Tables["edges"]["Row"];
export type EdgeInsert = Tables["edges"]["Insert"];

export type NodeRevisionRow = Tables["node_revisions"]["Row"];
export type InboxItemRow = Tables["inbox_items"]["Row"];
export type AuditLogInsert = Tables["audit_log"]["Insert"];

export type NodeKind =
  | "project"
  | "person"
  | "company"
  | "document"
  | "note"
  | "knowledge_item"
  | "task"
  | "meeting"
  | "decision"
  | "idea"
  | "memory"
  | "email"
  | "message"
  | "chat_conversation"
  | "chat_message"
  | "file"
  | "link"
  | "code_snippet"
  | "transcript"
  | "image"
  | "inbox_item"
  | "automation"
  | "prompt"
  | "integration_account";

export type EdgeKind =
  | "belongs_to"
  | "part_of"
  | "authored_by"
  | "attends"
  | "works_at"
  | "client_of"
  | "mentions"
  | "references"
  | "derived_from"
  | "attached_to"
  | "blocks"
  | "duplicates"
  | "answers"
  | "discussed_in"
  | "scheduled_at";

export interface Neighbor {
  node: NodeRow;
  edge: EdgeRow;
  direction: "outgoing" | "incoming";
}

export type { Json };
