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
import { meetingRepository, timelineRepository } from "@/lib/database/local";
import {
  meetingSchema,
  type MeetingFormValues,
} from "@/lib/validation/schemas";
import type { Meeting } from "@/types";

interface MeetingFormProps {
  trigger?: ReactNode;
  meeting?: Meeting;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (meeting: Meeting) => void;
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

export function MeetingForm({
  trigger,
  meeting,
  open: openProp,
  onOpenChange,
  onSaved,
}: MeetingFormProps) {
  const projects = useProjects();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [participantsInput, setParticipantsInput] = useState(
    meeting?.participants.join(", ") ?? "",
  );
  const [decisionDraft, setDecisionDraft] = useState("");

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: meeting?.title ?? "",
      projectId: meeting?.projectId ?? "",
      date: meeting?.date?.slice(0, 10) ?? todayIso(),
      startTime: meeting?.startTime ?? "",
      endTime: meeting?.endTime ?? "",
      participants: meeting?.participants ?? [],
      agenda: meeting?.agenda ?? "",
      notes: meeting?.notes ?? "",
      decisionsTaken: meeting?.decisionsTaken ?? [],
      generatedTaskIds: meeting?.generatedTaskIds ?? [],
      nextSteps: meeting?.nextSteps ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: meeting?.title ?? "",
      projectId: meeting?.projectId ?? "",
      date: meeting?.date?.slice(0, 10) ?? todayIso(),
      startTime: meeting?.startTime ?? "",
      endTime: meeting?.endTime ?? "",
      participants: meeting?.participants ?? [],
      agenda: meeting?.agenda ?? "",
      notes: meeting?.notes ?? "",
      decisionsTaken: meeting?.decisionsTaken ?? [],
      generatedTaskIds: meeting?.generatedTaskIds ?? [],
      nextSteps: meeting?.nextSteps ?? "",
    });
    setParticipantsInput(meeting?.participants.join(", ") ?? "");
    setDecisionDraft("");
  }, [open, meeting, form]);

  const decisions = form.watch("decisionsTaken");

  function addDecision() {
    const value = decisionDraft.trim();
    if (!value) return;
    form.setValue("decisionsTaken", [...(decisions ?? []), value]);
    setDecisionDraft("");
  }

  function removeDecision(index: number) {
    form.setValue(
      "decisionsTaken",
      (decisions ?? []).filter((_, i) => i !== index),
    );
  }

  const isEdit = Boolean(meeting);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      title: values.title,
      projectId: values.projectId || undefined,
      date: new Date(values.date).toISOString(),
      startTime: values.startTime?.trim() || undefined,
      endTime: values.endTime?.trim() || undefined,
      participants: listFromInput(participantsInput),
      agenda: values.agenda?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
      decisionsTaken: values.decisionsTaken ?? [],
      generatedTaskIds: values.generatedTaskIds ?? [],
      nextSteps: values.nextSteps?.trim() || undefined,
    };

    try {
      if (meeting) {
        const updated = meetingRepository.update(meeting.id, payload);
        if (!updated) throw new Error("Reunião não encontrada.");
        toast.success("Reunião atualizada.");
        onSaved?.(updated);
      } else {
        const created = meetingRepository.create(payload);
        timelineRepository.record({
          type: "meeting_recorded",
          entityKind: "meeting",
          entityId: created.id,
          projectId: created.projectId,
          title: `Reunião registrada: ${created.title}`,
        });
        toast.success("Reunião registrada.");
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
            {isEdit ? "Editar reunião" : "Registrar reunião"}
          </DialogTitle>
          <DialogDescription>
            Guarde pauta, anotações, decisões tomadas e próximos passos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="meet-title">Título</Label>
            <Input
              id="meet-title"
              autoFocus
              placeholder="Ex: Kickoff Gamma"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-[hsl(var(--hue-rose))]">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="grid gap-2 sm:col-span-2">
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
              <Label htmlFor="meet-date">Data</Label>
              <Input id="meet-date" type="date" {...form.register("date")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meet-start">Início</Label>
              <Input
                id="meet-start"
                type="time"
                {...form.register("startTime")}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meet-part">Participantes</Label>
            <Input
              id="meet-part"
              placeholder="Bruno, Ana, cliente X"
              value={participantsInput}
              onChange={(e) => setParticipantsInput(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">Separados por vírgula.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meet-agenda">Pauta</Label>
            <Textarea
              id="meet-agenda"
              rows={2}
              placeholder="O que vamos discutir?"
              {...form.register("agenda")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meet-notes">Anotações</Label>
            <Textarea
              id="meet-notes"
              rows={5}
              placeholder="Registre pontos-chave da conversa. Uma linha por item facilita gerar tarefas depois."
              {...form.register("notes")}
            />
          </div>

          <div className="grid gap-2">
            <Label>Decisões tomadas</Label>
            <div className="rounded-md border border-border/60 bg-card/40 p-2">
              {decisions && decisions.length > 0 ? (
                <ul className="mb-2 space-y-1">
                  {decisions.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded px-2 py-1 hover:bg-card"
                    >
                      <span className="flex-1 text-sm">{d}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-[hsl(var(--hue-rose))]"
                        onClick={() => removeDecision(i)}
                        aria-label="Remover decisão"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="flex items-center gap-2">
                <Input
                  value={decisionDraft}
                  onChange={(e) => setDecisionDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDecision();
                    }
                  }}
                  placeholder="Ex: Adotar Supabase como banco padrão (Enter)"
                  className="h-8"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDecision}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meet-next">Próximos passos</Label>
            <Textarea
              id="meet-next"
              rows={2}
              placeholder="O que precisa acontecer depois?"
              {...form.register("nextSteps")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{isEdit ? "Salvar" : "Registrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
