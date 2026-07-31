"use client";

import { CalendarClock, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMeetings, useProjects } from "@/hooks/use-data";
import { meetingRepository } from "@/lib/database/local";
import type { Meeting } from "@/types";

import { MeetingCard } from "./meeting-card";
import { MeetingForm } from "./meeting-form";

type Range = "all" | "upcoming" | "past";

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function MeetingsView() {
  const meetings = useMeetings();
  const projects = useProjects();

  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [range, setRange] = useState<Range>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);

  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const now = Date.now();
    return meetings
      .filter((m) => {
        if (projectId === "none" && m.projectId) return false;
        if (
          projectId !== "all" &&
          projectId !== "none" &&
          m.projectId !== projectId
        )
          return false;
        const t = new Date(m.date).getTime();
        if (range === "upcoming" && t < now - 86_400_000) return false;
        if (range === "past" && t >= now) return false;
        if (!q) return true;
        const haystack = [
          m.title,
          m.agenda ?? "",
          m.notes ?? "",
          m.nextSteps ?? "",
          m.participants.join(" "),
          m.decisionsTaken.join(" "),
        ]
          .map(normalize)
          .join(" ");
        return haystack.includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [meetings, query, projectId, range]);

  const hasFilters = query !== "" || projectId !== "all" || range !== "all";

  function handleDelete(m: Meeting) {
    if (!window.confirm(`Excluir a reunião "${m.title}"?`)) return;
    meetingRepository.delete(m.id);
    toast.success("Reunião excluída.");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Encontros que geram ação
          </p>
          <h1 className="text-display text-3xl font-semibold">Reuniões</h1>
          <p className="text-sm text-muted-foreground">
            {meetings.length} reunião{meetings.length === 1 ? "" : "s"}{" "}
            registrada{meetings.length === 1 ? "" : "s"}.
          </p>
        </div>
        <MeetingForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Nova reunião
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, pauta, decisão…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos projetos</SelectItem>
              <SelectItem value="none">Sem projeto</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setQuery("");
                setProjectId("all");
                setRange("all");
              }}
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="past">Passadas</TabsTrigger>
        </TabsList>

        <TabsContent value={range}>
          {meetings.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nenhuma reunião registrada."
              description="Guarde pauta, anotações, decisões e gere tarefas direto do encontro."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Registrar primeira reunião
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nada por aqui."
              description="Ajuste os filtros ou selecione outra faixa de tempo."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  project={
                    meeting.projectId
                      ? projectById.get(meeting.projectId)
                      : undefined
                  }
                  onEdit={(m) => setEditing(m)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MeetingForm
        meeting={editing ?? undefined}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}
