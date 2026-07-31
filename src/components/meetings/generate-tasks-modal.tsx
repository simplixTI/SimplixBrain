"use client";

import { Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { PRIORITY, PRIORITY_LABEL, type Priority } from "@/lib/constants/enums";
import {
  meetingRepository,
  taskRepository,
  timelineRepository,
} from "@/lib/database/local";
import type { Meeting } from "@/types";

interface GenerateTasksModalProps {
  meeting: Meeting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Candidate {
  key: string;
  title: string;
  selected: boolean;
  priority: Priority;
}

function extractCandidates(meeting: Meeting): Candidate[] {
  const lines: string[] = [];
  if (meeting.notes) {
    meeting.notes
      .split(/\r?\n/)
      .map((l) =>
        l
          .trim()
          .replace(/^[-*+•]\s+/, "")
          .replace(/^\d+\.\s+/, ""),
      )
      .filter((l) => l.length > 3)
      .forEach((l) => lines.push(l));
  }
  if (meeting.nextSteps) {
    meeting.nextSteps
      .split(/\r?\n/)
      .map((l) =>
        l.trim().replace(/^[-*+•]\s+/, "").replace(/^\d+\.\s+/, ""),
      )
      .filter((l) => l.length > 3)
      .forEach((l) => lines.push(l));
  }
  const seen = new Set<string>();
  return lines
    .filter((l) => {
      const k = l.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((title, idx) => ({
      key: `${idx}-${title.slice(0, 20)}`,
      title,
      selected: true,
      priority: "medium" as Priority,
    }));
}

export function GenerateTasksModal({
  meeting,
  open,
  onOpenChange,
}: GenerateTasksModalProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [manualDraft, setManualDraft] = useState("");
  const [manualPriority, setManualPriority] = useState<Priority>("medium");

  useEffect(() => {
    if (!open) return;
    setCandidates(extractCandidates(meeting));
    setManualDraft("");
  }, [open, meeting]);

  const selectedCount = useMemo(
    () => candidates.filter((c) => c.selected).length,
    [candidates],
  );

  function toggle(key: string) {
    setCandidates((prev) =>
      prev.map((c) => (c.key === key ? { ...c, selected: !c.selected } : c)),
    );
  }

  function setPriority(key: string, priority: Priority) {
    setCandidates((prev) =>
      prev.map((c) => (c.key === key ? { ...c, priority } : c)),
    );
  }

  function addManual() {
    const title = manualDraft.trim();
    if (!title) return;
    setCandidates((prev) => [
      ...prev,
      {
        key: `manual-${prev.length}-${title.slice(0, 20)}`,
        title,
        selected: true,
        priority: manualPriority,
      },
    ]);
    setManualDraft("");
  }

  function handleGenerate() {
    const chosen = candidates.filter((c) => c.selected);
    if (chosen.length === 0) {
      toast.error("Selecione ao menos uma tarefa.");
      return;
    }
    const createdIds: string[] = [];
    for (const c of chosen) {
      const task = taskRepository.create({
        title: c.title,
        description: `Gerada a partir da reunião "${meeting.title}"`,
        projectId: meeting.projectId,
        status: "todo",
        priority: c.priority,
        tags: ["reunião"],
        subtasks: [],
      });
      createdIds.push(task.id);
      timelineRepository.record({
        type: "task_created",
        entityKind: "task",
        entityId: task.id,
        projectId: task.projectId,
        title: `Tarefa criada: ${task.title}`,
      });
    }
    meetingRepository.update(meeting.id, {
      generatedTaskIds: [...meeting.generatedTaskIds, ...createdIds],
    });
    toast.success(
      `${chosen.length} tarefa${chosen.length === 1 ? "" : "s"} gerada${chosen.length === 1 ? "" : "s"}.`,
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            Gerar tarefas da reunião
          </DialogTitle>
          <DialogDescription>
            Extraímos candidatos a partir das anotações e próximos passos.
            Marque o que vira tarefa e ajuste a prioridade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {candidates.length === 0 ? (
            <div className="rounded-md border border-dashed border-border/60 bg-card/40 px-3 py-6 text-center text-xs text-muted-foreground">
              <Sparkles className="mx-auto h-4 w-4" />
              Nenhum candidato detectado. Adicione tarefas manualmente abaixo.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {candidates.map((c) => (
                <li
                  key={c.key}
                  className="flex items-center gap-2 rounded-md border border-border/50 bg-card/40 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={c.selected}
                    onChange={() => toggle(c.key)}
                    className="h-3.5 w-3.5 rounded border-border"
                  />
                  <span
                    className={
                      c.selected
                        ? "flex-1 text-sm"
                        : "flex-1 text-sm text-muted-foreground line-through"
                    }
                  >
                    {c.title}
                  </span>
                  <Select
                    value={c.priority}
                    onValueChange={(v) => setPriority(c.key, v as Priority)}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-[11px]">
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
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 rounded-md border border-dashed border-border/60 bg-card/30 p-3">
          <Label htmlFor="manual-task">Adicionar manualmente</Label>
          <div className="flex items-center gap-2">
            <Input
              id="manual-task"
              value={manualDraft}
              onChange={(e) => setManualDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManual();
                }
              }}
              placeholder="Ex: Enviar proposta até sexta"
            />
            <Select
              value={manualPriority}
              onValueChange={(v) => setManualPriority(v as Priority)}
            >
              <SelectTrigger className="w-[130px]">
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addManual}
            >
              Add
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={selectedCount === 0}>
            Gerar {selectedCount} tarefa{selectedCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
