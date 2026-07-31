"use client";

import { Lightbulb, Plus, Search, X } from "lucide-react";
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
import { useIdeas, useProjects } from "@/hooks/use-data";
import {
  IDEA_POTENTIAL,
  IDEA_POTENTIAL_LABEL,
  IDEA_STATUS,
  IDEA_STATUS_LABEL,
  type IdeaPotential,
  type IdeaStatus,
} from "@/lib/constants/enums";
import { ideaRepository } from "@/lib/database/local";
import type { Idea } from "@/types";

import { IdeaCard } from "./idea-card";
import { IdeaForm } from "./idea-form";
import { QuickIdeaInbox } from "./quick-idea-inbox";

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const POTENTIAL_ORDER: Record<IdeaPotential, number> = {
  very_high: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function IdeasView() {
  const ideas = useIdeas();
  const projects = useProjects();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [potential, setPotential] = useState<string>("all");
  const [projectId, setProjectId] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Idea | null>(null);

  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return ideas
      .filter((i) => {
        if (status !== "all" && i.status !== (status as IdeaStatus)) return false;
        if (
          potential !== "all" &&
          i.potential !== (potential as IdeaPotential)
        )
          return false;
        if (projectId === "none" && i.projectId) return false;
        if (
          projectId !== "all" &&
          projectId !== "none" &&
          i.projectId !== projectId
        )
          return false;
        if (!q) return true;
        const haystack = [i.title, i.description, i.category ?? "", i.tags.join(" ")]
          .map(normalize)
          .join(" ");
        return haystack.includes(q);
      })
      .sort((a, b) => {
        const p = POTENTIAL_ORDER[a.potential] - POTENTIAL_ORDER[b.potential];
        if (p !== 0) return p;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [ideas, query, status, potential, projectId]);

  const hasFilters =
    query !== "" ||
    status !== "all" ||
    potential !== "all" ||
    projectId !== "all";

  function handleDelete(idea: Idea) {
    if (!window.confirm(`Excluir a ideia "${idea.title}"?`)) return;
    ideaRepository.delete(idea.id);
    toast.success("Ideia excluída.");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-display text-3xl font-semibold">Ideias</h1>
          <p className="text-sm text-muted-foreground">
            {ideas.length} ideia{ideas.length === 1 ? "" : "s"} no radar.
          </p>
        </div>
        <IdeaForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Nova ideia
            </Button>
          }
        />
      </div>

      <QuickIdeaInbox />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, descrição ou tag…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {IDEA_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {IDEA_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={potential} onValueChange={setPotential}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo potencial</SelectItem>
              {IDEA_POTENTIAL.map((p) => (
                <SelectItem key={p} value={p}>
                  {IDEA_POTENTIAL_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                setStatus("all");
                setPotential("all");
                setProjectId("all");
              }}
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          ) : null}
        </div>
      </div>

      {ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Nenhuma ideia ainda."
          description="Use a caixa de entrada acima para capturar sua primeira sacada."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Nenhuma ideia com esses filtros."
          description="Ajuste os filtros ou registre uma nova ideia."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              project={idea.projectId ? projectById.get(idea.projectId) : undefined}
              onEdit={(i) => setEditing(i)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <IdeaForm
        idea={editing ?? undefined}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}
