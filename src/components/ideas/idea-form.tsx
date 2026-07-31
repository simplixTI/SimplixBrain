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
import { useProjects } from "@/hooks/use-data";
import {
  IDEA_EFFORT,
  IDEA_EFFORT_LABEL,
  IDEA_POTENTIAL,
  IDEA_POTENTIAL_LABEL,
  IDEA_STATUS,
  IDEA_STATUS_LABEL,
} from "@/lib/constants/enums";
import { ideaRepository, timelineRepository } from "@/lib/database/local";
import { ideaSchema, type IdeaFormValues } from "@/lib/validation/schemas";
import type { Idea } from "@/types";

interface IdeaFormProps {
  trigger?: ReactNode;
  idea?: Idea;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (idea: Idea) => void;
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

export function IdeaForm({
  trigger,
  idea,
  open: openProp,
  onOpenChange,
  onSaved,
}: IdeaFormProps) {
  const projects = useProjects();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [tagInput, setTagInput] = useState(idea?.tags.join(", ") ?? "");

  const form = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      title: idea?.title ?? "",
      description: idea?.description ?? "",
      projectId: idea?.projectId ?? "",
      category: idea?.category ?? "",
      potential: idea?.potential ?? "medium",
      effort: idea?.effort ?? undefined,
      status: idea?.status ?? "new",
      tags: idea?.tags ?? [],
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: idea?.title ?? "",
      description: idea?.description ?? "",
      projectId: idea?.projectId ?? "",
      category: idea?.category ?? "",
      potential: idea?.potential ?? "medium",
      effort: idea?.effort ?? undefined,
      status: idea?.status ?? "new",
      tags: idea?.tags ?? [],
    });
    setTagInput(idea?.tags.join(", ") ?? "");
  }, [open, idea, form]);

  const isEdit = Boolean(idea);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      title: values.title,
      description: values.description,
      projectId: values.projectId || undefined,
      category: values.category?.trim() || undefined,
      potential: values.potential,
      effort: values.effort,
      status: values.status,
      tags: tagsFromInput(tagInput),
    };
    try {
      if (idea) {
        const updated = ideaRepository.update(idea.id, payload);
        if (!updated) throw new Error("Ideia não encontrada.");
        toast.success("Ideia atualizada.");
        onSaved?.(updated);
      } else {
        const created = ideaRepository.create(payload);
        timelineRepository.record({
          type: "idea_created",
          entityKind: "idea",
          entityId: created.id,
          projectId: created.projectId,
          title: `Ideia registrada: ${created.title}`,
        });
        toast.success("Ideia registrada.");
        onSaved?.(created);
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ideia" : "Nova ideia"}</DialogTitle>
          <DialogDescription>
            Registre a ideia com contexto e potencial. Você refina depois.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="idea-title">Título</Label>
            <Input
              id="idea-title"
              autoFocus
              placeholder="A ideia em uma linha"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-[hsl(var(--hue-rose))]">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="idea-desc">Descrição</Label>
            <Textarea
              id="idea-desc"
              rows={3}
              placeholder="Detalhe a ideia, contexto, exemplos…"
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
              <Label htmlFor="idea-cat">Categoria</Label>
              <Input
                id="idea-cat"
                placeholder="Ex: Monetização"
                {...form.register("category")}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as IdeaFormValues["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IDEA_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {IDEA_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Potencial</Label>
              <Select
                value={form.watch("potential")}
                onValueChange={(v) =>
                  form.setValue("potential", v as IdeaFormValues["potential"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IDEA_POTENTIAL.map((p) => (
                    <SelectItem key={p} value={p}>
                      {IDEA_POTENTIAL_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Esforço</Label>
              <Select
                value={form.watch("effort") ?? "none"}
                onValueChange={(v) =>
                  form.setValue(
                    "effort",
                    v === "none" ? undefined : (v as IdeaFormValues["effort"]),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {IDEA_EFFORT.map((e) => (
                    <SelectItem key={e} value={e}>
                      {IDEA_EFFORT_LABEL[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="idea-tags">Tags</Label>
            <Input
              id="idea-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="separadas, por, virgula"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEdit ? "Salvar" : "Registrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
