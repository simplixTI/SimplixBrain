"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Eye,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNotes, useProjects } from "@/hooks/use-data";
import { NOTE_TYPE, NOTE_TYPE_LABEL, type NoteType } from "@/lib/constants/enums";
import { noteRepository, timelineRepository } from "@/lib/database/local";
import { cn, formatRelative } from "@/lib/utils";
import type { Note } from "@/types";

import { MarkdownView } from "./markdown-view";
import { NoteTypeBadge } from "./note-badges";

interface NoteEditorProps {
  noteId: string;
}

type SaveStatus = "idle" | "dirty" | "saving" | "saved";

type Mode = "edit" | "preview" | "split";

function tagsFromInput(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const notes = useNotes();
  const projects = useProjects();
  const router = useRouter();

  const note = useMemo<Note | undefined>(
    () => notes.find((n) => n.id === noteId),
    [notes, noteId],
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<NoteType>("general");
  const [projectId, setProjectId] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [archived, setArchived] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [mode, setMode] = useState<Mode>("edit");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Load once when the note appears / changes.
  const loadedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!note) return;
    if (loadedIdRef.current === note.id) return;
    loadedIdRef.current = note.id;
    setTitle(note.title);
    setContent(note.content);
    setType(note.type);
    setProjectId(note.projectId ?? "");
    setTagInput(note.tags.join(", "));
    setFavorite(note.favorite);
    setArchived(note.archived);
    setStatus("idle");
    setSavedAt(note.updatedAt);
  }, [note]);

  const persist = useCallback(() => {
    if (!note) return;
    setStatus("saving");
    const trimmedTitle = title.trim() || "Nota sem título";
    const updated = noteRepository.update(note.id, {
      title: trimmedTitle,
      content,
      type,
      projectId: projectId || undefined,
      tags: tagsFromInput(tagInput),
      favorite,
      archived,
    });
    if (updated) {
      setSavedAt(updated.updatedAt);
      setStatus("saved");
    } else {
      setStatus("idle");
    }
  }, [note, title, content, type, projectId, tagInput, favorite, archived]);

  const persistRef = useRef(persist);
  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  // Debounced autosave whenever local state changes after initial load.
  useEffect(() => {
    if (!note) return;
    if (loadedIdRef.current !== note.id) return;
    setStatus("dirty");
    const handle = window.setTimeout(() => {
      persistRef.current();
    }, 900);
    return () => window.clearTimeout(handle);
  }, [note, title, content, type, projectId, tagInput, favorite, archived]);

  function handleDelete() {
    if (!note) return;
    if (!window.confirm(`Excluir a nota "${note.title}"?`)) return;
    noteRepository.delete(note.id);
    toast.success("Nota excluída.");
    router.push("/notes");
  }

  function toggleArchived() {
    setArchived((v) => {
      const next = !v;
      toast.success(next ? "Nota arquivada." : "Nota reativada.");
      return next;
    });
  }

  function toggleFavorite() {
    setFavorite((v) => !v);
  }

  function noteUpdatedRecord() {
    if (!note) return;
    timelineRepository.record({
      type: "note_updated",
      entityKind: "note",
      entityId: note.id,
      projectId: projectId || undefined,
      title: `Nota atualizada: ${title.trim() || "Nota sem título"}`,
    });
  }

  function manualSave() {
    persist();
    noteUpdatedRecord();
    toast.success("Alterações salvas.");
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={Pencil}
        title="Carregando…"
        description="Preparando o workspace."
      />
    );
  }

  if (!note) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Button variant="ghost" asChild className="self-start">
          <Link href="/notes">
            <ArrowLeft className="h-4 w-4" />
            Voltar para notas
          </Link>
        </Button>
        <EmptyState
          icon={Pencil}
          title="Nota não encontrada."
          description="Pode ter sido excluída. Volte para a listagem para conferir."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" asChild size="sm" className="text-muted-foreground">
          <Link href="/notes">
            <ArrowLeft className="h-4 w-4" />
            Notas
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-[11px] transition-colors",
              status === "saved" && "text-emerald-500",
              status === "saving" && "text-muted-foreground",
              status === "dirty" && "text-amber-500",
              status === "idle" && "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {status === "saved" && savedAt
              ? `Salvo ${formatRelative(savedAt)}`
              : status === "saving"
                ? "Salvando…"
                : status === "dirty"
                  ? "Alterações não salvas"
                  : savedAt
                    ? `Salvo ${formatRelative(savedAt)}`
                    : "Sem alterações"}
          </p>
          <div className="inline-flex overflow-hidden rounded-md border border-border">
            {(["edit", "split", "preview"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex h-8 items-center gap-1.5 px-2.5 text-[11px] transition-colors",
                  mode === m
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/40",
                  m !== "edit" && "border-l border-border",
                )}
                aria-pressed={mode === m}
              >
                {m === "edit" ? (
                  <>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </>
                ) : m === "preview" ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </>
                ) : (
                  <>
                    <Pencil className="h-3.5 w-3.5" />
                    <Eye className="h-3.5 w-3.5" />
                    Split
                  </>
                )}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={manualSave}>
            Salvar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais ações">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={toggleArchived}>
                {archived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    Reativar
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    Arquivar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400 focus:text-red-400"
                onSelect={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Excluir nota
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFavorite}
                aria-label={favorite ? "Remover dos favoritos" : "Marcar como favorita"}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    favorite && "fill-amber-400 text-amber-400",
                  )}
                />
              </button>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da nota"
                className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <NoteTypeBadge type={type} />
              {archived ? (
                <Badge variant="warning">Arquivada</Badge>
              ) : null}
              {tagsFromInput(tagInput).map((t) => (
                <Badge key={t} variant="muted" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {mode === "edit" ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva em Markdown. Títulos com #, listas com -, checkboxes com - [ ], código com ```."
                  className="min-h-[420px] resize-none rounded-md border-none bg-transparent p-4 font-mono text-sm leading-relaxed focus-visible:ring-0"
                />
              ) : mode === "preview" ? (
                <div className="min-h-[420px] p-4">
                  <MarkdownView content={content} />
                </div>
              ) : (
                <div className="grid gap-0 md:grid-cols-2">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva em Markdown…"
                    className="min-h-[420px] resize-none rounded-none border-0 border-r border-border bg-transparent p-4 font-mono text-sm leading-relaxed focus-visible:ring-0"
                  />
                  <div className="min-h-[420px] overflow-auto p-4">
                    <MarkdownView content={content} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-4">
            <Label>Projeto</Label>
            <Select
              value={projectId || "none"}
              onValueChange={(v) => setProjectId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem projeto</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-4">
            <Label>Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as NoteType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPE.map((t) => (
                  <SelectItem key={t} value={t}>
                    {NOTE_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-4">
            <Label htmlFor="note-tags">Tags</Label>
            <Input
              id="note-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="separadas, por, virgula"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Metadados
            </p>
            <p className="text-[11px] text-muted-foreground">
              Criada {formatRelative(note.createdAt)} · atualizada{" "}
              {formatRelative(note.updatedAt)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
