"use client";

import Link from "next/link";
import {
  Brain,
  CalendarClock,
  CheckSquare,
  Compass,
  FileText,
  History,
  Lightbulb,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects, useTimeline } from "@/hooks/use-data";
import {
  TIMELINE_EVENT_LABEL,
  TIMELINE_EVENT_TYPE,
  type TimelineEventType,
} from "@/lib/constants/enums";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";
import type { TimelineEvent } from "@/types";

const KIND_META: Record<
  TimelineEvent["entityKind"],
  { icon: LucideIcon; color: string; hrefBase: string }
> = {
  project: { icon: Compass, color: "hsl(var(--hue-lime))", hrefBase: "/projects" },
  note: { icon: FileText, color: "hsl(var(--hue-cyan))", hrefBase: "/notes" },
  task: { icon: CheckSquare, color: "hsl(var(--hue-amber))", hrefBase: "/tasks" },
  idea: { icon: Lightbulb, color: "hsl(var(--hue-fuchsia))", hrefBase: "/ideas" },
  decision: { icon: Brain, color: "hsl(var(--hue-violet))", hrefBase: "/decisions" },
  meeting: {
    icon: CalendarClock,
    color: "hsl(var(--hue-rose))",
    hrefBase: "/meetings",
  },
};

type Range = "all" | "today" | "7d" | "30d";

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function groupByDay(events: TimelineEvent[]) {
  const map = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const key = e.timestamp.slice(0, 10);
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, list]) => ({ day, list }));
}

function formatDayLabel(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

export function TimelineView() {
  const events = useTimeline();
  const projects = useProjects();

  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [type, setType] = useState<string>("all");
  const [range, setRange] = useState<Range>("all");

  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const now = Date.now();
    return events.filter((e) => {
      if (projectId === "none" && e.projectId) return false;
      if (
        projectId !== "all" &&
        projectId !== "none" &&
        e.projectId !== projectId
      )
        return false;
      if (type !== "all" && e.type !== (type as TimelineEventType)) return false;
      if (range !== "all") {
        const ts = new Date(e.timestamp).getTime();
        const cutoff =
          range === "today"
            ? now - 86_400_000
            : range === "7d"
              ? now - 7 * 86_400_000
              : now - 30 * 86_400_000;
        if (ts < cutoff) return false;
      }
      if (!q) return true;
      return normalize(e.title).includes(q);
    });
  }, [events, query, projectId, type, range]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const hasFilters =
    query !== "" || projectId !== "all" || type !== "all" || range !== "all";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <p className="text-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Registro cronológico
        </p>
        <h1 className="text-display text-3xl font-semibold">Timeline</h1>
        <p className="text-sm text-muted-foreground">
          {events.length} evento{events.length === 1 ? "" : "s"} no workspace.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar evento…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="today">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              {TIMELINE_EVENT_TYPE.map((t) => (
                <SelectItem key={t} value={t}>
                  {TIMELINE_EVENT_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos projetos</SelectItem>
              <SelectItem value="none">Sem projeto</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setQuery("");
                setType("all");
                setRange("all");
                setProjectId("all");
              }}
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          ) : null}
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sem eventos ainda."
          description="Ações do workspace aparecem aqui automaticamente."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum evento com esses filtros."
          description="Ajuste o período, tipo ou projeto."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.day} className="space-y-2">
              <div className="flex items-center gap-3">
                <p className="text-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {formatDayLabel(group.day)}
                </p>
                <div className="h-px flex-1 bg-gradient-to-r from-border via-border/60 to-transparent" />
              </div>
              <Card className="border-border/60 bg-card/50">
                <CardContent className="p-0">
                  <ol className="divide-y divide-border/40">
                    {group.list.map((event) => {
                      const meta = KIND_META[event.entityKind];
                      const Icon = meta.icon;
                      const project = event.projectId
                        ? projectById.get(event.projectId)
                        : undefined;
                      const href =
                        event.entityKind === "project" && project
                          ? `/projects/${project.slug}`
                          : event.entityKind === "note"
                            ? `/notes/${event.entityId}`
                            : meta.hrefBase;
                      return (
                        <li key={event.id} className="flex items-center gap-3 p-3">
                          <span
                            aria-hidden
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                            style={{
                              background: `${meta.color}22`,
                              color: meta.color,
                            }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">
                              <Link
                                href={href}
                                className="hover:text-primary"
                              >
                                {event.title}
                              </Link>
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground",
                              )}
                            >
                              <span>{TIMELINE_EVENT_LABEL[event.type]}</span>
                              {project ? (
                                <>
                                  <span aria-hidden>•</span>
                                  <span>{project.name}</span>
                                </>
                              ) : null}
                              <span aria-hidden>•</span>
                              <span title={formatDateTime(event.timestamp)}>
                                {formatRelative(event.timestamp)}
                              </span>
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
