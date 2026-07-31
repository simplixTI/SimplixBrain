"use client";

import { MoreVertical, Pencil, Trash2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import type { Decision, Project } from "@/types";

import { DecisionStatusBadge } from "./decision-badges";

interface DecisionCardProps {
  decision: Decision;
  project?: Project;
  onEdit: (decision: Decision) => void;
  onDelete: (decision: Decision) => void;
}

export function DecisionCard({
  decision,
  project,
  onEdit,
  onDelete,
}: DecisionCardProps) {
  return (
    <article className="group surface relative overflow-hidden rounded-xl p-5">
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-primary via-[hsl(var(--hue-fuchsia))] to-transparent"
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {formatDate(decision.date)}
            {project ? ` · ${project.name}` : ""}
          </p>
          <button
            type="button"
            onClick={() => onEdit(decision)}
            className="text-left text-lg font-semibold hover:text-primary"
          >
            {decision.title}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <DecisionStatusBadge status={decision.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground opacity-70 group-hover:opacity-100"
                aria-label="Ações"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(decision)}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[hsl(var(--hue-rose))] focus:text-[hsl(var(--hue-rose))]"
                onSelect={() => onDelete(decision)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          {decision.context ? (
            <section>
              <p className="text-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                Contexto
              </p>
              <p className="mt-1 text-sm text-foreground/90">{decision.context}</p>
            </section>
          ) : null}
          <section className="rounded-lg border border-primary/40 bg-primary/5 p-3">
            <p className="text-mono text-[9px] font-semibold uppercase tracking-widest text-primary/80">
              Por quê
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {decision.rationale}
            </p>
          </section>
          <section>
            <p className="text-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              Decisão
            </p>
            <p className="mt-1 text-sm text-foreground/90">{decision.decision}</p>
          </section>
        </div>
        <div className="space-y-3 text-sm">
          {decision.alternatives ? (
            <section>
              <p className="text-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                Alternativas
              </p>
              <p className="mt-1 text-muted-foreground">{decision.alternatives}</p>
            </section>
          ) : null}
          {decision.expectedImpact ? (
            <section>
              <p className="text-mono text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                Impacto esperado
              </p>
              <p className="mt-1 text-muted-foreground">
                {decision.expectedImpact}
              </p>
            </section>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        {decision.participants.length > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {decision.participants.join(", ")}
          </span>
        ) : null}
        {decision.tags.map((t) => (
          <Badge key={t} variant="muted" className="text-[10px]">
            {t}
          </Badge>
        ))}
      </div>
    </article>
  );
}
