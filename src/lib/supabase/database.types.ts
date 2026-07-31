export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_kind: string
          id: string
          metadata: Json
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_kind: string
          id?: string
          metadata?: Json
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_kind?: string
          id?: string
          metadata?: Json
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attendees: Json
          end_at: string | null
          external_id: string | null
          location: string | null
          node_id: string
          provider: string
          start_at: string
        }
        Insert: {
          attendees?: Json
          end_at?: string | null
          external_id?: string | null
          location?: string | null
          node_id: string
          provider: string
          start_at: string
        }
        Update: {
          attendees?: Json
          end_at?: string | null
          external_id?: string | null
          location?: string | null
          node_id?: string
          provider?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: true
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          industry: string | null
          location: string | null
          node_id: string
          size: string | null
          website: string | null
        }
        Insert: {
          industry?: string | null
          location?: string | null
          node_id: string
          size?: string | null
          website?: string | null
        }
        Update: {
          industry?: string | null
          location?: string | null
          node_id?: string
          size?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: true
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          title: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          alternatives: string | null
          context: string | null
          created_at: string
          date: string | null
          decision: string | null
          expected_impact: string | null
          id: string
          node_id: string | null
          project_id: string | null
          rationale: string | null
          status: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          alternatives?: string | null
          context?: string | null
          created_at?: string
          date?: string | null
          decision?: string | null
          expected_impact?: string | null
          id?: string
          node_id?: string | null
          project_id?: string | null
          rationale?: string | null
          status?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          alternatives?: string | null
          context?: string | null
          created_at?: string
          date?: string | null
          decision?: string | null
          expected_impact?: string | null
          id?: string
          node_id?: string | null
          project_id?: string | null
          rationale?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_kinds: {
        Row: {
          description: string | null
          kind: string
          reciprocal_of: string | null
        }
        Insert: {
          description?: string | null
          kind: string
          reciprocal_of?: string | null
        }
        Update: {
          description?: string | null
          kind?: string
          reciprocal_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edge_kinds_reciprocal_of_fkey"
            columns: ["reciprocal_of"]
            isOneToOne: false
            referencedRelation: "edge_kinds"
            referencedColumns: ["kind"]
          },
        ]
      }
      edges: {
        Row: {
          created_at: string
          created_by: string | null
          from_node_id: string
          id: string
          kind: string
          meta: Json
          to_node_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_node_id: string
          id?: string
          kind: string
          meta?: Json
          to_node_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_node_id?: string
          id?: string
          kind?: string
          meta?: Json
          to_node_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_kind_fkey"
            columns: ["kind"]
            isOneToOne: false
            referencedRelation: "edge_kinds"
            referencedColumns: ["kind"]
          },
          {
            foreignKeyName: "edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          cc_addresses: string[] | null
          external_id: string | null
          from_address: string | null
          node_id: string
          provider: string
          received_at: string | null
          snippet: string | null
          subject: string | null
          thread_id: string | null
          to_addresses: string[] | null
        }
        Insert: {
          cc_addresses?: string[] | null
          external_id?: string | null
          from_address?: string | null
          node_id: string
          provider: string
          received_at?: string | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
        }
        Update: {
          cc_addresses?: string[] | null
          external_id?: string | null
          from_address?: string | null
          node_id?: string
          provider?: string
          received_at?: string | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: true
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          chunk_index: number
          content: string
          embedding: string | null
          entity_id: string
          entity_kind: string
          id: string
          workspace_id: string
        }
        Insert: {
          chunk_index?: number
          content: string
          embedding?: string | null
          entity_id: string
          entity_kind: string
          id?: string
          workspace_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          embedding?: string | null
          entity_id?: string
          entity_kind?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          entity_id: string
          entity_kind: string
          id: string
          tag_id: string
          workspace_id: string
        }
        Insert: {
          entity_id: string
          entity_kind: string
          id?: string
          tag_id: string
          workspace_id: string
        }
        Update: {
          entity_id?: string
          entity_kind?: string
          id?: string
          tag_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          entity_id: string
          entity_kind: string
          filename: string
          id: string
          mime: string | null
          project_id: string | null
          size: number | null
          storage_path: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_kind: string
          filename: string
          id?: string
          mime?: string | null
          project_id?: string | null
          size?: number | null
          storage_path: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_kind?: string
          filename?: string
          id?: string
          mime?: string | null
          project_id?: string | null
          size?: number | null
          storage_path?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          effort: string | null
          id: string
          node_id: string | null
          potential: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          effort?: string | null
          id?: string
          node_id?: string | null
          potential?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          effort?: string | null
          id?: string
          node_id?: string | null
          potential?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_items: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          processed_at: string | null
          promoted_to_node_id: string | null
          raw_content: string | null
          raw_meta: Json
          source: string
          state: string
          suggested_kind: string | null
          suggested_meta: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          processed_at?: string | null
          promoted_to_node_id?: string | null
          raw_content?: string | null
          raw_meta?: Json
          source: string
          state?: string
          suggested_kind?: string | null
          suggested_meta?: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          processed_at?: string | null
          promoted_to_node_id?: string | null
          raw_content?: string | null
          raw_meta?: Json
          source?: string
          state?: string
          suggested_kind?: string | null
          suggested_meta?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_items_promoted_to_node_id_fkey"
            columns: ["promoted_to_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_items_suggested_kind_fkey"
            columns: ["suggested_kind"]
            isOneToOne: false
            referencedRelation: "node_kinds"
            referencedColumns: ["kind"]
          },
          {
            foreignKeyName: "inbox_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string
          credentials: Json | null
          id: string
          metadata: Json | null
          provider: string
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          credentials?: Json | null
          id?: string
          metadata?: Json | null
          provider: string
          status: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          credentials?: Json | null
          id?: string
          metadata?: Json | null
          provider?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          duration_seconds: number | null
          format: string
          mime: string | null
          node_id: string
          ocr_text: string | null
          page_count: number | null
          size: number | null
          source: string | null
          storage_path: string | null
          url: string | null
        }
        Insert: {
          duration_seconds?: number | null
          format: string
          mime?: string | null
          node_id: string
          ocr_text?: string | null
          page_count?: number | null
          size?: number | null
          source?: string | null
          storage_path?: string | null
          url?: string | null
        }
        Update: {
          duration_seconds?: number | null
          format?: string
          mime?: string | null
          node_id?: string
          ocr_text?: string | null
          page_count?: number | null
          size?: number | null
          source?: string | null
          storage_path?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: true
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          id: string
          label: string | null
          meeting_id: string
          profile_id: string | null
        }
        Insert: {
          id?: string
          label?: string | null
          meeting_id: string
          profile_id?: string | null
        }
        Update: {
          id?: string
          label?: string | null
          meeting_id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          created_at: string
          date: string | null
          decisions_taken: Json
          end_time: string | null
          id: string
          next_steps: string | null
          node_id: string | null
          notes: string | null
          project_id: string | null
          start_time: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agenda?: string | null
          created_at?: string
          date?: string | null
          decisions_taken?: Json
          end_time?: string | null
          id?: string
          next_steps?: string | null
          node_id?: string | null
          notes?: string | null
          project_id?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agenda?: string | null
          created_at?: string
          date?: string | null
          decisions_taken?: Json
          end_time?: string | null
          id?: string
          next_steps?: string | null
          node_id?: string | null
          notes?: string | null
          project_id?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          content: string
          created_at: string
          id: string
          node_id: string | null
          project_id: string | null
          scope: string
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          node_id?: string | null
          project_id?: string | null
          scope: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          node_id?: string | null
          project_id?: string | null
          scope?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          sources: Json
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          sources?: Json
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      node_kinds: {
        Row: {
          category: string
          description: string | null
          kind: string
        }
        Insert: {
          category: string
          description?: string | null
          kind: string
        }
        Update: {
          category?: string
          description?: string | null
          kind?: string
        }
        Relationships: []
      }
      node_revisions: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          node_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          node_id: string
          snapshot: Json
          version: number
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          node_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "node_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_revisions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      nodes: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          kind: string
          meta: Json
          search_tsv: unknown
          subtitle: string | null
          title: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          kind: string
          meta?: Json
          search_tsv?: unknown
          subtitle?: string | null
          title: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          kind?: string
          meta?: Json
          search_tsv?: unknown
          subtitle?: string | null
          title?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nodes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nodes_kind_fkey"
            columns: ["kind"]
            isOneToOne: false
            referencedRelation: "node_kinds"
            referencedColumns: ["kind"]
          },
          {
            foreignKeyName: "nodes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          archived: boolean
          content: string | null
          created_at: string
          favorite: boolean
          id: string
          node_id: string | null
          project_id: string | null
          title: string
          type: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived?: boolean
          content?: string | null
          created_at?: string
          favorite?: boolean
          id?: string
          node_id?: string | null
          project_id?: string | null
          title: string
          type?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived?: boolean
          content?: string | null
          created_at?: string
          favorite?: boolean
          id?: string
          node_id?: string | null
          project_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: string
          profile_id: string
          read_at: string | null
          title: string
          workspace_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: string
          profile_id: string
          read_at?: string | null
          title: string
          workspace_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          profile_id?: string
          read_at?: string | null
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          company_node_id: string | null
          email: string | null
          handles: Json
          location: string | null
          node_id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          company_node_id?: string | null
          email?: string | null
          handles?: Json
          location?: string | null
          node_id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          company_node_id?: string | null
          email?: string | null
          handles?: Json
          location?: string | null
          node_id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_company_node_id_fkey"
            columns: ["company_node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: true
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          due_date: string | null
          icon: string | null
          id: string
          name: string
          node_id: string | null
          objective: string | null
          priority: string | null
          progress: number | null
          slug: string
          start_date: string | null
          status: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          icon?: string | null
          id?: string
          name: string
          node_id?: string | null
          objective?: string | null
          priority?: string | null
          progress?: number | null
          slug: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          icon?: string | null
          id?: string
          name?: string
          node_id?: string | null
          objective?: string | null
          priority?: string | null
          progress?: number | null
          slug?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_subtasks: {
        Row: {
          done: boolean
          id: string
          order_index: number
          task_id: string
          title: string
        }
        Insert: {
          done?: boolean
          id?: string
          order_index?: number
          task_id: string
          title: string
        }
        Update: {
          done?: boolean
          id?: string
          order_index?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          assignee_label: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          node_id: string | null
          priority: string | null
          project_id: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_label?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          node_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assignee_id?: string | null
          assignee_label?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          node_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          actor_id: string | null
          description: string | null
          entity_id: string
          entity_kind: string
          id: string
          project_id: string | null
          timestamp: string
          title: string
          type: string
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          description?: string | null
          entity_id: string
          entity_kind: string
          id?: string
          project_id?: string | null
          timestamp?: string
          title: string
          type: string
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          description?: string | null
          entity_id?: string
          entity_kind?: string
          id?: string
          project_id?: string | null
          timestamp?: string
          title?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_write_workspace: { Args: { ws_id: string }; Returns: boolean }
      is_workspace_member: { Args: { ws_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
