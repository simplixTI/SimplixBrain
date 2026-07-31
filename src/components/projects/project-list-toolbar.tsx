"use client";

import { LayoutGrid, List as ListIcon, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITY,
  PRIORITY_LABEL,
  PROJECT_STATUS,
  PROJECT_STATUS_LABEL,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

export type ViewMode = "cards" | "list";
export type SortMode = "updated" | "created" | "name" | "progress" | "priority";

const SORT_LABELS: Record<SortMode, string> = {
  updated: "Última atualização",
  created: "Criação",
  name: "Nome (A→Z)",
  progress: "Progresso",
  priority: "Prioridade",
};

interface ToolbarProps {
  query: string;
  onQuery: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  priority: string;
  onPriority: (v: string) => void;
  sort: SortMode;
  onSort: (v: SortMode) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  onReset: () => void;
  hasFilters: boolean;
}

export function ProjectListToolbar(props: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={props.query}
          onChange={(e) => props.onQuery(e.target.value)}
          placeholder="Buscar por nome, descrição ou tag…"
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={props.status} onValueChange={props.onStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {PROJECT_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {PROJECT_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={props.priority} onValueChange={props.onPriority}>
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
        <Select value={props.sort} onValueChange={(v) => props.onSort(v as SortMode)}>
          <SelectTrigger className="w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortMode[]).map((k) => (
              <SelectItem key={k} value={k}>
                Ordenar: {SORT_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="inline-flex overflow-hidden rounded-md border border-border">
          <button
            type="button"
            onClick={() => props.onView("cards")}
            className={cn(
              "flex h-9 items-center gap-1.5 px-2.5 text-xs transition-colors",
              props.view === "cards"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/40",
            )}
            aria-pressed={props.view === "cards"}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => props.onView("list")}
            className={cn(
              "flex h-9 items-center gap-1.5 border-l border-border px-2.5 text-xs transition-colors",
              props.view === "list"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/40",
            )}
            aria-pressed={props.view === "list"}
          >
            <ListIcon className="h-3.5 w-3.5" />
            Lista
          </button>
        </div>
        {props.hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={props.onReset}
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
