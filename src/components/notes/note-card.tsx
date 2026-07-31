import Link from "next/link";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatRelative, truncate } from "@/lib/utils";
import type { Note, Project } from "@/types";

import { NoteTypeBadge } from "./note-badges";

interface NoteCardProps {
  note: Note;
  project?: Project;
}

function preview(content: string): string {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#+\s+/gm, "")
    .replace(/[*_>~`-]/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[[^\]]+\]\([^)]*\)/g, "$1")
    .trim();
  return truncate(stripped, 220);
}

export function NoteCard({ note, project }: NoteCardProps) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="group flex h-full flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-4 transition-colors hover:border-border hover:bg-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold">{note.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {project ? `${project.name} · ` : ""}
            atualizado {formatRelative(note.updatedAt)}
          </p>
        </div>
        {note.favorite ? (
          <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
        ) : null}
      </div>
      <p className="line-clamp-4 flex-1 text-xs text-muted-foreground/90">
        {preview(note.content)}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <NoteTypeBadge type={note.type} />
        {note.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="muted" className="text-[10px] font-normal">
            {tag}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
