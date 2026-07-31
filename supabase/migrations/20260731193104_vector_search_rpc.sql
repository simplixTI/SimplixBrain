-- SimplixBrain — v3 vector search
-- Adds direct node_id link on embeddings and the match_nodes RPC
-- used by src/lib/brain/retrieval.ts vector branch.

alter table public.embeddings
  add column node_id uuid references public.nodes(id) on delete cascade;

create index on public.embeddings (node_id);

-- Backfill node_id for rows already using entity_kind='node'
update public.embeddings
   set node_id = entity_id
 where entity_kind = 'node'
   and node_id is null;

-- ============================================================================
-- match_nodes: cosine similarity, workspace-scoped
-- ============================================================================
create or replace function public.match_nodes(
  query_embedding vector(1536),
  ws_id uuid,
  match_kinds text[] default null,
  match_count int default 20,
  min_similarity float default 0.0
)
returns table (
  node_id uuid,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    n.id as node_id,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.embeddings e
  join public.nodes n on n.id = e.node_id
  where e.workspace_id = ws_id
    and n.deleted_at is null
    and public.is_workspace_member(ws_id)
    and (match_kinds is null or n.kind = any(match_kinds))
    and e.embedding is not null
    and (1 - (e.embedding <=> query_embedding)) >= min_similarity
  order by e.embedding <=> query_embedding asc
  limit match_count;
$$;

grant execute on function public.match_nodes(vector, uuid, text[], int, float) to authenticated;
