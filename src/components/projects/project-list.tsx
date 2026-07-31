"use client";

import { Compass, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  type Priority,
  type ProjectStatus,
} from "@/lib/constants/enums";
import { useProjects, useTasks } from "@/hooks/use-data";

import { ProjectCard } from "./project-card";
import { ProjectForm } from "./project-form";
import {
  ProjectListToolbar,
  type SortMode,
  type ViewMode,
} from "./project-list-toolbar";
import { ProjectRow } from "./project-row";

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function ProjectList() {
  const projects = useProjects();
  const tasks = useTasks();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [sort, setSort] = useState<SortMode>("updated");
  const [view, setView] = useState<ViewMode>("cards");
  const [createOpen, setCreateOpen] = useState(false);

  const openTaskCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      if (t.status === "done" || t.status === "cancelled") continue;
      if (!t.projectId) continue;
      map.set(t.projectId, (map.get(t.projectId) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return projects
      .filter((p) => {
        if (status !== "all" && p.status !== (status as ProjectStatus))
          return false;
        if (priority !== "all" && p.priority !== (priority as Priority))
          return false;
        if (!q) return true;
        const haystack = [
          p.name,
          p.description,
          p.objective,
          p.category ?? "",
          p.tags.join(" "),
        ]
          .map(normalize)
          .join(" ");
        return haystack.includes(q);
      })
      .sort((a, b) => {
        switch (sort) {
          case "name":
            return a.name.localeCompare(b.name);
          case "created":
            return b.createdAt.localeCompare(a.createdAt);
          case "progress":
            return b.progress - a.progress;
          case "priority":
            return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          case "updated":
          default:
            return b.updatedAt.localeCompare(a.updatedAt);
        }
      });
  }, [projects, query, status, priority, sort]);

  const hasFilters = query !== "" || status !== "all" || priority !== "all";
  const isEmptyWorkspace = projects.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} projeto{projects.length === 1 ? "" : "s"} no workspace.
          </p>
        </div>
        <ProjectForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Novo projeto
            </Button>
          }
        />
      </div>

      <ProjectListToolbar
        query={query}
        onQuery={setQuery}
        status={status}
        onStatus={setStatus}
        priority={priority}
        onPriority={setPriority}
        sort={sort}
        onSort={setSort}
        view={view}
        onView={setView}
        hasFilters={hasFilters}
        onReset={() => {
          setQuery("");
          setStatus("all");
          setPriority("all");
        }}
      />

      {isEmptyWorkspace ? (
        <EmptyState
          icon={Compass}
          title="Nenhum projeto ainda."
          description="Crie seu primeiro projeto para começar a organizar seu trabalho."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Criar projeto
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Nada bate com os filtros."
          description="Ajuste a busca, o status ou a prioridade e tente novamente."
        />
      ) : view === "cards" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              openTasks={openTaskCount.get(project.id) ?? 0}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          {filtered.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              openTasks={openTaskCount.get(project.id) ?? 0}
            />
          ))}
        </Card>
      )}
    </div>
  );
}
