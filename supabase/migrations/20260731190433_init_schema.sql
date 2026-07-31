-- SimplixBrain — initial schema
-- Mirrors docs/supabase-schema.md
-- Multi-tenant via workspace_id + RLS scoped to workspace_members.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists pgcrypto;
create extension if not exists vector;

-- ============================================================================
-- Helper: updated_at trigger
-- ============================================================================
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Identity & workspaces
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, profile_id)
);

create index on public.workspace_members (profile_id);

create or replace function public.tg_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_user();

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and profile_id = auth.uid()
  );
$$;

create or replace function public.can_write_workspace(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and profile_id = auth.uid()
      and role in ('owner','admin','member')
  );
$$;

-- ============================================================================
-- Projects
-- ============================================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  objective text,
  status text,
  priority text,
  category text,
  start_date date,
  due_date date,
  progress int check (progress between 0 and 100),
  color text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index on public.projects (workspace_id);
create trigger set_updated_at before update on public.projects
  for each row execute function public.tg_set_updated_at();

-- ============================================================================
-- Content
-- ============================================================================
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  content text,
  type text,
  favorite boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.notes (workspace_id);
create index on public.notes (project_id);
create trigger set_updated_at before update on public.notes
  for each row execute function public.tg_set_updated_at();

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text,
  due_date date,
  assignee_id uuid references public.profiles(id) on delete set null,
  assignee_label text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.tasks (workspace_id);
create index on public.tasks (project_id);
create index on public.tasks (assignee_id);
create index on public.tasks (status);
create trigger set_updated_at before update on public.tasks
  for each row execute function public.tg_set_updated_at();

create table public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  order_index int not null default 0
);
create index on public.task_subtasks (task_id);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  category text,
  potential text,
  effort text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.ideas (workspace_id);
create index on public.ideas (project_id);
create trigger set_updated_at before update on public.ideas
  for each row execute function public.tg_set_updated_at();

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  context text,
  decision text,
  rationale text,
  alternatives text,
  expected_impact text,
  date date,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.decisions (workspace_id);
create index on public.decisions (project_id);
create trigger set_updated_at before update on public.decisions
  for each row execute function public.tg_set_updated_at();

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  date date,
  start_time time,
  end_time time,
  agenda text,
  notes text,
  next_steps text,
  decisions_taken jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.meetings (workspace_id);
create index on public.meetings (project_id);
create trigger set_updated_at before update on public.meetings
  for each row execute function public.tg_set_updated_at();

create table public.meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  label text
);
create index on public.meeting_participants (meeting_id);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  entity_kind text not null,
  entity_id uuid not null,
  storage_path text not null,
  filename text not null,
  mime text,
  size bigint,
  created_at timestamptz not null default now()
);
create index on public.files (workspace_id);
create index on public.files (entity_kind, entity_id);

-- ============================================================================
-- Tags
-- ============================================================================
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text,
  unique (workspace_id, name)
);

create table public.entity_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_kind text not null,
  entity_id uuid not null,
  tag_id uuid not null references public.tags(id) on delete cascade,
  unique (entity_kind, entity_id, tag_id)
);
create index on public.entity_tags (workspace_id);
create index on public.entity_tags (tag_id);

-- ============================================================================
-- Timeline
-- ============================================================================
create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  entity_kind text not null,
  entity_id uuid not null,
  type text not null,
  title text not null,
  description text,
  actor_id uuid references public.profiles(id) on delete set null,
  timestamp timestamptz not null default now()
);
create index on public.timeline_events (workspace_id, timestamp desc);
create index on public.timeline_events (project_id);

-- ============================================================================
-- AI & memory
-- ============================================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.conversations (workspace_id);
create trigger set_updated_at before update on public.conversations
  for each row execute function public.tg_set_updated_at();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.messages (conversation_id, created_at);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scope text not null check (scope in ('workspace','project','user')),
  project_id uuid references public.projects(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);
create index on public.memories (workspace_id, scope);

