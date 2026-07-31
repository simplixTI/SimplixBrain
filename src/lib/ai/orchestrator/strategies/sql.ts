import type { OrchestratedHit, Strategy, StrategyResult } from "../types";

/**
 * Pattern-matched SQL strategy — handles a curated set of "obvious" queries
 * without touching an LLM. Cost = zero. Returns null when no pattern matches,
 * so the router can fall through to hybrid retrieval + LLM.
 *
 * Patterns (Portuguese-first):
 *   - listar tarefas [pendentes|concluídas|atrasadas] [de <projeto>]
 *   - quantos projetos [ativos|arquivados]
 *   - listar projetos
 *   - listar reuniões [hoje|semana]
 */

const RE_LIST_TASKS = /^\s*(listar?|liste|mostrar?|mostre|quais)\s+.*\btarefas?\b/i;
const RE_COUNT_PROJECTS = /^\s*(quantos?|quantas?)\s+projetos?\b/i;
const RE_LIST_PROJECTS = /^\s*(listar?|liste|mostrar?|mostre|quais)\s+projetos?\b/i;
const RE_LIST_MEETINGS = /^\s*(listar?|liste|mostrar?|mostre|quais)\s+reuni[oõ]es?\b/i;

function extractProjectFilter(query: string): string | null {
  const m = query.match(/\b(?:de|do|da)\s+(?:projeto\s+)?["']?([\p{L}0-9 ]{2,60}?)["']?\s*(?:\?|\.|$)/iu);
  return m?.[1]?.trim() ?? null;
}

function extractStatusFilter(query: string): "pending" | "done" | "overdue" | null {
  if (/\bpendentes?\b/i.test(query)) return "pending";
  if (/\bconclu[ií]das?\b|\bfeitas?\b|\bfinalizadas?\b/i.test(query)) return "done";
  if (/\batrasadas?\b|\bvencidas?\b/i.test(query)) return "overdue";
  return null;
}

async function listTasks(query: string): Promise<Strategy> {
  return async (ctx) => {
    if (!RE_LIST_TASKS.test(query)) return null;

    const status = extractStatusFilter(query);
    const projectName = extractProjectFilter(query);

    let projectId: string | null = null;
    if (projectName) {
      const { data: proj } = await ctx.supabase
        .from("projects")
        .select("id, name")
        .eq("workspace_id", ctx.request.workspaceId)
        .ilike("name", `%${projectName}%`)
        .limit(1)
        .maybeSingle();
      projectId = proj?.id ?? null;
      if (!projectId) {
        return {
          answer: `Não encontrei o projeto "${projectName}" no Brain.`,
          hits: [],
          meta: { llmSkipped: true },
        } satisfies StrategyResult;
      }
    }

    let q = ctx.supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, project_id, node_id, projects(name)")
      .eq("workspace_id", ctx.request.workspaceId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(30);

    if (projectId) q = q.eq("project_id", projectId);
    if (status === "pending") q = q.not("status", "in", "(done,cancelled)");
    if (status === "done") q = q.eq("status", "done");
    if (status === "overdue") {
      q = q
        .lt("due_date", new Date().toISOString().slice(0, 10))
        .not("status", "in", "(done,cancelled)");
    }

    const { data, error } = await q;
    if (error) throw error;

    const rows = data ?? [];
    if (rows.length === 0) {
      return {
        answer: projectName
          ? `Sem tarefas${status ? ` (${status})` : ""} para "${projectName}".`
          : `Sem tarefas${status ? ` (${status})` : ""} no workspace.`,
        hits: [],
        meta: { llmSkipped: true },
      };
    }

    const lines = rows.map((t, i) => {
      const dueTag = t.due_date ? ` · vence ${t.due_date}` : "";
      const projTag = t.projects?.name ? ` · ${t.projects.name}` : "";
      const statusTag = t.status ? ` [${t.status}]` : "";
      return `${i + 1}. ${t.title}${statusTag}${dueTag}${projTag}`;
    });

    const hits: OrchestratedHit[] = rows
      .filter((t): t is typeof t & { node_id: string } => !!t.node_id)
      .map((t) => ({
        nodeId: t.node_id,
        kind: "task",
        title: t.title,
        score: 1,
        sources: ["sql"],
      }));

    return {
      answer: `${rows.length} tarefa(s)${status ? ` (${status})` : ""}${projectName ? ` de "${projectName}"` : ""}:\n\n${lines.join("\n")}`,
      hits,
      meta: { llmSkipped: true },
    };
  };
}

async function countProjects(query: string): Promise<Strategy> {
  return async (ctx) => {
    if (!RE_COUNT_PROJECTS.test(query)) return null;

    const wantsActive = /\bativos?\b/i.test(query);
    const wantsArchived = /\barquivados?\b/i.test(query);

    let q = ctx.supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.request.workspaceId);

    if (wantsActive) q = q.eq("status", "active");
    if (wantsArchived) q = q.eq("status", "archived");

    const { count, error } = await q;
    if (error) throw error;

    const filter = wantsActive ? "ativos" : wantsArchived ? "arquivados" : "no total";
    return {
      answer: `${count ?? 0} projeto(s) ${filter}.`,
      hits: [],
      meta: { llmSkipped: true },
    };
  };
}

async function listProjects(query: string): Promise<Strategy> {
  return async (ctx) => {
    if (!RE_LIST_PROJECTS.test(query)) return null;

    const { data, error } = await ctx.supabase
      .from("projects")
      .select("id, name, status, priority, due_date, node_id")
      .eq("workspace_id", ctx.request.workspaceId)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) {
      return { answer: "Nenhum projeto no workspace.", hits: [], meta: { llmSkipped: true } };
    }

    const lines = rows.map((p, i) => {
      const parts = [p.name];
      if (p.status) parts.push(`[${p.status}]`);
      if (p.priority) parts.push(`prio:${p.priority}`);
      if (p.due_date) parts.push(`prazo ${p.due_date}`);
      return `${i + 1}. ${parts.join(" · ")}`;
    });

    const hits: OrchestratedHit[] = rows
      .filter((p): p is typeof p & { node_id: string } => !!p.node_id)
      .map((p) => ({
        nodeId: p.node_id,
        kind: "project",
        title: p.name,
        score: 1,
        sources: ["sql"],
      }));

    return {
      answer: `${rows.length} projeto(s):\n\n${lines.join("\n")}`,
      hits,
      meta: { llmSkipped: true },
    };
  };
}

async function listMeetings(query: string): Promise<Strategy> {
  return async (ctx) => {
    if (!RE_LIST_MEETINGS.test(query)) return null;

    const today = new Date().toISOString().slice(0, 10);
    const wantsToday = /\bhoje\b/i.test(query);
    const wantsWeek = /\bsemana\b/i.test(query);

    let q = ctx.supabase
      .from("meetings")
      .select("id, title, date, start_time, node_id, projects(name)")
      .eq("workspace_id", ctx.request.workspaceId)
      .order("date", { ascending: false })
      .limit(30);

    if (wantsToday) q = q.eq("date", today);
    else if (wantsWeek) {
      const in7 = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
      q = q.gte("date", today).lte("date", in7);
    }

    const { data, error } = await q;
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) {
      return { answer: "Nenhuma reunião encontrada.", hits: [], meta: { llmSkipped: true } };
    }

    const lines = rows.map((m, i) => {
      const proj = m.projects?.name ? ` · ${m.projects.name}` : "";
      const time = m.start_time ? ` ${m.start_time}` : "";
      return `${i + 1}. ${m.date}${time} — ${m.title}${proj}`;
    });

    const hits: OrchestratedHit[] = rows
      .filter((m): m is typeof m & { node_id: string } => !!m.node_id)
      .map((m) => ({
        nodeId: m.node_id,
        kind: "meeting",
        title: m.title,
        score: 1,
        sources: ["sql"],
      }));

    return {
      answer: `${rows.length} reunião(ões):\n\n${lines.join("\n")}`,
      hits,
      meta: { llmSkipped: true },
    };
  };
}

export async function sqlStrategy(ctx: {
  request: { query: string };
}): Promise<Strategy> {
  const query = ctx.request.query;
  const handlers = await Promise.all([
    listTasks(query),
    countProjects(query),
    listProjects(query),
    listMeetings(query),
  ]);

  return async (fullCtx) => {
    for (const handler of handlers) {
      const result = await handler(fullCtx);
      if (result) return result;
    }
    return null;
  };
}
