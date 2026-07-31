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
import { Switch } from "@/components/ui/switch";
import {
  NOTE_TYPE,
  NOTE_TYPE_LABEL,
} from "@/lib/constants/enums";
import type { Project } from "@/types";

export interface NotesToolbarState {
  query: string;
  type: string;
  projectId: string;
  favoritesOnly: boolean;
  showArchived: boolean;
}

interface NotesToolbarProps extends NotesToolbarState {
  projects: Project[];
  onChange: (patch: Partial<NotesToolbarState>) => void;
  onReset: () => void;
  hasFilters: boolean;
}

export function NotesToolbar({
  query,
  type,
  projectId,
  favoritesOnly,
  showArchived,
  projects,
  onChange,
  onReset,
  hasFilters,
}: NotesToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="Buscar por título, conteúdo ou tag…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={type} onValueChange={(v) => onChange({ type: v })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {NOTE_TYPE.map((t) => (
                <SelectItem key={t} value={t}>
                  {NOTE_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-2">
          <Switch
            checked={favoritesOnly}
            onCheckedChange={(v) => onChange({ favoritesOnly: v })}
          />
          <span className="text-muted-foreground">Apenas favoritas</span>
        </label>
        <label className="flex items-center gap-2">
          <Switch
            checked={showArchived}
            onCheckedChange={(v) => onChange({ showArchived: v })}
          />
          <span className="text-muted-foreground">Mostrar arquivadas</span>
        </label>
      </div>
    </div>
  );
}
