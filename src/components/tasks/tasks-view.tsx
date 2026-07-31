"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, ListTodo, Plus, Sparkles, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects, useTasks } from "@/hooks/use-data";
import type { Priority, TaskStatus } from "@/lib/constants/enums";
import { taskRepository, timelineRepository } from "@/lib/database/local";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

import { TaskForm } from "./task-form";
import { TaskRow } from "./task-row";
import { TasksToolbar, type TasksToolbarState } from "./tasks-toolbar";

const INITIAL_FILTERS: TasksToolbarState = {
  query: "",
  projectId: "all",
  priority: "all",
};

type ViewId =
  | "all"
  | "today"
  | "upcoming"
  | "overdue"
  | "done"
  | "no_project";

const DAY = 86_400_000;

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfToday(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function isDoneOrCancelled(s: TaskStatus): boolean {
  return s === "done" || s === "cancelled";
}

function isOverdue(t: Task): boolean {
  if (!t.dueDate) return false;
  if (isDoneOrCancelled(t.status)) return false;
  return new Date(t.dueDate).getTime() < startOfToday();
}

function isToday(t: Task): boolean {
  if (!t.dueDate) return false;
  const time = new Date(t.dueDate).getTime();
  return time >= startOfToday() && time <= endOfToday();
}

function isNext7Days(t: Task): boolean {
  if (!t.dueDate) return false;
  const time = new Date(t.dueDate).getTime();
  return time >= startOfToday() && time <= startOfToday() + 7 * DAY;
}

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface CountBadgeProps {
  count: number;
  tone?: string;
}
function CountBadge({ count, tone }: CountBadgeProps) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "text-mono ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold",
        tone ?? "bg-muted text-muted-foreground",
      )}
    >
      {count}
    </span>
  );
}

