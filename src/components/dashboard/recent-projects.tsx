"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import {
  PRIORITY_LABEL,
  PROJECT_STATUS_LABEL,
  type ProjectStatus,
} from "@/lib/constants/enums";
import { formatRelative } from "@/lib/utils";
import { useProjects, useTasks } from "@/hooks/use-data";

const STATUS_TONE: Record<ProjectStatus, string> = {
  idea: "bg-muted text-muted-foreground",
  planning: "bg-sky-500/15 text-sky-400",
  active: "bg-emerald-500/15 text-emerald-500",
  paused: "bg-amber-500/15 text-amber-500",
  completed: "bg-violet-500/15 text-violet-400",
  archived: "bg-muted text-muted-foreground",
};

export function RecentProjects() {
  const projects = useProjects();
  const tasks = useTasks();

  const list = projects.slice(0, 4);

  const openCount = (projectId: string) =>
    tasks.filter(
      (t) =>
        t.projectId === projectId &&
        t.status !== "done" &&
        t.status !== "cancelled",
    ).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Projetos recentes</CardTitle>
          <CardDescription>
            Últimas atualizações nos projetos do workspace.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {list.length === 0 ? (
          <EmptyState
            className="md:col-span-2"
            icon={Compass}
            title="Nenhum projeto ainda."
            description="Crie o primeiro projeto para começar a organizar seu trabalho."
          />
        ) : (
          list.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="group flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-4 transition-colors hover:border-border hover:bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{ background: project.color ?? "hsl(var(--primary))" }}
                    />
                    <p className="truncate text-sm font-semibold">
                      {project.name}
                    </p>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {project.description}
                  </p>
                </div>
                <Badge className={STATUS_TONE[project.status]}>
                  {PROJECT_STATUS_LABEL[project.status]}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{project.progress}%</span>
                  <span>
                    {openCount(project.id)} abertas · atualizado{" "}
                    {formatRelative(project.updatedAt)}
                  </span>
                </div>
                <Progress value={project.progress} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="border-border/70 text-[10px] font-normal">
                  {PRIORITY_LABEL[project.priority]}
                </Badge>
                {project.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="muted"
                    className="text-[10px] font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
