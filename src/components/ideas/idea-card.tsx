"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelative } from "@/lib/utils";
import type { Idea, Project } from "@/types";

import {
  IdeaEffortBadge,
  IdeaPotentialBadge,
  IdeaStatusBadge,
} from "./idea-badges";

interface IdeaCardProps {
  idea: Idea;
  project?: Project;
  onEdit: (idea: Idea) => void;
  onDelete: (idea: Idea) => void;
}

export function IdeaCard({ idea, project, onEdit, onDelete }: IdeaCardProps) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-lg border border-border/60 bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <button
            type="button"
            onClick={() => onEdit(idea)}
            className="truncate text-left text-sm font-semibold hover:text-primary"
          >
            {idea.title}
          </button>
          <p className="text-[11px] text-muted-foreground">
            {project ? project.name : "Sem projeto"}
            {idea.category ? ` · ${idea.category}` : ""} · registrada{" "}
            {formatRelative(idea.createdAt)}
          </p>
        </div>
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
            <DropdownMenuItem onSelect={() => onEdit(idea)}>
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-[hsl(var(--hue-rose))] focus:text-[hsl(var(--hue-rose))]"
              onSelect={() => onDelete(idea)}
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {idea.description ? (
        <p className="line-clamp-3 text-xs text-muted-foreground/90">
          {idea.description}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5">
        <IdeaStatusBadge status={idea.status} />
        <IdeaPotentialBadge potential={idea.potential} />
        {idea.effort ? <IdeaEffortBadge effort={idea.effort} /> : null}
        {idea.tags.slice(0, 4).map((t) => (
          <Badge key={t} variant="muted" className="text-[10px]">
            {t}
          </Badge>
        ))}
      </div>
    </div>
  );
}
