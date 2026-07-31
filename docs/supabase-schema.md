# Schema Supabase (Fase 2)

Modelagem PostgreSQL prevista quando migrar do `localStorage`. RLS por `workspace_id`. Colunas `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` implícitas.

## Identidade e workspace

### `profiles`
`id (uuid, PK, FK auth.users)` · `full_name text` · `avatar_url text` · `created_at timestamptz`

### `workspaces`
`name text` · `slug text unique` · `owner_id uuid FK profiles` · `created_at timestamptz`

### `workspace_members`
`workspace_id uuid FK workspaces` · `profile_id uuid FK profiles` · `role text check (role in ('owner','admin','member','viewer'))` · `created_at timestamptz`
- UNIQUE(workspace_id, profile_id)

## Projetos

### `projects`
`workspace_id uuid FK workspaces` · `name text` · `slug text` · `description text` · `objective text` · `status text` · `priority text` · `category text` · `start_date date` · `due_date date` · `progress int check (progress between 0 and 100)` · `color text` · `icon text` · `created_at timestamptz` · `updated_at timestamptz`
- UNIQUE(workspace_id, slug)

## Conteúdo

### `notes`
`workspace_id uuid FK workspaces` · `project_id uuid FK projects null` · `title text` · `content text` · `type text` · `favorite boolean default false` · `archived boolean default false` · `created_at timestamptz` · `updated_at timestamptz`

### `tasks`
`workspace_id uuid FK workspaces` · `project_id uuid FK projects null` · `title text` · `description text` · `status text` · `priority text` · `due_date date` · `assignee_id uuid FK profiles null` · `assignee_label text null` · `completed_at timestamptz null` · `created_at timestamptz` · `updated_at timestamptz`

### `task_subtasks`
`task_id uuid FK tasks` · `title text` · `done boolean default false` · `order_index int`

### `ideas`
`workspace_id uuid FK workspaces` · `project_id uuid FK projects null` · `title text` · `description text` · `category text` · `potential text` · `effort text` · `status text` · `created_at timestamptz` · `updated_at timestamptz`

### `decisions`
`workspace_id uuid FK workspaces` · `project_id uuid FK projects null` · `title text` · `context text` · `decision text` · `rationale text` · `alternatives text` · `expected_impact text` · `date date` · `status text` · `created_at timestamptz` · `updated_at timestamptz`

### `meetings`
`workspace_id uuid FK workspaces` · `project_id uuid FK projects null` · `title text` · `date date` · `start_time time` · `end_time time` · `agenda text` · `notes text` · `next_steps text` · `decisions_taken jsonb default '[]'` · `created_at timestamptz` · `updated_at timestamptz`

### `meeting_participants`
`meeting_id uuid FK meetings` · `profile_id uuid FK profiles null` · `label text null`

### `files`
`workspace_id uuid FK workspaces` · `project_id uuid FK projects null` · `entity_kind text` · `entity_id uuid` · `storage_path text` · `filename text` · `mime text` · `size bigint` · `created_at timestamptz`

## Tags

### `tags`
`workspace_id uuid FK workspaces` · `name text` · `color text null`
- UNIQUE(workspace_id, name)

### `entity_tags`
`workspace_id uuid FK workspaces` · `entity_kind text` · `entity_id uuid` · `tag_id uuid FK tags`
- UNIQUE(entity_kind, entity_id, tag_id)

## Timeline

### `timeline_events`
`workspace_id uuid FK workspaces` · `project_id uuid FK projects null` · `entity_kind text` · `entity_id uuid` · `type text` · `title text` · `description text` · `actor_id uuid FK profiles null` · `timestamp timestamptz`

## IA e memória

### `conversations`
`workspace_id uuid FK workspaces` · `project_id uuid FK projects null` · `title text` · `created_at timestamptz` · `updated_at timestamptz`

### `messages`
`conversation_id uuid FK conversations` · `role text check (role in ('user','assistant','system','tool'))` · `content text` · `sources jsonb default '[]'` · `created_at timestamptz`

### `memories`
`workspace_id uuid FK workspaces` · `scope text check (scope in ('workspace','project','user'))` · `project_id uuid FK projects null` · `content text` · `created_at timestamptz`

### `embeddings`
`workspace_id uuid FK workspaces` · `entity_kind text` · `entity_id uuid` · `chunk_index int` · `content text` · `embedding vector(1536)`
- Requer `create extension if not exists vector;`
- Índice `create index on embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);`

## Integrações e notificações

### `integrations`
`workspace_id uuid FK workspaces` · `provider text check (provider in ('gmail','gcalendar','gdrive','github','whatsapp','slack'))` · `status text check (status in ('connected','disconnected','error'))` · `credentials jsonb` · `metadata jsonb` · `created_at timestamptz`

### `notifications`
`workspace_id uuid FK workspaces` · `profile_id uuid FK profiles` · `kind text` · `title text` · `body text` · `href text` · `read_at timestamptz null` · `created_at timestamptz`

## RLS (exemplo genérico)

```sql
alter table projects enable row level security;

create policy "workspace read" on projects
  for select using (
    exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = projects.workspace_id
        and workspace_members.profile_id = auth.uid()
    )
  );

create policy "workspace write" on projects
  for all using (
    exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = projects.workspace_id
        and workspace_members.profile_id = auth.uid()
        and workspace_members.role in ('owner','admin','member')
    )
  );
```
