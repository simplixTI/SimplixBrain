import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatRelative } from "@/lib/utils";
import type { Project } from "@/types";

import { PriorityBadge, StatusBadge } from "./project-badges";

interface ProjectCardProps {
  project: Project;
  openTasks: number;
}

export function ProjectCard({ project, openTasks }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-4 transition-colors hover:border-border hover:bg-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: project.color ?? "hsl(var(--primary))" }}
            />
            <p className="truncate text-sm font-semibold">{project.name}</p>
          </div>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {project.description || "Sem descrição."}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{project.progress}%</span>
          <span>
            {openTasks} abertas · atualizado {formatRelative(project.updatedAt)}
          </span>
        </div>
        <Progress value={project.progress} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={project.priority} />
        {project.category ? (
          <Badge variant="outline" className="border-border/70 text-[10px] font-normal">
            {project.category}
          </Badge>
        ) : null}
        {project.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="muted" className="text-[10px] font-normal">
            {tag}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
