-- SimplixBrain — v2 graph layer
-- Adds entity-first model on top of v1 CRUD tables.
-- nodes = supertable, edges = typed relationships, revisions = history,
-- audit_log = who did what, inbox_items = pre-node capture,
-- knowledge_items/people/companies/emails/calendar_events = typed extensions.

-- ============================================================================
-- Kinds registry (data-driven — new kinds without migration)
-- ============================================================================
create table public.node_kinds (
  kind text primary key,
  category text not null check (category in ('core','communication','media','system','custom')),
  description text
);

insert into public.node_kinds (kind, category, description) values
  ('project',              'core',          'Iniciativa com objetivo e prazo'),
  ('person',               'core',          'Pessoa física'),
  ('company',              'core',          'Empresa ou organização'),
  ('document',             'core',          'Documento estruturado'),
  ('note',                 'core',          'Informação rápida / efêmera'),
  ('knowledge_item',       'core',          'Conhecimento permanente (PDF, artigo, livro, transcrição...)'),
  ('task',                 'core',          'Tarefa executável'),
  ('meeting',              'core',          'Reunião realizada ou agendada'),
  ('decision',             'core',          'Decisão registrada'),
  ('idea',                 'core',          'Ideia capturada'),
  ('memory',               'core',          'Fato consolidado sobre o mundo do usuário'),
  ('email',                'communication', 'E-mail (Gmail/Outlook)'),
  ('message',              'communication', 'Mensagem (Telegram/WhatsApp/Slack)'),
  ('chat_conversation',    'communication', 'Conversa com a IA'),
  ('chat_message',         'communication', 'Mensagem dentro de uma conversa com a IA'),
  ('file',                 'media',         'Arquivo bruto'),
  ('link',                 'media',         'URL externa'),
  ('code_snippet',         'media',         'Trecho de código'),
  ('transcript',           'media',         'Transcrição de áudio/vídeo'),
  ('image',                'media',         'Imagem'),
  ('inbox_item',           'system',        'Captura bruta pendente de classificação'),
  ('automation',           'system',        'Automação ou workflow'),
  ('prompt',               'system',        'Prompt salvo'),
  ('integration_account',  'system',        'Conta conectada a um provedor externo');

create table public.edge_kinds (
  kind text primary key,
  description text,
  reciprocal_of text references public.edge_kinds(kind)
);

insert into public.edge_kinds (kind, description) values
  ('belongs_to',    'Pertence a (genérico)'),
  ('part_of',       'É parte de'),
  ('authored_by',   'Autoria'),
  ('attends',       'Participa de'),
  ('works_at',      'Trabalha em'),
  ('client_of',     'É cliente de'),
  ('mentions',      'Menciona'),
  ('references',    'Referencia'),
  ('derived_from',  'Derivado de'),
  ('attached_to',   'Anexado a'),
  ('blocks',        'Bloqueia'),
  ('duplicates',    'Duplicata de'),
  ('answers',       'Responde a'),
  ('discussed_in',  'Discutido em'),
  ('scheduled_at',  'Agendado em');

-- ============================================================================
-- nodes (supertable)
-- ============================================================================
create table public.nodes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null references public.node_kinds(kind),
  title text not null,
  subtitle text,
  body text,
  meta jsonb not null default '{}'::jsonb,
  version int not null default 1,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')),    'A') ||
    setweight(to_tsvector('simple', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(body, '')),     'C')
  ) stored
);

create index on public.nodes (workspace_id, kind) where deleted_at is null;
create index on public.nodes (workspace_id, updated_at desc) where deleted_at is null;
create index on public.nodes using gin (search_tsv);
create index on public.nodes using gin (meta jsonb_path_ops);

create trigger set_updated_at before update on public.nodes
  for each row execute function public.tg_set_updated_at();

-- ============================================================================
-- node_revisions (versioning)
-- ============================================================================
create table public.node_revisions (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.nodes(id) on delete cascade,
  version int not null,
  snapshot jsonb not null,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now(),
  unique (node_id, version)
);

