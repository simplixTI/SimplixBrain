"use client";

import Link from "next/link";
import { ArrowRight, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useProjects, useTimeline } from "@/hooks/use-data";
import { TIMELINE_EVENT_LABEL } from "@/lib/constants/enums";
import { formatRelative } from "@/lib/utils";

export function RecentActivity() {
  const events = useTimeline();
  const projects = useProjects();

  const list = events.slice(0, 8);

  const projectName = (id?: string) =>
    id ? projects.find((p) => p.id === id)?.name : undefined;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Atividade recente</CardTitle>
          <CardDescription>
            O que aconteceu no workspace nas últimas ações.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/timeline">
            Timeline completa <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <EmptyState
            icon={History}
            title="Nenhuma atividade ainda."
            description="Assim que você criar projetos, tarefas ou decisões, elas aparecem aqui."
          />
        ) : (
          <ol className="space-y-3">
            {list.map((event) => (
              <li
                key={event.id}
                className="relative flex gap-3 rounded-md border border-border/40 bg-card/30 px-3 py-2"
              >
                <span
                  aria-hidden
                  className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{event.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{TIMELINE_EVENT_LABEL[event.type]}</span>
                    {projectName(event.projectId) ? (
                      <>
                        <span aria-hidden>•</span>
                        <span>{projectName(event.projectId)}</span>
                      </>
                    ) : null}
                    <span aria-hidden>•</span>
                    <span>{formatRelative(event.timestamp)}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
