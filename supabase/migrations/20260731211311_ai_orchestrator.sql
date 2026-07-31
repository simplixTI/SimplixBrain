-- SimplixBrain — v4 AI Orchestrator
-- ai_models: data-driven routing table (task_class → best model)
-- ai_usage: per-call audit for cost tracking and dashboards

-- ============================================================================
-- ai_models
-- ============================================================================
create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('openai','anthropic','google','ollama','mock')),
  model text not null,
  task_class text not null check (task_class in (
    'classifier','embed','summarization','translation','extraction',
    'generation','coding','planner','conversation','vision'
  )),
  priority int not null default 100,
  enabled boolean not null default true,
  max_tokens int not null default 4096,
  temperature numeric(3,2) not null default 0.2,
  input_cost_per_mtok numeric(10,4),
  output_cost_per_mtok numeric(10,4),
  cost_priority int not null default 5 check (cost_priority between 1 and 10),
  quality_priority int not null default 5 check (quality_priority between 1 and 10),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.ai_models (task_class, enabled, priority);
create index on public.ai_models (workspace_id) where workspace_id is not null;
create unique index ai_models_default_uniq
  on public.ai_models (provider, model, task_class)
  where workspace_id is null;

create trigger set_updated_at before update on public.ai_models
  for each row execute function public.tg_set_updated_at();

-- ============================================================================
-- ai_usage (immutable audit log)
-- ============================================================================
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  provider text not null,
  model text not null,
  task_class text,
  input_tokens int,
  output_tokens int,
  estimated_cost numeric(12,6),
  duration_ms int,
  cache_hit boolean not null default false,
  request_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on public.ai_usage (workspace_id, created_at desc);
create index on public.ai_usage (provider, model, created_at desc);
create index on public.ai_usage (created_at desc);

-- ============================================================================
-- Seed default models (workspace_id = null → global default)
-- Pricing is placeholder; edit rows anytime to reflect actual list prices.
-- ============================================================================
insert into public.ai_models
  (provider, model, task_class, priority, max_tokens, temperature,
   input_cost_per_mtok, output_cost_per_mtok, cost_priority, quality_priority, enabled)
values
  -- Anthropic
  ('anthropic', 'claude-haiku-4-5',   'classifier',    10,  1024, 0.0,  0.80,  4.00, 9, 4, true),
  ('anthropic', 'claude-haiku-4-5',   'summarization', 20,  4096, 0.2,  0.80,  4.00, 9, 5, true),
  ('anthropic', 'claude-haiku-4-5',   'translation',   20,  4096, 0.2,  0.80,  4.00, 9, 5, true),
  ('anthropic', 'claude-haiku-4-5',   'extraction',    20,  2048, 0.0,  0.80,  4.00, 9, 6, true),
  ('anthropic', 'claude-haiku-4-5',   'conversation',  30,  4096, 0.3,  0.80,  4.00, 9, 5, true),
  ('anthropic', 'claude-sonnet-4-6',  'generation',    20,  8192, 0.4,  3.00, 15.00, 6, 8, true),
  ('anthropic', 'claude-sonnet-4-6',  'coding',        10,  8192, 0.2,  3.00, 15.00, 5, 9, true),
  ('anthropic', 'claude-sonnet-4-6',  'planner',       20,  8192, 0.3,  3.00, 15.00, 6, 9, true),
  ('anthropic', 'claude-sonnet-4-6',  'conversation',  20,  4096, 0.3,  3.00, 15.00, 6, 8, true),
  ('anthropic', 'claude-opus-4-7',    'generation',    30, 16384, 0.5, 15.00, 75.00, 2,10, true),
  ('anthropic', 'claude-opus-4-7',    'planner',       10, 16384, 0.4, 15.00, 75.00, 2,10, true),

  -- OpenAI
  ('openai',    'text-embedding-3-small', 'embed',     10,     0, 0.0,  0.02,  0.00,10, 7, true),
  ('openai',    'gpt-4o-mini',       'classifier',    20,  1024, 0.0,  0.15,  0.60, 9, 4, true),
  ('openai',    'gpt-4o-mini',       'conversation',  40,  4096, 0.3,  0.15,  0.60,10, 5, true),
  ('openai',    'gpt-4o-mini',       'summarization', 30,  4096, 0.2,  0.15,  0.60,10, 5, true),
  ('openai',    'gpt-4o',            'generation',    40,  8192, 0.4,  2.50, 10.00, 5, 8, true),
  ('openai',    'gpt-4o',            'coding',        30,  8192, 0.2,  2.50, 10.00, 5, 8, true),

  -- Google Gemini (disabled by default — waiting for provider impl + key)
  ('google',    'gemini-2.0-flash',  'summarization', 10,  4096, 0.2,  0.075, 0.30,10, 6, false),
  ('google',    'gemini-2.0-flash',  'translation',   10,  4096, 0.2,  0.075, 0.30,10, 6, false),
  ('google',    'gemini-2.0-pro',    'vision',        10,  4096, 0.2,  1.25,  5.00, 7, 8, false);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.ai_models enable row level security;
alter table public.ai_usage  enable row level security;

-- ai_models: global defaults readable by all authenticated users;
-- workspace-scoped rows only visible to workspace members.
create policy "ai_models read defaults" on public.ai_models
  for select using (
    workspace_id is null
    or public.is_workspace_member(workspace_id)
  );

create policy "ai_models workspace write" on public.ai_models
  for all using (
    workspace_id is not null and public.can_write_workspace(workspace_id)
  )
  with check (
    workspace_id is not null and public.can_write_workspace(workspace_id)
  );

-- ai_usage: workspace members read their workspace's usage
create policy "ai_usage workspace read" on public.ai_usage
  for select using (
    workspace_id is null
    or public.is_workspace_member(workspace_id)
  );

-- Only service_role writes ai_usage (the orchestrator uses admin client
-- for fire-and-forget cost recording). No authenticated write policy on
-- purpose — clients cannot inflate their own usage stats.