create index on public.node_revisions (node_id, version desc);

create or replace function public.tg_node_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (row(old.title, old.subtitle, old.body, old.meta)
      is distinct from
      row(new.title, new.subtitle, new.body, new.meta)) then
    insert into public.node_revisions (node_id, version, snapshot, changed_by)
    values (
      old.id,
      old.version,
      jsonb_build_object(
        'title', old.title,
        'subtitle', old.subtitle,
        'body', old.body,
        'meta', old.meta
      ),
      auth.uid()
    );
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

create trigger nodes_versioning before update on public.nodes
  for each row execute function public.tg_node_revision();

-- ============================================================================
-- edges (relationships)
-- ============================================================================
create table public.edges (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  from_node_id uuid not null references public.nodes(id) on delete cascade,
  to_node_id uuid not null references public.nodes(id) on delete cascade,
  kind text not null references public.edge_kinds(kind),
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (from_node_id, to_node_id, kind)
);

create index on public.edges (workspace_id, from_node_id, kind);
create index on public.edges (workspace_id, to_node_id, kind);

-- ============================================================================
-- audit_log
-- ============================================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('create','update','delete','restore','connect','disconnect','login','system')),
  entity_kind text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on public.audit_log (workspace_id, created_at desc);
create index on public.audit_log (entity_kind, entity_id, created_at desc);

