"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/hooks/use-data";
import {
  PRIORITY,
  PRIORITY_LABEL,
  TASK_STATUS,
  TASK_STATUS_LABEL,
} from "@/lib/constants/enums";
import { taskRepository, timelineRepository } from "@/lib/database/local";
import { createId } from "@/lib/utils";
import { taskSchema, type TaskFormValues } from "@/lib/validation/schemas";
import type { Task } from "@/types";

interface TaskFormProps {
  trigger?: ReactNode;
  task?: Task;
  defaultProjectId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (task: Task) => void;
}

function tagsFromInput(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

export function TaskForm({
  trigger,
  task,
  defaultProjectId,
  open: openProp,
  onOpenChange,
  onSaved,
}: TaskFormProps) {
  const projects = useProjects();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [tagInput, setTagInput] = useState(task?.tags.join(", ") ?? "");
  const [subDraft, setSubDraft] = useState("");

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.projectId ?? defaultProjectId ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      dueDate: task?.dueDate?.slice(0, 10) ?? "",
      assignee: task?.assignee ?? "",
      tags: task?.tags ?? [],
      subtasks: task?.subtasks ?? [],
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.projectId ?? defaultProjectId ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      dueDate: task?.dueDate?.slice(0, 10) ?? "",
      assignee: task?.assignee ?? "",
      tags: task?.tags ?? [],
      subtasks: task?.subtasks ?? [],
    });
    setTagInput(task?.tags.join(", ") ?? "");
    setSubDraft("");
  }, [open, task, defaultProjectId, form]);

  const subtasks = form.watch("subtasks");

  function addSubtask() {
    const title = subDraft.trim();
    if (!title) return;
    form.setValue("subtasks", [
      ...(subtasks ?? []),
      { id: createId(), title, done: false },
    ]);
    setSubDraft("");
  }

  function removeSubtask(id: string) {
    form.setValue(
      "subtasks",
      (subtasks ?? []).filter((s) => s.id !== id),
    );
  }

  function toggleSubtask(id: string) {
    form.setValue(
      "subtasks",
      (subtasks ?? []).map((s) =>
        s.id === id ? { ...s, done: !s.done } : s,
      ),
    );
  }

  const isEdit = Boolean(task);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      title: values.title,
      description: values.description?.trim() || undefined,
      projectId: values.projectId || undefined,
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate
        ? new Date(values.dueDate).toISOString()
        : undefined,
      assignee: values.assignee?.trim() || undefined,
      tags: tagsFromInput(tagInput),
      subtasks: values.subtasks ?? [],
      completedAt:
        values.status === "done"
          ? task?.completedAt ?? new Date().toISOString()
          : undefined,
    };

    try {
      if (task) {
        const wasDone = task.status === "done";
        const nowDone = values.status === "done";
        const updated = taskRepository.update(task.id, payload);
        if (!updated) throw new Error("Tarefa não encontrada.");
        if (!wasDone && nowDone) {
          timelineRepository.record({
            type: "task_completed",
            entityKind: "task",
            entityId: updated.id,
            projectId: updated.projectId,
            title: `Tarefa concluída: ${updated.title}`,
          });
        }
        toast.success("Tarefa atualizada.");
        onSaved?.(updated);
      } else {
        const created = taskRepository.create(payload);
        timelineRepository.record({
          type: "task_created",
          entityKind: "task",
          entityId: created.id,
          projectId: created.projectId,
          title: `Tarefa criada: ${created.title}`,
        });
        if (created.status === "done") {
          timelineRepository.record({
            type: "task_completed",
            entityKind: "task",
            entityId: created.id,
            projectId: created.projectId,
            title: `Tarefa concluída: ${created.title}`,
          });
        }
        toast.success("Tarefa criada.");
        onSaved?.(created);
      }
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar a tarefa.",
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            Registre uma tarefa com contexto, prazo e subtarefas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              placeholder="O que precisa ser feito?"
              autoFocus
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-[hsl(var(--hue-rose))]">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-desc">Descrição</Label>
            <Textarea
              id="task-desc"
              rows={2}
              placeholder="Contexto ou detalhes (opcional)"
              {...form.register("description")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Projeto</Label>
              <Select
                value={form.watch("projectId") || "none"}
                onValueChange={(v) =>
                  form.setValue("projectId", v === "none" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem projeto</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-assignee">Responsável</Label>
              <Input
                id="task-assignee"
                placeholder="Ex: Bruno"
                {...form.register("assignee")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as TaskFormValues["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Prioridade</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) =>
                  form.setValue("priority", v as TaskFormValues["priority"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-due">Prazo</Label>
              <Input
                id="task-due"
                type="date"
                {...form.register("dueDate")}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-tags">Tags</Label>
            <Input
              id="task-tags"
              placeholder="mvp, bug, front"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Separe por vírgulas.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Subtarefas</Label>
            <div className="rounded-md border border-border/60 bg-card/40 p-2">
              {subtasks && subtasks.length > 0 ? (
                <ul className="mb-2 space-y-1">
                  {subtasks.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-card">
                      <input
                        type="checkbox"
                        checked={s.done}
                        onChange={() => toggleSubtask(s.id)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      <span
                        className={
                          s.done
                            ? "flex-1 text-sm text-muted-foreground line-through"
                            : "flex-1 text-sm"
                        }
                      >
                        {s.title}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-[hsl(var(--hue-rose))]"
                        onClick={() => removeSubtask(s.id)}
                        aria-label="Remover subtarefa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="flex items-center gap-2">
                <Input
                  value={subDraft}
                  onChange={(e) => setSubDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                  placeholder="Adicionar subtarefa e Enter"
                  className="h-8"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubtask}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEdit ? "Salvar" : "Criar tarefa"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
