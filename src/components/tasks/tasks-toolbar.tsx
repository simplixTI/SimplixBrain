"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITY, PRIORITY_LABEL } from "@/lib/constants/enums";
import type { Project } from "@/types";

export interface TasksToolbarState {
  query: string;
  projectId: string;
  priority: string;
}

interface TasksToolbarProps extends TasksToolbarState {
  projects: Project[];
  onChange: (patch: Partial<TasksToolbarState>) => void;
  onReset: () => void;
  hasFilters: boolean;
}

export function TasksToolbar({
  query,
  projectId,
  priority,
  projects,
  onChange,
  onReset,
  hasFilters,
}: TasksToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="Buscar por título, tag ou responsável…"
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={projectId}
          onValueChange={(v) => onChange({ projectId: v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            <SelectItem value="none">Sem projeto</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => onChange({ priority: v })}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            {PRIORITY.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
