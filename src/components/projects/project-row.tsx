import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { formatRelative } from "@/lib/utils";
import type { Project } from "@/types";

import { PriorityBadge, StatusBadge } from "./project-badges";

interface ProjectRowProps {
  project: Project;
  openTasks: number;
}

export function ProjectRow({ project, openTasks }: ProjectRowProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex items-center gap-4 border-b border-border/50 px-3 py-3 transition-colors hover:bg-card/60 last:border-b-0"
    >
      <span
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: project.color ?? "hsl(var(--primary))" }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{project.name}</p>
          {project.category ? (
            <span className="text-[11px] text-muted-foreground">
              · {project.category}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {project.description || "Sem descrição."}
        </p>
      </div>
      <div className="hidden w-36 md:block">
        <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{project.progress}%</span>
          <span>{openTasks} abertas</span>
        </div>
        <Progress value={project.progress} />
      </div>
      <div className="hidden shrink-0 sm:block">
        <StatusBadge status={project.status} />
      </div>
      <div className="hidden shrink-0 md:block">
        <PriorityBadge priority={project.priority} />
      </div>
      <p className="hidden w-24 shrink-0 text-right text-[11px] text-muted-foreground lg:block">
        {formatRelative(project.updatedAt)}
      </p>
      <ChevronRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
    </Link>
  );
}
