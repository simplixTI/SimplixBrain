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
  DECISION_STATUS,
  DECISION_STATUS_LABEL,
} from "@/lib/constants/enums";
import { decisionRepository, timelineRepository } from "@/lib/database/local";
import {
  decisionSchema,
  type DecisionFormValues,
} from "@/lib/validation/schemas";
import type { Decision } from "@/types";

interface DecisionFormProps {
  trigger?: ReactNode;
  decision?: Decision;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (decision: Decision) => void;
}

function listFromInput(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ).slice(0, 30);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DecisionForm({
  trigger,
  decision,
  open: openProp,
  onOpenChange,
  onSaved,
}: DecisionFormProps) {
  const projects = useProjects();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [tagInput, setTagInput] = useState(decision?.tags.join(", ") ?? "");
  const [participantsInput, setParticipantsInput] = useState(
    decision?.participants.join(", ") ?? "",
  );

  const form = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      title: decision?.title ?? "",
      context: decision?.context ?? "",
      decision: decision?.decision ?? "",
      rationale: decision?.rationale ?? "",
      alternatives: decision?.alternatives ?? "",
      expectedImpact: decision?.expectedImpact ?? "",
      projectId: decision?.projectId ?? "",
      participants: decision?.participants ?? [],
      date: decision?.date?.slice(0, 10) ?? todayIso(),
      status: decision?.status ?? "proposed",
      tags: decision?.tags ?? [],
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: decision?.title ?? "",
      context: decision?.context ?? "",
      decision: decision?.decision ?? "",
      rationale: decision?.rationale ?? "",
      alternatives: decision?.alternatives ?? "",
      expectedImpact: decision?.expectedImpact ?? "",
      projectId: decision?.projectId ?? "",
      participants: decision?.participants ?? [],
      date: decision?.date?.slice(0, 10) ?? todayIso(),
      status: decision?.status ?? "proposed",
      tags: decision?.tags ?? [],
    });
    setTagInput(decision?.tags.join(", ") ?? "");
    setParticipantsInput(decision?.participants.join(", ") ?? "");
  }, [open, decision, form]);

  const isEdit = Boolean(decision);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      title: values.title,
      context: values.context,
      decision: values.decision,
      rationale: values.rationale,
      alternatives: values.alternatives?.trim() || undefined,
      expectedImpact: values.expectedImpact?.trim() || undefined,
      projectId: values.projectId || undefined,
      participants: listFromInput(participantsInput),
      date: new Date(values.date).toISOString(),
      status: values.status,
      tags: listFromInput(tagInput),
    };

    try {
      if (decision) {
        const updated = decisionRepository.update(decision.id, payload);
        if (!updated) throw new Error("Decisão não encontrada.");
        toast.success("Decisão atualizada.");
        onSaved?.(updated);
      } else {
        const created = decisionRepository.create(payload);
        timelineRepository.record({
          type: "decision_recorded",
          entityKind: "decision",
          entityId: created.id,
          projectId: created.projectId,
          title: `Decisão registrada: ${created.title}`,
        });
        toast.success("Decisão registrada.");
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar decisão" : "Registrar decisão"}
          </DialogTitle>
          <DialogDescription>
            Explique o contexto, a decisão tomada e — principalmente — o motivo.
            O “por quê” é o que envelhece bem.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="dec-title">Título</Label>
            <Input
              id="dec-title"
              autoFocus
              placeholder="Ex: Usar Supabase como banco padrão"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-[hsl(var(--hue-rose))]">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dec-context">Contexto</Label>
            <Textarea
              id="dec-context"
              rows={2}
              placeholder="O que estava acontecendo antes da decisão?"
              {...form.register("context")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dec-decision">Decisão tomada</Label>
            <Textarea
              id="dec-decision"
              rows={2}
              placeholder="O que foi decidido, em uma ou duas frases."
              {...form.register("decision")}
            />
            {form.formState.errors.decision ? (
              <p className="text-xs text-[hsl(var(--hue-rose))]">
                {form.formState.errors.decision.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dec-rationale" className="text-primary">
              Por que essa decisão foi tomada?
            </Label>
            <Textarea
              id="dec-rationale"
              rows={4}
              placeholder="O motivo real por trás da escolha — o que faltar aqui vai custar caro depois."
              className="border-primary/40 focus-visible:ring-primary"
              {...form.register("rationale")}
            />
            {form.formState.errors.rationale ? (
              <p className="text-xs text-[hsl(var(--hue-rose))]">
                {form.formState.errors.rationale.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="dec-alt">Alternativas consideradas</Label>
              <Textarea
                id="dec-alt"
                rows={3}
                placeholder="Quais opções foram descartadas — e por quê."
                {...form.register("alternatives")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dec-impact">Impacto esperado</Label>
              <Textarea
                id="dec-impact"
                rows={3}
                placeholder="O que muda depois desta decisão?"
                {...form.register("expectedImpact")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as DecisionFormValues["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DECISION_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {DECISION_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dec-date">Data</Label>
              <Input id="dec-date" type="date" {...form.register("date")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="dec-part">Participantes</Label>
              <Input
                id="dec-part"
                placeholder="Bruno, Time comercial"
                value={participantsInput}
                onChange={(e) => setParticipantsInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Separados por vírgula.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dec-tags">Tags</Label>
              <Input
                id="dec-tags"
                placeholder="arquitetura, integração"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
            </div>
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
              {isEdit ? "Salvar" : "Registrar decisão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
