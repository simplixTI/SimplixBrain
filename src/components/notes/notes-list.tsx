"use client";

import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useNotes, useProjects } from "@/hooks/use-data";
import { noteRepository, timelineRepository } from "@/lib/database/local";

import { NoteCard } from "./note-card";
import {
  NotesToolbar,
  type NotesToolbarState,
} from "./notes-toolbar";

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const INITIAL: NotesToolbarState = {
  query: "",
  type: "all",
  projectId: "all",
  favoritesOnly: false,
  showArchived: false,
};

export function NotesList() {
  const notes = useNotes();
  const projects = useProjects();
  const router = useRouter();

  const [state, setState] = useState<NotesToolbarState>(INITIAL);

  const filtered = useMemo(() => {
    const q = normalize(state.query.trim());
    return notes.filter((n) => {
      if (!state.showArchived && n.archived) return false;
      if (state.favoritesOnly && !n.favorite) return false;
      if (state.type !== "all" && n.type !== state.type) return false;
      if (state.projectId === "none" && n.projectId) return false;
      if (
        state.projectId !== "all" &&
        state.projectId !== "none" &&
        n.projectId !== state.projectId
      )
        return false;
      if (!q) return true;
      const haystack = [n.title, n.content, n.tags.join(" ")]
        .map(normalize)
        .join(" ");
      return haystack.includes(q);
    });
  }, [notes, state]);

  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const hasFilters =
    state.query !== "" ||
    state.type !== "all" ||
    state.projectId !== "all" ||
    state.favoritesOnly ||
    state.showArchived;

  function handleNewNote() {
    const created = noteRepository.create({
      title: "Nota sem título",
      content: "",
      type: "general",
      tags: [],
      favorite: false,
      archived: false,
    });
    timelineRepository.record({
      type: "note_created",
      entityKind: "note",
      entityId: created.id,
      projectId: undefined,
      title: `Nota criada: ${created.title}`,
    });
    toast.success("Nova nota criada.");
    router.push(`/notes/${created.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notas</h1>
          <p className="text-sm text-muted-foreground">
            {notes.filter((n) => !n.archived).length} nota
            {notes.length === 1 ? "" : "s"} ativas no workspace.
          </p>
        </div>
        <Button onClick={handleNewNote}>
          <Plus className="h-4 w-4" />
          Nova nota
        </Button>
      </div>

      <NotesToolbar
        {...state}
        projects={projects}
        hasFilters={hasFilters}
        onReset={() => setState(INITIAL)}
        onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma nota ainda."
          description="Crie sua primeira nota para começar a acumular conhecimento."
          action={
            <Button onClick={handleNewNote}>
              <Plus className="h-4 w-4" />
              Criar nota
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nada bate com os filtros."
          description="Ajuste o tipo, projeto ou busca."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              project={note.projectId ? projectById.get(note.projectId) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