-- ============================================================================
-- inbox_items (pre-classification capture)
-- ============================================================================
create table public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source text not null,
  raw_content text,
  raw_meta jsonb not null default '{}'::jsonb,
  state text not null default 'pending'
    check (state in ('pending','processing','ready','promoted','dismissed')),
  suggested_kind text references public.node_kinds(kind),
  suggested_meta jsonb not null default '{}'::jsonb,
  promoted_to_node_id uuid references public.nodes(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index on public.inbox_items (workspace_id, state, created_at desc);

-- ============================================================================
-- Typed extensions (1:1 with nodes)
-- ============================================================================
create table public.knowledge_items (
  node_id uuid primary key references public.nodes(id) on delete cascade,
  format text not null check (format in ('pdf','article','book','contract','video','audio','image','transcript','doc','presentation','link','other')),
  storage_path text,
  url text,
  mime text,
  size bigint,
  page_count int,
  duration_seconds int,
  ocr_text text,
  source text
);

create table public.people (
  node_id uuid primary key references public.nodes(id) on delete cascade,
  email text,
  phone text,
  role text,
  company_node_id uuid references public.nodes(id) on delete set null,
  handles jsonb not null default '{}'::jsonb,
  location text
);
create index on public.people (company_node_id);

create table public.companies (
  node_id uuid primary key references public.nodes(id) on delete cascade,
  industry text,
  website text,
  size text,
  location text
);

create table public.emails (
  node_id uuid primary key references public.nodes(id) on delete cascade,
  provider text not null check (provider in ('gmail','outlook','other')),
  external_id text,
  thread_id text,
  from_address text,
  to_addresses text[],
  cc_addresses text[],
  subject text,
  snippet text,
  received_at timestamptz,
  unique (provider, external_id)
);
create index on public.emails (thread_id);
create index on public.emails (received_at desc);

create table public.calendar_events (
  node_id uuid primary key references public.nodes(id) on delete cascade,
  provider text not null check (provider in ('gcal','outlook','other')),
  external_id text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  attendees jsonb not null default '[]'::jsonb,
  unique (provider, external_id)
);
create index on public.calendar_events (start_at);

-- ============================================================================
-- Link v1 typed tables into the graph (nullable FK for backfill)
-- ============================================================================
alter table public.projects  add column node_id uuid references public.nodes(id) on delete set null;
alter table public.notes     add column node_id uuid references public.nodes(id) on delete set null;
alter table public.tasks     add column node_id uuid references public.nodes(id) on delete set null;
alter table public.ideas     add column node_id uuid references public.nodes(id) on delete set null;
alter table public.decisions add column node_id uuid references public.nodes(id) on delete set null;
alter table public.meetings  add column node_id uuid references public.nodes(id) on delete set null;
alter table public.memories  add column node_id uuid references public.nodes(id) on delete set null;

create unique index projects_node_id_uniq   on public.projects  (node_id) where node_id is not null;
create unique index notes_node_id_uniq      on public.notes     (node_id) where node_id is not null;
create unique index tasks_node_id_uniq      on public.tasks     (node_id) where node_id is not null;
create unique index ideas_node_id_uniq      on public.ideas     (node_id) where node_id is not null;
create unique index decisions_node_id_uniq  on public.decisions (node_id) where node_id is not null;
create unique index meetings_node_id_uniq   on public.meetings  (node_id) where node_id is not null;
create unique index memories_node_id_uniq   on public.memories  (node_id) where node_id is not null;

-- ============================================================================
-- Backfill: create nodes for existing v1 rows (idempotent)
-- ============================================================================
do $$
declare
  r record;
  nid uuid;
begin
  for r in select id, workspace_id, name, description, objective from public.projects where node_id is null loop
    insert into public.nodes (workspace_id, kind, title, subtitle, body, meta)
    values (r.workspace_id, 'project', r.name, r.objective, r.description, jsonb_build_object('legacy_id', r.id))
    returning id into nid;
    update public.projects set node_id = nid where id = r.id;
  end loop;

  for r in select id, workspace_id, title, content, type from public.notes where node_id is null loop
    insert into public.nodes (workspace_id, kind, title, body, meta)
    values (r.workspace_id, 'note', r.title, r.content, jsonb_build_object('legacy_id', r.id, 'type', r.type))
    returning id into nid;
    update public.notes set node_id = nid where id = r.id;
  end loop;

  for r in select id, workspace_id, title, description from public.tasks where node_id is null loop
    insert into public.nodes (workspace_id, kind, title, body, meta)
    values (r.workspace_id, 'task', r.title, r.description, jsonb_build_object('legacy_id', r.id))
    returning id into nid;
    update public.tasks set node_id = nid where id = r.id;
  end loop;

  for r in select id, workspace_id, title, description from public.ideas where node_id is null loop
    insert into public.nodes (workspace_id, kind, title, body, meta)
    values (r.workspace_id, 'idea', r.title, r.description, jsonb_build_object('legacy_id', r.id))
    returning id into nid;
    update public.ideas set node_id = nid where id = r.id;
  end loop;

  for r in select id, workspace_id, title, decision, rationale from public.decisions where node_id is null loop
    insert into public.nodes (workspace_id, kind, title, subtitle, body, meta)
    values (r.workspace_id, 'decision', r.title, r.decision, r.rationale, jsonb_build_object('legacy_id', r.id))
    returning id into nid;
    update public.decisions set node_id = nid where id = r.id;
  end loop;

  for r in select id, workspace_id, title, agenda, notes from public.meetings where node_id is null loop
    insert into public.nodes (workspace_id, kind, title, subtitle, body, meta)
    values (r.workspace_id, 'meeting', r.title, r.agenda, r.notes, jsonb_build_object('legacy_id', r.id))
    returning id into nid;
    update public.meetings set node_id = nid where id = r.id;
  end loop;

  for r in select id, workspace_id, scope, content from public.memories where node_id is null loop
    insert into public.nodes (workspace_id, kind, title, body, meta)
    values (r.workspace_id, 'memory', left(r.content, 100), r.content, jsonb_build_object('legacy_id', r.id, 'scope', r.scope))
    returning id into nid;
    update public.memories set node_id = nid where id = r.id;
  end loop;

  -- Edges: everything under a project becomes part_of project
  insert into public.edges (workspace_id, from_node_id, to_node_id, kind)
  select t.workspace_id, t.node_id, p.node_id, 'part_of'
  from public.tasks t join public.projects p on p.id = t.project_id
  where t.node_id is not null and p.node_id is not null
  on conflict do nothing;

  insert into public.edges (workspace_id, from_node_id, to_node_id, kind)
  select n.workspace_id, n.node_id, p.node_id, 'part_of'
  from public.notes n join public.projects p on p.id = n.project_id
  where n.node_id is not null and p.node_id is not null
  on conflict do nothing;

  insert into public.edges (workspace_id, from_node_id, to_node_id, kind)
  select i.workspace_id, i.node_id, p.node_id, 'part_of'
  from public.ideas i join public.projects p on p.id = i.project_id
  where i.node_id is not null and p.node_id is not null
  on conflict do nothing;

  insert into public.edges (workspace_id, from_node_id, to_node_id, kind)
  select d.workspace_id, d.node_id, p.node_id, 'part_of'
  from public.decisions d join public.projects p on p.id = d.project_id
  where d.node_id is not null and p.node_id is not null
  on conflict do nothing;

  insert into public.edges (workspace_id, from_node_id, to_node_id, kind)
  select m.workspace_id, m.node_id, p.node_id, 'part_of'
  from public.meetings m join public.projects p on p.id = m.project_id
  where m.node_id is not null and p.node_id is not null
  on conflict do nothing;
end $$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.node_kinds       enable row level security;
alter table public.edge_kinds       enable row level security;
alter table public.nodes            enable row level security;
alter table public.node_revisions   enable row level security;
alter table public.edges            enable row level security;
alter table public.audit_log        enable row level security;
alter table public.inbox_items      enable row level security;
alter table public.knowledge_items  enable row level security;
alter table public.people           enable row level security;
alter table public.companies        enable row level security;
alter table public.emails           enable row level security;
alter table public.calendar_events  enable row level security;

create policy "node_kinds public read" on public.node_kinds
  for select using (auth.role() = 'authenticated');
create policy "edge_kinds public read" on public.edge_kinds
  for select using (auth.role() = 'authenticated');

create policy "nodes workspace read" on public.nodes
  for select using (public.is_workspace_member(workspace_id));
create policy "nodes workspace write" on public.nodes
  for all using (public.can_write_workspace(workspace_id))
  with check (public.can_write_workspace(workspace_id));

create policy "edges workspace read" on public.edges
  for select using (public.is_workspace_member(workspace_id));
create policy "edges workspace write" on public.edges
  for all using (public.can_write_workspace(workspace_id))
  with check (public.can_write_workspace(workspace_id));

create policy "audit_log workspace read" on public.audit_log
  for select using (workspace_id is null or public.is_workspace_member(workspace_id));

create policy "inbox_items workspace read" on public.inbox_items
  for select using (public.is_workspace_member(workspace_id));
create policy "inbox_items workspace write" on public.inbox_items
  for all using (public.can_write_workspace(workspace_id))
  with check (public.can_write_workspace(workspace_id));

create policy "node_revisions read" on public.node_revisions
  for select using (
    exists (select 1 from public.nodes n
            where n.id = node_revisions.node_id
              and public.is_workspace_member(n.workspace_id))
  );

do $$
declare
  t text;
  tables text[] := array['knowledge_items','people','companies','emails','calendar_events'];
begin
  foreach t in array tables loop
    execute format($f$
      create policy "%1$s read" on public.%1$I
        for select using (
          exists (
            select 1 from public.nodes n
            where n.id = %1$I.node_id
              and public.is_workspace_member(n.workspace_id)
          )
        );
      create policy "%1$s write" on public.%1$I
        for all using (
          exists (
            select 1 from public.nodes n
            where n.id = %1$I.node_id
              and public.can_write_workspace(n.workspace_id)
          )
        )
        with check (
          exists (
            select 1 from public.nodes n
            where n.id = %1$I.node_id
              and public.can_write_workspace(n.workspace_id)
          )
        );
    $f$, t);
  end loop;
end $$;
