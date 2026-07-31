"use client";

import { Brain, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useDecisions,
  useIdeas,
  useProjects,
  useTasks,
} from "@/hooks/use-data";
import type { Project } from "@/types";

interface Insight {
  id: string;
  message: string;
  tone: "info" | "warning" | "danger";
}

const DAY = 86_400_000;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
}

function pickStale(projects: Project[]): Project | undefined {
  return projects
    .filter((p) => p.status === "active" || p.status === "planning")
    .sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    )[0];
}

export function BrainInsights() {
  const projects = useProjects();
  const tasks = useTasks();
  const ideas = useIdeas();
  const decisions = useDecisions();

  const insights = useMemo<Insight[]>(() => {
    const list: Insight[] = [];

    const stale = pickStale(projects);
    if (stale) {
      const days = daysSince(stale.updatedAt);
      if (days >= 3) {
        list.push({
          id: `stale-${stale.id}`,
          message: `O projeto ${stale.name} não recebe atualização há ${days} dias.`,
          tone: "warning",
        });
      }
    }

    for (const project of projects) {
      const overdue = tasks.filter(
        (t) =>
          t.projectId === project.id &&
          t.status !== "done" &&
          t.status !== "cancelled" &&
          t.dueDate &&
          new Date(t.dueDate).getTime() < Date.now(),
      );
      if (overdue.length > 0) {
        list.push({
          id: `overdue-${project.id}`,
          message: `Existem ${overdue.length} tarefa(s) vencida(s) relacionadas ao ${project.name}.`,
          tone: "danger",
        });
      }
    }

    if (decisions.length > 0) {
      const last = decisions[0]!;
      list.push({
        id: `last-decision-${last.id}`,
        message: `Última decisão registrada: "${last.title}". Vale revisitar o motivo antes da próxima reunião.`,
        tone: "info",
      });
    }

    const recentIdea = ideas[0];
    if (recentIdea && recentIdea.projectId) {
      const project = projects.find((p) => p.id === recentIdea.projectId);
      if (project) {
        list.push({
          id: `idea-${recentIdea.id}`,
          message: `A ideia "${recentIdea.title}" tem potencial para o projeto ${project.name}.`,
          tone: "info",
        });
      }
    }

    return list.slice(0, 4);
  }, [projects, tasks, ideas, decisions]);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-indigo-500/20">
              <Brain className="brain-animate h-4 w-4 text-violet-300" aria-hidden />
              <span
                className="idea-spark"
                style={
                  {
                    animationDelay: "0s",
                    "--tx-mid": "-6px",
                    "--tx-end": "-16px",
                  } as React.CSSProperties
                }
                aria-hidden
              />
              <span
                className="idea-spark idea-spark--dot"
                style={
                  {
                    animationDelay: "0.8s",
                    "--tx-mid": "4px",
                    "--tx-end": "10px",
                  } as React.CSSProperties
                }
                aria-hidden
              />
              <span
                className="idea-spark idea-spark--cyan"
                style={
                  {
                    animationDelay: "1.6s",
                    "--tx-mid": "0px",
                    "--tx-end": "-2px",
                  } as React.CSSProperties
                }
                aria-hidden
              />
            </span>
            Brain Insights
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-violet-300/70" />
            Sugestões da inteligência do workspace. Em breve com IA de verdade.
          </CardDescription>
        </div>
        <Badge variant="outline" className="border-primary/30 text-[10px]">
          Preview
        </Badge>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nada relevante no radar. Aproveite para respirar.
          </p>
        ) : (
          <ul className="space-y-2">
            {insights.map((insight) => (
              <li
                key={insight.id}
                className="flex items-start gap-2 rounded-md border border-border/50 bg-background/40 px-3 py-2 text-sm"
              >
                <span
                  aria-hidden
                  className={
                    insight.tone === "danger"
                      ? "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400"
                      : insight.tone === "warning"
                        ? "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                        : "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70"
                  }
                />
                <span className="leading-snug">{insight.message}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
