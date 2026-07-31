"use client";

import { CalendarClock, MoreVertical, Pencil, Trash2, Users, Wand2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import type { Meeting, Project } from "@/types";

import { GenerateTasksModal } from "./generate-tasks-modal";

interface MeetingCardProps {
  meeting: Meeting;
  project?: Project;
  onEdit: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
}

export function MeetingCard({
  meeting,
  project,
  onEdit,
  onDelete,
}: MeetingCardProps) {
  const [genOpen, setGenOpen] = useState(false);

  return (
    <article className="surface group relative overflow-hidden rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {formatDate(meeting.date)}
              {meeting.startTime ? ` · ${meeting.startTime}` : ""}
              {meeting.endTime ? `–${meeting.endTime}` : ""}
            </span>
            {project ? <span> · {project.name}</span> : null}
          </p>
          <button
            type="button"
            onClick={() => onEdit(meeting)}
            className="text-left text-lg font-semibold hover:text-primary"
          >
            {meeting.title}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGenOpen(true)}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Gerar tarefas
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                aria-label="Ações"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(meeting)}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[hsl(var(--hue-rose))] focus:text-[hsl(var(--hue-rose))]"
                onSelect={() => onDelete(meeting)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {meeting.participants.length > 0 ? (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" />
          {meeting.participants.join(", ")}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {meeting.agenda ? (
          <section>
            <p className="text-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              Pauta
            </p>
            <p className="mt-1 text-sm text-foreground/90">{meeting.agenda}</p>
          </section>
        ) : null}
        {meeting.notes ? (
          <section>
            <p className="text-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              Anotações
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
              {meeting.notes}
            </p>
          </section>
        ) : null}
      </div>

      {meeting.decisionsTaken.length > 0 ? (
        <section className="mt-4 rounded-lg border border-[hsl(var(--hue-lime)/0.3)] bg-[hsl(var(--hue-lime)/0.08)] p-3">
          <p className="text-mono text-[9px] font-semibold uppercase tracking-widest text-[hsl(var(--hue-lime))]">
            Decisões tomadas
          </p>
          <ul className="mt-1 space-y-0.5 pl-4 text-sm">
            {meeting.decisionsTaken.map((d, i) => (
              <li key={i} className="list-disc marker:text-[hsl(var(--hue-lime))]">
                {d}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {meeting.nextSteps ? (
        <section className="mt-3">
          <p className="text-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            Próximos passos
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
            {meeting.nextSteps}
          </p>
        </section>
      ) : null}

      {meeting.generatedTaskIds.length > 0 ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          <Badge variant="muted" className="text-[10px]">
            {meeting.generatedTaskIds.length} tarefa
            {meeting.generatedTaskIds.length === 1 ? "" : "s"} gerada
            {meeting.generatedTaskIds.length === 1 ? "" : "s"} desta reunião
          </Badge>
        </p>
      ) : null}

      <GenerateTasksModal
        meeting={meeting}
        open={genOpen}
        onOpenChange={setGenOpen}
      />
    </article>
  );
}
