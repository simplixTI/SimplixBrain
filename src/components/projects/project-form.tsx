"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  PRIORITY,
  PRIORITY_LABEL,
  PROJECT_STATUS,
  PROJECT_STATUS_LABEL,
} from "@/lib/constants/enums";
import { projectRepository } from "@/lib/database/local";
import { timelineRepository } from "@/lib/database/local";
import {
  projectSchema,
  type ProjectFormValues,
} from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils";
import type { Project } from "@/types";

const COLOR_SWATCHES = [
  "#6366f1",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

interface ProjectFormProps {
  trigger?: ReactNode;
  project?: Project;
  onSaved?: (project: Project) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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

export function ProjectForm({
  trigger,
  project,
  onSaved,
  open: openProp,
  onOpenChange,
}: ProjectFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [tagInput, setTagInput] = useState(project?.tags.join(", ") ?? "");
  const [color, setColor] = useState(project?.color ?? COLOR_SWATCHES[0]!);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? "",
      slug: project?.slug ?? "",
      description: project?.description ?? "",
      objective: project?.objective ?? "",
      status: project?.status ?? "planning",
      priority: project?.priority ?? "medium",
      category: project?.category ?? "",
      startDate: project?.startDate?.slice(0, 10) ?? "",
      dueDate: project?.dueDate?.slice(0, 10) ?? "",
      progress: project?.progress ?? 0,
      color: project?.color ?? COLOR_SWATCHES[0]!,
      icon: project?.icon ?? "",
      tags: project?.tags ?? [],
    },
  });

  const nameValue = form.watch("name");
  useEffect(() => {
    if (project) return;
    form.setValue("slug", slugify(nameValue ?? ""));
  }, [nameValue, project, form]);

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: project?.name ?? "",
      slug: project?.slug ?? "",
      description: project?.description ?? "",
      objective: project?.objective ?? "",
      status: project?.status ?? "planning",
      priority: project?.priority ?? "medium",
      category: project?.category ?? "",
      startDate: project?.startDate?.slice(0, 10) ?? "",
      dueDate: project?.dueDate?.slice(0, 10) ?? "",
      progress: project?.progress ?? 0,
      color: project?.color ?? COLOR_SWATCHES[0]!,
      icon: project?.icon ?? "",
      tags: project?.tags ?? [],
    });
    setTagInput(project?.tags.join(", ") ?? "");
    setColor(project?.color ?? COLOR_SWATCHES[0]!);
  }, [open, project, form]);

  const isEdit = Boolean(project);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      name: values.name,
      slug: values.slug || slugify(values.name),
      description: values.description,
      objective: values.objective,
      status: values.status,
      priority: values.priority,
      category: values.category?.trim() || undefined,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      progress: Number(values.progress) || 0,
      color,
      icon: values.icon?.trim() || undefined,
      tags: tagsFromInput(tagInput),
    };

    try {
      if (project) {
        const updated = projectRepository.update(project.id, payload);
        if (!updated) throw new Error("Projeto não encontrado.");
        timelineRepository.record({
          type: "project_updated",
          entityKind: "project",
          entityId: updated.id,
          projectId: updated.id,
          title: `Projeto atualizado: ${updated.name}`,
        });
        toast.success("Projeto atualizado.");
        onSaved?.(updated);
      } else {
        const created = projectRepository.create(payload);
        timelineRepository.record({
          type: "project_created",
          entityKind: "project",
          entityId: created.id,
          projectId: created.id,
          title: `Projeto criado: ${created.name}`,
        });
        toast.success("Projeto criado.");
        onSaved?.(created);
      }
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar o projeto.",
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar projeto" : "Novo projeto"}</DialogTitle>
          <DialogDescription>
            Preencha as informações essenciais. Você pode ajustar depois.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Nome</Label>
            <Input
              id="project-name"
              placeholder="Ex: Gamma"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-red-400">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-slug">Slug</Label>
            <Input
              id="project-slug"
              placeholder="ex-gamma"
              {...form.register("slug")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-description">Descrição curta</Label>
            <Textarea
              id="project-description"
              rows={2}
              placeholder="Uma linha explicando o que é o projeto."
              {...form.register("description")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-objective">Objetivo principal</Label>
            <Textarea
              id="project-objective"
              rows={3}
              placeholder="Qual é o resultado esperado?"
              {...form.register("objective")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as ProjectFormValues["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROJECT_STATUS_LABEL[s]}
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
                  form.setValue("priority", v as ProjectFormValues["priority"])
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
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="project-category">Categoria</Label>
              <Input
                id="project-category"
                placeholder="Ex: Produto"
                {...form.register("category")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-start">Início</Label>
              <Input
                id="project-start"
                type="date"
                {...form.register("startDate")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-due">Prazo</Label>
              <Input
                id="project-due"
                type="date"
                {...form.register("dueDate")}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-progress">Progresso ({form.watch("progress")}%)</Label>
            <Input
              id="project-progress"
              type="range"
              min={0}
              max={100}
              step={5}
              {...form.register("progress", { valueAsNumber: true })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full ring-offset-background transition ${
                    color === c
                      ? "ring-2 ring-ring ring-offset-2"
                      : "hover:scale-110"
                  }`}
                  style={{ background: c }}
                  aria-label={`Selecionar cor ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project-tags">Tags</Label>
            <Input
              id="project-tags"
              placeholder="mobile, mvp, receita"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Separe por vírgulas.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEdit ? "Salvar" : "Criar projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
