"use client";

import { AlertCircle, CalendarClock, Check, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Priority, TaskStatus } from "@/lib/constants/enums";
import type { Project, Task } from "@/types";

import { TaskPriorityBadge, TaskStatusBadge } from "./task-badges";

interface TaskRowProps {
  task: Task;
  project?: Project;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function isOverdue(due?: string, status?: TaskStatus): boolean {
  if (!due) return false;
  if (status === "done" || status === "cancelled") return false;
  return new Date(due).getTime() < Date.now();
}

const PRIORITY_ACCENT: Record<Priority, string> = {
  low: "bg-muted-foreground/50",
  medium: "bg-[hsl(var(--hue-cyan))]",
  high: "bg-[hsl(var(--hue-amber))]",
  critical: "bg-[hsl(var(--hue-rose))]",
};

export function TaskRow({ task, project, onToggle, onEdit, onDelete }: TaskRowProps) {
  const done = task.status === "done";
  const overdue = isOverdue(task.dueDate, task.status);
  const subDone = task.subtasks.filter((s) => s.done).length;

  return (
    <div className="group relative flex flex-wrap items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0 hover:bg-card/60">
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 h-full w-[3px] rounded-r-sm",
          PRIORITY_ACCENT[task.priority],
          done && "opacity-40",
        )}
      />
      <button
        type="button"
        onClick={() => onToggle(task)}
        aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
          done
            ? "border-[hsl(var(--hue-lime)/0.5)] bg-[hsl(var(--hue-lime)/0.2)] text-[hsl(var(--hue-lime))]"
            : "border-border hover:border-primary/60 hover:bg-primary/10",
        )}
      >
        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </button>
      <button
        type="button"
        onClick={() => onEdit(task)}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
        <p
          className={cn(
            "truncate text-sm font-medium",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {project ? <span>{project.name}</span> : <span>Sem projeto</span>}
          {task.dueDate ? (
            <>
              <span aria-hidden>•</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  overdue && "text-[hsl(var(--hue-rose))]",
                )}
              >
                {overdue ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <CalendarClock className="h-3 w-3" />
                )}
                {formatRelative(task.dueDate)}
              </span>
            </>
          ) : null}
          {task.subtasks.length > 0 ? (
            <>
              <span aria-hidden>•</span>
              <span>
                {subDone}/{task.subtasks.length} sub
              </span>
            </>
          ) : null}
          {task.tags.length > 0 ? (
            <>
              <span aria-hidden>•</span>
              <span>{task.tags.slice(0, 3).join(", ")}</span>
            </>
          ) : null}
          {task.assignee ? (
            <>
              <span aria-hidden>•</span>
              <span>@{task.assignee}</span>
            </>
          ) : null}
        </p>
      </button>
      <TaskStatusBadge status={task.status} />
      <TaskPriorityBadge priority={task.priority} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground opacity-70 group-hover:opacity-100"
            aria-label="Mais ações"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(task)}>
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[hsl(var(--hue-rose))] focus:text-[hsl(var(--hue-rose))]"
            onSelect={() => onDelete(task)}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
