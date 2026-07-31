"use client";

import { Brain, Plus, Search, X } from "lucide-react";
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
import { useDecisions, useProjects } from "@/hooks/use-data";
import {
  DECISION_STATUS,
  DECISION_STATUS_LABEL,
  type DecisionStatus,
} from "@/lib/constants/enums";
import { decisionRepository } from "@/lib/database/local";
import { formatDate } from "@/lib/utils";
import type { Decision } from "@/types";

import { DecisionCard } from "./decision-card";
import { DecisionForm } from "./decision-form";

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function groupByPeriod(items: Decision[]): Array<{ label: string; items: Decision[] }> {
  const map = new Map<string, Decision[]>();
  for (const d of items) {
    const date = new Date(d.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(date);
    const arr = map.get(key) ?? [];
    arr.push(d);
    map.set(`${key}|${label}`, arr);
    if (map.get(key)) map.delete(key);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].split("|")[0]!.localeCompare(a[0].split("|")[0]!))
    .map(([key, list]) => ({ label: key.split("|")[1] ?? key, items: list }));
}

export function DecisionsView() {
  const decisions = useDecisions();
  const projects = useProjects();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [projectId, setProjectId] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Decision | null>(null);

  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return decisions
      .filter((d) => {
        if (status !== "all" && d.status !== (status as DecisionStatus))
          return false;
        if (projectId === "none" && d.projectId) return false;
        if (
          projectId !== "all" &&
          projectId !== "none" &&
          d.projectId !== projectId
        )
          return false;
        if (!q) return true;
        const haystack = [
          d.title,
          d.context,
          d.decision,
          d.rationale,
          d.alternatives ?? "",
          d.expectedImpact ?? "",
          d.participants.join(" "),
          d.tags.join(" "),
        ]
          .map(normalize)
          .join(" ");
        return haystack.includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [decisions, query, status, projectId]);

  const groups = useMemo(() => groupByPeriod(filtered), [filtered]);
  const hasFilters =
    query !== "" || status !== "all" || projectId !== "all";

  function handleDelete(decision: Decision) {
    if (!window.confirm(`Excluir a decisão "${decision.title}"?`)) return;
    decisionRepository.delete(decision.id);
    toast.success("Decisão excluída.");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Registro do porquê
          </p>
          <h1 className="text-display text-3xl font-semibold">Decisões</h1>
          <p className="text-sm text-muted-foreground">
            {decisions.length} decis{decisions.length === 1 ? "ão" : "ões"}{" "}
            registrada{decisions.length === 1 ? "" : "s"} no workspace.
          </p>
        </div>
        <DecisionForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Registrar decisão
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
            placeholder="Buscar por título, motivo ou participante…"
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
              {DECISION_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {DECISION_STATUS_LABEL[s]}
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
                setProjectId("all");
              }}
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          ) : null}
        </div>
      </div>

      {decisions.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="Nenhuma decisão registrada."
          description="O primeiro registro do 'por quê' começa aqui. Você vai agradecer daqui a 3 meses."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Registrar primeira decisão
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="Nenhuma decisão com esses filtros."
          description="Ajuste a busca, status ou projeto."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.label} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-border via-border/60 to-transparent" />
                <p className="text-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {group.label} · {group.items.length}
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-border via-border/60 to-transparent" />
              </div>
              <div className="space-y-3">
                {group.items.map((decision) => (
                  <DecisionCard
                    key={decision.id}
                    decision={decision}
                    project={
                      decision.projectId
                        ? projectById.get(decision.projectId)
                        : undefined
                    }
                    onEdit={(d) => setEditing(d)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <DecisionForm
        decision={editing ?? undefined}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
      <span className="hidden">{formatDate(new Date())}</span>
    </div>
  );
}