export function TasksView() {
  const tasks = useTasks();
  const projects = useProjects();
  const [filters, setFilters] = useState<TasksToolbarState>(INITIAL_FILTERS);
  const [view, setView] = useState<ViewId>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const filtered = useMemo(() => {
    const q = normalize(filters.query.trim());
    return tasks.filter((t) => {
      if (filters.projectId === "none" && t.projectId) return false;
      if (
        filters.projectId !== "all" &&
        filters.projectId !== "none" &&
        t.projectId !== filters.projectId
      )
        return false;
      if (filters.priority !== "all" && t.priority !== (filters.priority as Priority))
        return false;
      if (!q) return true;
      const haystack = [t.title, t.description ?? "", t.tags.join(" "), t.assignee ?? ""]
        .map(normalize)
        .join(" ");
      return haystack.includes(q);
    });
  }, [tasks, filters]);

  const counts = useMemo(() => {
    return {
      all: filtered.filter((t) => !isDoneOrCancelled(t.status)).length,
      today: filtered.filter((t) => isToday(t) && !isDoneOrCancelled(t.status)).length,
      upcoming: filtered.filter((t) => isNext7Days(t) && !isDoneOrCancelled(t.status)).length,
      overdue: filtered.filter(isOverdue).length,
      done: filtered.filter((t) => t.status === "done").length,
      no_project: filtered.filter((t) => !t.projectId && !isDoneOrCancelled(t.status)).length,
    };
  }, [filtered]);

  const list = useMemo(() => {
    const scoped = filtered.filter((t) => {
      switch (view) {
        case "today":
          return isToday(t) && !isDoneOrCancelled(t.status);
        case "upcoming":
          return isNext7Days(t) && !isDoneOrCancelled(t.status);
        case "overdue":
          return isOverdue(t);
        case "done":
          return t.status === "done";
        case "no_project":
          return !t.projectId && !isDoneOrCancelled(t.status);
        case "all":
        default:
          return !isDoneOrCancelled(t.status);
      }
    });

    return [...scoped].sort((a, b) => {
      const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (p !== 0) return p;
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (ad !== bd) return ad - bd;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [filtered, view]);

  const hasFilters =
    filters.query !== "" ||
    filters.projectId !== "all" ||
    filters.priority !== "all";

  function handleToggle(task: Task) {
    const nowDone = task.status !== "done";
    taskRepository.update(task.id, {
      status: nowDone ? "done" : "todo",
      completedAt: nowDone ? new Date().toISOString() : undefined,
    });
    if (nowDone) {
      timelineRepository.record({
        type: "task_completed",
        entityKind: "task",
        entityId: task.id,
        projectId: task.projectId,
        title: `Tarefa concluída: ${task.title}`,
      });
      toast.success("Tarefa concluída.");
    }
  }

  function handleDelete(task: Task) {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return;
    taskRepository.delete(task.id);
    toast.success("Tarefa excluída.");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-display text-3xl font-semibold">Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            {counts.all} em aberto no workspace.
          </p>
        </div>
        <TaskForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          trigger={
            <Button className="shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_10px_30px_-12px_hsl(var(--primary)/0.5)]">
              <Plus className="h-4 w-4" />
              Nova tarefa
            </Button>
          }
        />
      </div>

      <TasksToolbar
        {...filters}
        projects={projects}
        hasFilters={hasFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
        onChange={(patch) => setFilters((s) => ({ ...s, ...patch }))}
      />

      <Tabs value={view} onValueChange={(v) => setView(v as ViewId)}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="all">
            <ListTodo className="h-3.5 w-3.5" />
            Todas
            <CountBadge count={counts.all} />
          </TabsTrigger>
          <TabsTrigger value="today">
            <Sun className="h-3.5 w-3.5" />
            Hoje
            <CountBadge
              count={counts.today}
              tone="bg-[hsl(var(--hue-cyan)/0.2)] text-[hsl(var(--hue-cyan))]"
            />
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            <CalendarClock className="h-3.5 w-3.5" />
            Próximos 7 dias
            <CountBadge count={counts.upcoming} />
          </TabsTrigger>
          <TabsTrigger value="overdue">
            <AlertTriangle className="h-3.5 w-3.5" />
            Atrasadas
            <CountBadge
              count={counts.overdue}
              tone="bg-[hsl(var(--hue-rose)/0.2)] text-[hsl(var(--hue-rose))]"
            />
          </TabsTrigger>
          <TabsTrigger value="no_project">
            <Sparkles className="h-3.5 w-3.5" />
            Sem projeto
            <CountBadge count={counts.no_project} />
          </TabsTrigger>
          <TabsTrigger value="done">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Concluídas
            <CountBadge
              count={counts.done}
              tone="bg-[hsl(var(--hue-lime)/0.2)] text-[hsl(var(--hue-lime))]"
            />
          </TabsTrigger>
        </TabsList>

        <TabsContent value={view}>
          {tasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="Nenhuma tarefa ainda."
              description="Crie sua primeira tarefa para começar a acompanhar o progresso."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Criar tarefa
                </Button>
              }
            />
          ) : list.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title={
                view === "today"
                  ? "Nada marcado pra hoje."
                  : view === "upcoming"
                    ? "Nenhuma tarefa nos próximos 7 dias."
                    : view === "overdue"
                      ? "Nenhuma tarefa atrasada. ✨"
                      : view === "done"
                        ? "Nenhuma tarefa concluída ainda."
                        : "Nada aqui com os filtros atuais."
              }
              description={
                view === "overdue"
                  ? "Você está em dia com os prazos."
                  : "Ajuste os filtros ou selecione outra visualização."
              }
            />
          ) : (
            <Card className="overflow-hidden border-border/70 bg-card/60 backdrop-blur">
              <CardContent className="p-0">
                {list.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    project={task.projectId ? projectById.get(task.projectId) : undefined}
                    onToggle={handleToggle}
                    onEdit={(t) => setEditing(t)}
                    onDelete={handleDelete}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <TaskForm
        task={editing ?? undefined}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}
