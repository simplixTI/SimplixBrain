"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Brain,
  CalendarClock,
  CheckSquare,
  Compass,
  Lightbulb,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  useDecisions,
  useIdeas,
  useMeetings,
  useProjects,
  useTasks,
} from "@/hooks/use-data";

type Hue = "violet" | "cyan" | "lime" | "amber" | "rose" | "indigo" | "fuchsia";

interface StatProps {
  label: string;
  value: number;
  icon: LucideIcon;
  hue: Hue;
  hint?: string;
}

const HUE_STYLES: Record<
  Hue,
  { text: string; iconWrap: string; ring: string; bg: string }
> = {
  violet: {
    text: "text-[hsl(var(--hue-violet))]",
    iconWrap:
      "bg-[hsl(var(--hue-violet)/0.15)] text-[hsl(var(--hue-violet))]",
    ring: "shadow-[0_0_0_1px_hsl(var(--hue-violet)/0.25),0_8px_24px_-12px_hsl(var(--hue-violet)/0.6)]",
    bg: "before:bg-[radial-gradient(circle_at_top_right,hsl(var(--hue-violet)/0.18),transparent_60%)]",
  },
  cyan: {
    text: "text-[hsl(var(--hue-cyan))]",
    iconWrap: "bg-[hsl(var(--hue-cyan)/0.15)] text-[hsl(var(--hue-cyan))]",
    ring: "shadow-[0_0_0_1px_hsl(var(--hue-cyan)/0.22),0_8px_24px_-12px_hsl(var(--hue-cyan)/0.55)]",
    bg: "before:bg-[radial-gradient(circle_at_top_right,hsl(var(--hue-cyan)/0.15),transparent_60%)]",
  },
  lime: {
    text: "text-[hsl(var(--hue-lime))]",
    iconWrap: "bg-[hsl(var(--hue-lime)/0.15)] text-[hsl(var(--hue-lime))]",
    ring: "shadow-[0_0_0_1px_hsl(var(--hue-lime)/0.22),0_8px_24px_-12px_hsl(var(--hue-lime)/0.55)]",
    bg: "before:bg-[radial-gradient(circle_at_top_right,hsl(var(--hue-lime)/0.15),transparent_60%)]",
  },
  amber: {
    text: "text-[hsl(var(--hue-amber))]",
    iconWrap: "bg-[hsl(var(--hue-amber)/0.15)] text-[hsl(var(--hue-amber))]",
    ring: "shadow-[0_0_0_1px_hsl(var(--hue-amber)/0.22),0_8px_24px_-12px_hsl(var(--hue-amber)/0.55)]",
    bg: "before:bg-[radial-gradient(circle_at_top_right,hsl(var(--hue-amber)/0.18),transparent_60%)]",
  },
  rose: {
    text: "text-[hsl(var(--hue-rose))]",
    iconWrap: "bg-[hsl(var(--hue-rose)/0.15)] text-[hsl(var(--hue-rose))]",
    ring: "shadow-[0_0_0_1px_hsl(var(--hue-rose)/0.25),0_8px_24px_-12px_hsl(var(--hue-rose)/0.6)]",
    bg: "before:bg-[radial-gradient(circle_at_top_right,hsl(var(--hue-rose)/0.18),transparent_60%)]",
  },
  indigo: {
    text: "text-[hsl(var(--hue-indigo))]",
    iconWrap:
      "bg-[hsl(var(--hue-indigo)/0.15)] text-[hsl(var(--hue-indigo))]",
    ring: "shadow-[0_0_0_1px_hsl(var(--hue-indigo)/0.22),0_8px_24px_-12px_hsl(var(--hue-indigo)/0.55)]",
    bg: "before:bg-[radial-gradient(circle_at_top_right,hsl(var(--hue-indigo)/0.15),transparent_60%)]",
  },
  fuchsia: {
    text: "text-[hsl(var(--hue-fuchsia))]",
    iconWrap:
      "bg-[hsl(var(--hue-fuchsia)/0.15)] text-[hsl(var(--hue-fuchsia))]",
    ring: "shadow-[0_0_0_1px_hsl(var(--hue-fuchsia)/0.22),0_8px_24px_-12px_hsl(var(--hue-fuchsia)/0.55)]",
    bg: "before:bg-[radial-gradient(circle_at_top_right,hsl(var(--hue-fuchsia)/0.18),transparent_60%)]",
  },
};

function StatCard({ label, value, icon: Icon, hue, hint }: StatProps) {
  const style = HUE_STYLES[hue];
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/70 bg-card/70 backdrop-blur transition-transform hover:-translate-y-0.5",
        style.ring,
        style.bg,
        "before:pointer-events-none before:absolute before:inset-0 before:opacity-90",
      )}
    >
      <CardContent className="relative flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 space-y-1">
          <p className="text-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className={cn("text-display text-4xl font-semibold leading-none", style.text)}>
            {value}
          </p>
          {hint ? (
            <p className="text-[11px] text-muted-foreground/80">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md",
            style.iconWrap,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function isOverdue(due?: string): boolean {
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(due).getTime() < today.getTime();
}

function isUpcoming(due: string, days: number): boolean {
  const target = new Date(due).getTime();
  const now = Date.now();
  return target >= now && target <= now + days * 24 * 60 * 60 * 1000;
}

export function StatCards() {
  const projects = useProjects();
  const tasks = useTasks();
  const ideas = useIdeas();
  const decisions = useDecisions();
  const meetings = useMeetings();

  const openTasks = tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled",
  );
  const overdueTasks = openTasks.filter((t) => isOverdue(t.dueDate));
  const activeProjects = projects.filter((p) => p.status === "active");
  const recentDecisions = decisions.filter((d) =>
    Date.now() - new Date(d.date).getTime() < 30 * 86400000,
  );
  const upcomingMeetings = meetings.filter((m) => isUpcoming(m.date, 14));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Pendentes"
        value={openTasks.length}
        icon={CheckSquare}
        hue="cyan"
      />
      <StatCard
        label="Atrasadas"
        value={overdueTasks.length}
        icon={AlertTriangle}
        hue="rose"
      />
      <StatCard
        label="Projetos ativos"
        value={activeProjects.length}
        icon={Compass}
        hue="lime"
      />
      <StatCard
        label="Ideias"
        value={ideas.length}
        icon={Lightbulb}
        hue="amber"
      />
      <StatCard
        label="Decisões"
        value={recentDecisions.length}
        icon={Brain}
        hue="violet"
        hint="Últimos 30 dias"
      />
      <StatCard
        label="Reuniões"
        value={upcomingMeetings.length}
        icon={CalendarClock}
        hue="fuchsia"
        hint="Próximas 2 semanas"
      />
    </div>
  );
}
