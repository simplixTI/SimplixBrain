"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  CalendarClock,
  CheckSquare,
  FileText,
  Folder,
  History,
  Lightbulb,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  PriorityBadge,
  StatusBadge,
} from "@/components/projects/project-badges";
import { ProjectBrainPanel } from "@/components/projects/project-brain-panel";
import { ProjectForm } from "@/components/projects/project-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DECISION_STATUS_LABEL,
  IDEA_STATUS_LABEL,
  NOTE_TYPE_LABEL,
  TASK_STATUS_LABEL,
  TIMELINE_EVENT_LABEL,
} from "@/lib/constants/enums";
import {
  noteRepository,
  projectRepository,
  taskRepository,
  timelineRepository,
} from "@/lib/database/local";
import { cn, formatDate, formatDateTime, formatRelative, truncate } from "@/lib/utils";
import {
  useDecisions,
  useIdeas,
  useMeetings,
  useNotes,
  useProjects,
  useTasks,
  useTimeline,
} from "@/hooks/use-data";
import type { Decision, Idea, Meeting, Note, Project, Task, TimelineEvent } from "@/types";

interface ProjectDetailProps {
  slug: string;
}

function fmt(date?: string): string {
  return date ? formatDate(date) : "—";
}

export function ProjectDetail({ slug }: ProjectDetailProps) {
  const projects = useProjects();
  const notes = useNotes();
  const tasks = useTasks();
  const ideas = useIdeas();
  const decisions = useDecisions();
  const meetings = useMeetings();
  const timeline = useTimeline();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const project = useMemo(
    () => projects.find((p) => p.slug === slug),
    [projects, slug],
  );

  const projectNotes = useMemo(
    () => (project ? notes.filter((n) => n.projectId === project.id) : []),
    [notes, project],
  );
  const projectTasks = useMemo(
    () => (project ? tasks.filter((t) => t.projectId === project.id) : []),
    [tasks, project],
  );
  const projectIdeas = useMemo(
    () => (project ? ideas.filter((i) => i.projectId === project.id) : []),
    [ideas, project],
  );
  const projectDecisions = useMemo(
    () => (project ? decisions.filter((d) => d.projectId === project.id) : []),
    [decisions, project],
  );
  const projectMeetings = useMemo(
    () => (project ? meetings.filter((m) => m.projectId === project.id) : []),
    [meetings, project],
  );
  const projectTimeline = useMemo(
    () => (project ? timeline.filter((e) => e.projectId === project.id) : []),
    [timeline, project],
  );

  if (projects.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-4xl">
        <EmptyState
          icon={Folder}
          title="Carregando workspace…"
          description="Aguarde enquanto carregamos os projetos."
        />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Button variant="ghost" asChild className="self-start">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
            Voltar para projetos
          </Link>
        </Button>
        <EmptyState
          icon={Folder}
          title="Projeto não encontrado."
          description="Confira o link ou volte para a listagem de projetos."
        />
      </div>
    );
  }

  const openTasks = projectTasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled",
  );

  function handleDelete() {
    if (!project) return;
    if (
      !window.confirm(
        `Excluir o projeto "${project.name}"? Isso não remove notas, tarefas ou decisões vinculadas.`,
      )
    ) {
      return;
    }
    projectRepository.delete(project.id);
    toast.success("Projeto excluído.");
    router.push("/projects");
  }

  function toggleFavoriteNote(note: Note) {
    noteRepository.update(note.id, { favorite: !note.favorite });
  }

  function toggleTaskDone(task: Task) {
    const nowDone = task.status !== "done";
    taskRepository.update(task.id, {
      status: nowDone ? "done" : "todo",
      completedAt: nowDone ? new Date().toISOString() : undefined,
    });
    if (nowDone) {
      timelineRepository.record({
        type: "task_completed",
        entityKind: "task",
        entityId: task.id,
        projectId: task.projectId,
        title: `Tarefa concluída: ${task.title}`,
      });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild size="sm" className="text-muted-foreground">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
            Projetos
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ProjectForm
            project={project}
            open={editOpen}
            onOpenChange={setEditOpen}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais ações">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400 focus:text-red-400"
                onSelect={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Excluir projeto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-3 w-3 rounded-full"
                style={{ background: project.color ?? "hsl(var(--primary))" }}
              />
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {project.name}
              </h1>
            </div>
            {project.description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {project.description}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
              {project.category ? (
                <Badge variant="outline" className="border-border/70 text-[10px] font-normal">
                  {project.category}
                </Badge>
              ) : null}
              {project.tags.map((t) => (
                <Badge key={t} variant="muted" className="text-[10px] font-normal">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid w-full max-w-xs gap-2 rounded-lg border border-border/60 bg-card/40 p-4 sm:w-64">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span className="font-medium text-foreground">
                {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} />
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div>
                <p className="text-muted-foreground">Início</p>
                <p className="font-medium">{fmt(project.startDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Prazo</p>
                <p className="font-medium">{fmt(project.dueDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tarefas abertas</p>
                <p className="font-medium">{openTasks.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Última atualização</p>
                <p className="font-medium">{formatRelative(project.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="notes">Notas ({projectNotes.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas ({projectTasks.length})</TabsTrigger>
          <TabsTrigger value="ideas">Ideias ({projectIdeas.length})</TabsTrigger>
          <TabsTrigger value="decisions">
            Decisões ({projectDecisions.length})
          </TabsTrigger>
          <TabsTrigger value="meetings">
            Reuniões ({projectMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="brain">Brain</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            project={project}
            openTasks={openTasks}
            notes={projectNotes}
            decisions={projectDecisions}
            timeline={projectTimeline}
          />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab notes={projectNotes} onToggleFavorite={toggleFavoriteNote} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab tasks={projectTasks} onToggle={toggleTaskDone} />
        </TabsContent>

        <TabsContent value="ideas">
          <IdeasTab ideas={projectIdeas} />
        </TabsContent>

        <TabsContent value="decisions">
          <DecisionsTab decisions={projectDecisions} />
        </TabsContent>

        <TabsContent value="meetings">
          <MeetingsTab meetings={projectMeetings} />
        </TabsContent>

        <TabsContent value="files">
          <EmptyState
            icon={Folder}
            title="Arquivos chegam em breve."
            description="Upload de PDFs e documentos entra na fase de base de conhecimento."
          />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineTab events={projectTimeline} />
        </TabsContent>

        <TabsContent value="brain">
          <ProjectBrainPanel
            project={project}
            notes={projectNotes}
            tasks={projectTasks}
            ideas={projectIdeas}
            decisions={projectDecisions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------- Tab: Overview -------- */

interface OverviewTabProps {
  project: Project;
  openTasks: Task[];
  notes: Note[];
  decisions: Decision[];
  timeline: TimelineEvent[];
}

function OverviewTab({
  project,
  openTasks,
  notes,
  decisions,
  timeline,
}: OverviewTabProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Objetivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">
              {project.objective || "Objetivo ainda não descrito."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Tarefas em aberto</CardTitle>
              <CardDescription>
                {openTasks.length === 0 ? "Nada pendente." : "Foco imediato."}
              </CardDescription>
            </div>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {openTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">Tudo em dia por aqui.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {openTasks.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full bg-primary/70"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{t.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {TASK_STATUS_LABEL[t.status]}
                        {t.dueDate ? ` · ${formatRelative(t.dueDate)}` : ""}
                      </p>
                    </div>
                    <PriorityBadge priority={t.priority} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Últimas notas</CardTitle>
              <CardDescription>Registros recentes ligados ao projeto.</CardDescription>
            </div>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma nota ainda.</p>
            ) : (
              <ul className="space-y-2">
                {notes.slice(0, 4).map((n) => (
                  <li
                    key={n.id}
                    className="rounded-md border border-border/50 bg-background/40 px-3 py-2"
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {truncate(n.content.replace(/[#*_>-]/g, ""), 160)}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {NOTE_TYPE_LABEL[n.type]} · {formatRelative(n.updatedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Últimas decisões</CardTitle>
              <CardDescription>O “porquê” fica registrado aqui.</CardDescription>
            </div>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {decisions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sem decisões registradas.
              </p>
            ) : (
              <ul className="space-y-3">
                {decisions.slice(0, 3).map((d) => (
                  <li key={d.id} className="space-y-1">
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {DECISION_STATUS_LABEL[d.status]} · {formatRelative(d.date)}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground/90">
                      {d.rationale}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Atividade recente</CardTitle>
              <CardDescription>Últimos eventos do projeto.</CardDescription>
            </div>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma atividade registrada ainda.
              </p>
            ) : (
              <ol className="space-y-2">
                {timeline.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex gap-2 text-xs">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{e.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {TIMELINE_EVENT_LABEL[e.type]} · {formatRelative(e.timestamp)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------- Tab: Notes -------- */

function NotesTab({
  notes,
  onToggleFavorite,
}: {
  notes: Note[];
  onToggleFavorite: (note: Note) => void;
}) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhuma nota neste projeto."
        description="Crie notas técnicas, estratégicas ou de pesquisa no módulo de Notas."
      />
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {notes.map((n) => (
        <div
          key={n.id}
          className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/40 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{n.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {NOTE_TYPE_LABEL[n.type]} · atualizado {formatRelative(n.updatedAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => onToggleFavorite(n)}
              aria-label={n.favorite ? "Remover dos favoritos" : "Marcar como favorita"}
            >
              <Star
                className={cn("h-4 w-4", n.favorite && "fill-amber-400 text-amber-400")}
              />
            </Button>
          </div>
          <p className="line-clamp-4 text-xs text-muted-foreground/90">
            {truncate(n.content.replace(/[#*_>-]/g, ""), 220)}
          </p>
          <div className="flex flex-wrap gap-1">
            {n.tags.map((t) => (
              <Badge key={t} variant="muted" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------- Tab: Tasks -------- */

function TasksTab({
  tasks,
  onToggle,
}: {
  tasks: Task[];
  onToggle: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Nenhuma tarefa aqui."
        description="Cadastre tarefas para acompanhar o progresso deste projeto."
      />
    );
  }
  const grouped = [...tasks].sort((a, b) => {
    const ao = a.status === "done" || a.status === "cancelled" ? 1 : 0;
    const bo = b.status === "done" || b.status === "cancelled" ? 1 : 0;
    if (ao !== bo) return ao - bo;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  return (
    <Card>
      <CardContent className="divide-y divide-border/60 p-0">
        {grouped.map((t) => {
          const done = t.status === "done";
          return (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <button
                type="button"
                onClick={() => onToggle(t)}
                aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  done
                    ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-500"
                    : "border-border hover:border-primary/60",
                )}
              >
                {done ? <CheckSquare className="h-3 w-3" /> : null}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    done && "text-muted-foreground line-through",
                  )}
                >
                  {t.title}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {TASK_STATUS_LABEL[t.status]}
                  {t.dueDate ? ` · ${formatRelative(t.dueDate)}` : ""}
                  {t.tags.length > 0 ? ` · ${t.tags.join(", ")}` : ""}
                </p>
              </div>
              <PriorityBadge priority={t.priority} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* -------- Tab: Ideas -------- */

function IdeasTab({ ideas }: { ideas: Idea[] }) {
  if (ideas.length === 0) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="Nenhuma ideia registrada."
        description="Anote ideias no módulo de Ideias — mesmo as ainda cruas."
      />
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ideas.map((i) => (
        <div
          key={i.id}
          className="rounded-lg border border-border/60 bg-card/40 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{i.title}</p>
            <Badge variant="outline" className="border-border/70 text-[10px]">
              {IDEA_STATUS_LABEL[i.status]}
            </Badge>
          </div>
          {i.description ? (
            <p className="mt-1 text-xs text-muted-foreground">{i.description}</p>
          ) : null}
          <p className="mt-2 text-[10px] text-muted-foreground">
            Potencial: {i.potential.replace("_", " ")}
            {i.effort ? ` · Esforço: ${i.effort.toUpperCase()}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

/* -------- Tab: Decisions -------- */

function DecisionsTab({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) {
    return (
      <EmptyState
        icon={Brain}
        title="Nenhuma decisão registrada."
        description="O módulo de Decisões guarda contexto, alternativas e o porquê da escolha."
      />
    );
  }
  return (
    <ol className="relative border-l border-border/60 pl-6">
      {decisions.map((d) => (
        <li key={d.id} className="mb-5 last:mb-0">
          <span
            aria-hidden
            className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-background bg-primary"
          />
          <p className="text-sm font-semibold">{d.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {DECISION_STATUS_LABEL[d.status]} · {formatDate(d.date)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Por quê:</span>{" "}
            {d.rationale}
          </p>
          {d.alternatives ? (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Alternativas:</span>{" "}
              {d.alternatives}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/* -------- Tab: Meetings -------- */

function MeetingsTab({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nenhuma reunião registrada."
        description="Guarde pautas, decisões tomadas e próximos passos aqui."
      />
    );
  }
  return (
    <div className="space-y-3">
      {meetings.map((m) => (
        <Card key={m.id}>
          <CardHeader>
            <CardTitle>{m.title}</CardTitle>
            <CardDescription>
              {formatDate(m.date)}
              {m.startTime ? ` · ${m.startTime}` : ""}
              {m.participants.length > 0 ? ` · ${m.participants.join(", ")}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {m.agenda ? (
              <p>
                <span className="font-medium">Pauta:</span> {m.agenda}
              </p>
            ) : null}
            {m.notes ? (
              <p className="whitespace-pre-wrap text-muted-foreground">
                {m.notes}
              </p>
            ) : null}
            {m.decisionsTaken.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Decisões tomadas
                </p>
                <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                  {m.decisionsTaken.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {m.nextSteps ? (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Próximos passos:</span>{" "}
                {m.nextSteps}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* -------- Tab: Timeline -------- */

function TimelineTab({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Nenhum evento neste projeto."
        description="Ações realizadas no projeto aparecem aqui automaticamente."
      />
    );
  }
  return (
    <ol className="relative border-l border-border/60 pl-6">
      {events.map((e) => (
        <li key={e.id} className="mb-4 last:mb-0">
          <span
            aria-hidden
            className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-background bg-primary/80"
          />
          <p className="text-sm">{e.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {TIMELINE_EVENT_LABEL[e.type]} · {formatDateTime(e.timestamp)}
          </p>
        </li>
      ))}
    </ol>
  );
}

