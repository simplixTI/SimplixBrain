"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Brain,
  CalendarClock,
  CheckSquare,
  Compass,
  FileText,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useDecisions,
  useIdeas,
  useMeetings,
  useNotes,
  useProjects,
  useTasks,
} from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import type { Decision, Idea, Meeting, Note, Project, Task } from "@/types";

type EntityKind =
  | "project"
  | "note"
  | "task"
  | "idea"
  | "decision"
  | "meeting";

interface GraphNode {
  id: string;
  label: string;
  kind: EntityKind;
  color: string;
  size: number;
  href: string;
  meta?: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string;
  target: string;
  strength?: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Lazy-load the canvas graph; it uses window internally.
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((m) => m.default),
  { ssr: false, loading: () => null },
);

const KIND_COLORS: Record<EntityKind, string> = {
  project: "#a78bfa", // violet
  note: "#38bdf8", // sky
  task: "#facc15", // amber
  idea: "#f472b6", // pink
  decision: "#4ade80", // emerald
  meeting: "#f97316", // orange
};

const KIND_LABEL: Record<EntityKind, string> = {
  project: "Projetos",
  note: "Notas",
  task: "Tarefas",
  idea: "Ideias",
  decision: "Decisões",
  meeting: "Reuniões",
};

const KIND_ICON: Record<EntityKind, typeof Brain> = {
  project: Compass,
  note: FileText,
  task: CheckSquare,
  idea: Lightbulb,
  decision: Brain,
  meeting: CalendarClock,
};

function truncateLabel(text: string, max = 36): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

function buildGraph(
  projects: Project[],
  notes: Note[],
  tasks: Task[],
  ideas: Idea[],
  decisions: Decision[],
  meetings: Meeting[],
  enabled: Record<EntityKind, boolean>,
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  if (enabled.project) {
    for (const p of projects) {
      nodes.push({
        id: p.id,
        label: p.name,
        kind: "project",
        color: p.color ?? KIND_COLORS.project,
        size: 8,
        href: `/projects/${p.slug}`,
        meta: p.status,
      });
    }
  }

  const addChild = (
    id: string,
    label: string,
    kind: Exclude<EntityKind, "project">,
    href: string,
    projectId?: string,
    meta?: string,
  ) => {
    if (!enabled[kind]) return;
    nodes.push({
      id,
      label: truncateLabel(label),
      kind,
      color: KIND_COLORS[kind],
      size: 3.5,
      href,
      meta,
    });
    if (projectId && enabled.project) {
      links.push({ source: projectId, target: id, strength: 0.4 });
    }
  };

  for (const n of notes)
    addChild(n.id, n.title, "note", `/notes/${n.id}`, n.projectId, n.type);
  for (const t of tasks)
    addChild(t.id, t.title, "task", `/tasks`, t.projectId, t.status);
  for (const i of ideas)
    addChild(i.id, i.title, "idea", `/ideas`, i.projectId, i.status);
  for (const d of decisions)
    addChild(
      d.id,
      d.title,
      "decision",
      `/decisions`,
      d.projectId,
      d.status,
    );
  for (const m of meetings)
    addChild(
      m.id,
      m.title,
      "meeting",
      `/meetings`,
      m.projectId,
      undefined,
    );

  // Tag co-occurrence: build extra edges between siblings sharing a tag.
  const nodesWithTags: {
    node: GraphNode;
    tags: string[];
  }[] = [];
  for (const n of notes)
    if (enabled.note)
      nodesWithTags.push({ node: nodes.find((x) => x.id === n.id)!, tags: n.tags });
  for (const t of tasks)
    if (enabled.task)
      nodesWithTags.push({ node: nodes.find((x) => x.id === t.id)!, tags: t.tags });
  for (const i of ideas)
    if (enabled.idea)
      nodesWithTags.push({ node: nodes.find((x) => x.id === i.id)!, tags: i.tags });
  for (const d of decisions)
    if (enabled.decision)
      nodesWithTags.push({ node: nodes.find((x) => x.id === d.id)!, tags: d.tags });

  const tagMap = new Map<string, string[]>();
  for (const { node, tags } of nodesWithTags) {
    if (!node) continue;
    for (const t of tags) {
      const key = t.toLowerCase();
      const arr = tagMap.get(key) ?? [];
      arr.push(node.id);
      tagMap.set(key, arr);
    }
  }
  for (const arr of tagMap.values()) {
    if (arr.length < 2) continue;
    // Only connect first two to avoid dense clutter
    for (let a = 0; a < arr.length - 1; a++) {
      links.push({ source: arr[a]!, target: arr[a + 1]!, strength: 0.15 });
    }
  }

  return { nodes, links };
}

const ALL_KINDS: EntityKind[] = [
  "project",
  "note",
  "task",
  "idea",
  "decision",
  "meeting",
];