create table public.embeddings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_kind text not null,
  entity_id uuid not null,
  chunk_index int not null default 0,
  content text not null,
  embedding vector(1536)
);
create index on public.embeddings (workspace_id);
create index on public.embeddings (entity_kind, entity_id);
create index on public.embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================================
-- Integrations & notifications
-- ============================================================================
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('gmail','gcalendar','gdrive','github','whatsapp','slack')),
  status text not null check (status in ('connected','disconnected','error')),
  credentials jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index on public.integrations (workspace_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (profile_id, read_at);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.profiles             enable row level security;
alter table public.workspaces           enable row level security;
alter table public.workspace_members    enable row level security;
alter table public.projects             enable row level security;
alter table public.notes                enable row level security;
alter table public.tasks                enable row level security;
alter table public.task_subtasks        enable row level security;
alter table public.ideas                enable row level security;
alter table public.decisions            enable row level security;
alter table public.meetings             enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.files                enable row level security;
alter table public.tags                 enable row level security;
alter table public.entity_tags          enable row level security;
alter table public.timeline_events      enable row level security;
alter table public.conversations        enable row level security;
alter table public.messages             enable row level security;
alter table public.memories             enable row level security;
alter table public.embeddings           enable row level security;
alter table public.integrations         enable row level security;
alter table public.notifications        enable row level security;

create policy "profiles self read" on public.profiles
  for select using (id = auth.uid());
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid());
create policy "profiles co-member read" on public.profiles
  for select using (
    exists (
      select 1
      from public.workspace_members me
      join public.workspace_members them on them.workspace_id = me.workspace_id
      where me.profile_id = auth.uid() and them.profile_id = profiles.id
    )
  );

create policy "workspaces member read" on public.workspaces
  for select using (public.is_workspace_member(id));
create policy "workspaces owner insert" on public.workspaces
  for insert with check (owner_id = auth.uid());
create policy "workspaces owner update" on public.workspaces
  for update using (owner_id = auth.uid());
create policy "workspaces owner delete" on public.workspaces
  for delete using (owner_id = auth.uid());

create policy "members read" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
create policy "members admin write" on public.workspace_members
  for all using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_members.workspace_id
        and m.profile_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

do $$
declare
  t text;
  tables text[] := array[
    'projects','notes','tasks','ideas','decisions','meetings',
    'files','tags','entity_tags','timeline_events','conversations',
    'memories','embeddings','integrations'
  ];
begin
  foreach t in array tables loop
    execute format($f$
      create policy "%1$s workspace read" on public.%1$I
        for select using (public.is_workspace_member(workspace_id));
      create policy "%1$s workspace write" on public.%1$I
        for all using (public.can_write_workspace(workspace_id))
        with check (public.can_write_workspace(workspace_id));
    $f$, t, t);
  end loop;
end $$;

create policy "task_subtasks read" on public.task_subtasks
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = task_subtasks.task_id
        and public.is_workspace_member(t.workspace_id)
    )
  );
create policy "task_subtasks write" on public.task_subtasks
  for all using (
    exists (
      select 1 from public.tasks t
      where t.id = task_subtasks.task_id
        and public.can_write_workspace(t.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_subtasks.task_id
        and public.can_write_workspace(t.workspace_id)
    )
  );

create policy "meeting_participants read" on public.meeting_participants
  for select using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_participants.meeting_id
        and public.is_workspace_member(m.workspace_id)
    )
  );
create policy "meeting_participants write" on public.meeting_participants
  for all using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_participants.meeting_id
        and public.can_write_workspace(m.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_participants.meeting_id
        and public.can_write_workspace(m.workspace_id)
    )
  );

create policy "messages read" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and public.is_workspace_member(c.workspace_id)
    )
  );
create policy "messages write" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and public.can_write_workspace(c.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and public.can_write_workspace(c.workspace_id)
    )
  );

create policy "notifications self read" on public.notifications
  for select using (profile_id = auth.uid());
create policy "notifications self update" on public.notifications
  for update using (profile_id = auth.uid());
