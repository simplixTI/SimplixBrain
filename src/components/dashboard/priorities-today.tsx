"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, CheckSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useProjects, useTasks } from "@/hooks/use-data";
import {
  PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  type Priority,
} from "@/lib/constants/enums";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

const PRIORITY_TONE: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-sky-500/15 text-sky-400",
  high: "bg-amber-500/15 text-amber-500",
  critical: "bg-red-500/15 text-red-400",
};

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function isDueSoon(task: Task, days = 7): boolean {
  if (!task.dueDate) return false;
  const diff = new Date(task.dueDate).getTime() - Date.now();
  return diff <= days * 86400000;
}

export function PrioritiesToday() {
  const tasks = useTasks();
  const projects = useProjects();

  const relevant = tasks
    .filter(
      (t) =>
        t.status !== "done" &&
        t.status !== "cancelled" &&
        (t.priority === "critical" || t.priority === "high" || isDueSoon(t)),
    )
    .sort((a, b) => {
      const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (p !== 0) return p;
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return ad - bd;
    })
    .slice(0, 6);

  const projectName = (id?: string) =>
    id ? projects.find((p) => p.id === id)?.name : undefined;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Prioridades do dia</CardTitle>
          <CardDescription>
            Tarefas críticas, de alta prioridade ou com prazo nos próximos 7 dias.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tasks">
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {relevant.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="Sem prioridades pra hoje."
            description="Nenhuma tarefa crítica ou com prazo próximo. Boa hora para pensar no que vem depois."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {relevant.map((task) => {
              const overdue =
                task.dueDate &&
                new Date(task.dueDate).getTime() < Date.now();
              return (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {projectName(task.projectId) ? (
                        <span>{projectName(task.projectId)}</span>
                      ) : (
                        <span>Sem projeto</span>
                      )}
                      <span aria-hidden>•</span>
                      <span>{TASK_STATUS_LABEL[task.status]}</span>
                      {task.dueDate ? (
                        <>
                          <span aria-hidden>•</span>
                          <span
                            className={cn(
                              overdue ? "text-red-400" : "text-muted-foreground",
                            )}
                          >
                            {overdue ? (
                              <span className="inline-flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Atrasada — {formatRelative(task.dueDate)}
                              </span>
                            ) : (
                              formatRelative(task.dueDate)
                            )}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <Badge className={cn("border-transparent", PRIORITY_TONE[task.priority])}>
                    {PRIORITY_LABEL[task.priority]}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