export function KnowledgeGraph() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<{
    zoomToFit?: (duration?: number, padding?: number) => void;
    d3ReheatSimulation?: () => void;
  } | null>(null);

  const projects = useProjects();
  const notes = useNotes();
  const tasks = useTasks();
  const ideas = useIdeas();
  const decisions = useDecisions();
  const meetings = useMeetings();

  const [enabled, setEnabled] = useState<Record<EntityKind, boolean>>({
    project: true,
    note: true,
    task: true,
    idea: true,
    decision: true,
    meeting: true,
  });
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: 800,
    h: 520,
  });
  const [hovered, setHovered] = useState<GraphNode | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(
    () =>
      buildGraph(projects, notes, tasks, ideas, decisions, meetings, enabled),
    [projects, notes, tasks, ideas, decisions, meetings, enabled],
  );

  const totalCount = data.nodes.length;

  const counts = useMemo(
    () => ({
      project: projects.length,
      note: notes.length,
      task: tasks.length,
      idea: ideas.length,
      decision: decisions.length,
      meeting: meetings.length,
    }),
    [projects, notes, tasks, ideas, decisions, meetings],
  );

  useEffect(() => {
    // Fit after the graph mounts / data changes.
    const handle = window.setTimeout(() => {
      graphRef.current?.zoomToFit?.(400, 40);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [data]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.href) router.push(node.href);
    },
    [router],
  );

  const drawNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, scale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const isProject = node.kind === "project";
      const radius = isProject ? 7 : 3.5;

      // Halo glow
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      grad.addColorStop(0, `${node.color}66`);
      grad.addColorStop(1, `${node.color}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 0.6 / scale;
      ctx.stroke();

      // Label (only project or when zoomed in)
      if (isProject || scale > 2.4) {
        ctx.font = `${isProject ? 6 : 4}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "rgba(230,230,240,0.9)";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(node.label, x, y + radius + 2);
      }
    },
    [],
  );

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Ainda não há nada pra visualizar."
        description="Crie projetos, notas ou tarefas para o grafo ganhar vida."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {ALL_KINDS.map((kind) => {
          const Icon = KIND_ICON[kind];
          const on = enabled[kind];
          return (
            <button
              key={kind}
              type="button"
              onClick={() =>
                setEnabled((prev) => ({ ...prev, [kind]: !prev[kind] }))
              }
              className={cn(
                "text-mono inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-widest transition-all",
                on
                  ? "border-transparent text-foreground shadow-[0_0_10px_-2px_var(--tw-shadow-color)]"
                  : "border-border/60 bg-card/40 text-muted-foreground opacity-60 hover:opacity-100",
              )}
              style={
                on
                  ? {
                      backgroundColor: `${KIND_COLORS[kind]}22`,
                      color: KIND_COLORS[kind],
                      boxShadow: `0 0 12px -2px ${KIND_COLORS[kind]}66`,
                    }
                  : undefined
              }
            >
              <Icon className="h-3 w-3" />
              {KIND_LABEL[kind]}
              <span className="opacity-70">·{counts[kind]}</span>
            </button>
          );
        })}
      </div>

      <Card className="surface overflow-hidden">
        <CardContent className="relative p-0">
          <div
            ref={containerRef}
            className="relative h-[560px] w-full bg-[radial-gradient(circle_at_center,hsl(var(--hue-violet)/0.08),transparent_70%)]"
          >
            {size.w > 0 ? (
              <ForceGraph2D
                ref={graphRef as never}
                width={size.w}
                height={size.h}
                graphData={data}
                nodeRelSize={4}
                nodeCanvasObject={drawNode as never}
                nodeCanvasObjectMode={() => "replace"}
                linkColor={() => "rgba(148,163,184,0.22)"}
                linkWidth={0.6}
                cooldownTicks={80}
                enableNodeDrag
                onNodeClick={handleNodeClick as never}
                onNodeHover={(node: unknown) => setHovered(node as GraphNode | null)}
                d3AlphaDecay={0.03}
                d3VelocityDecay={0.32}
                backgroundColor="transparent"
              />
            ) : null}

            {hovered ? (
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-xs animate-slide-up rounded-lg border border-border/60 bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
                <p className="text-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {KIND_LABEL[hovered.kind]}
                  {hovered.meta ? ` · ${hovered.meta}` : ""}
                </p>
                <p className="text-sm font-medium">{hovered.label}</p>
              </div>
            ) : null}

            <div className="pointer-events-none absolute bottom-3 right-3 rounded-md border border-border/60 bg-card/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
              {totalCount} nós · {data.links.length} conexões
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Clique em um nó para navegar. Arraste para reorganizar. Use os chips
        acima para filtrar por tipo.
      </p>
    </div>
  );
}
