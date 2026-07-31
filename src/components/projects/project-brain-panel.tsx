"use client";

import { MessageSquare, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import type { Decision, Idea, Note, Project, Task } from "@/types";

interface ProjectBrainPanelProps {
  project: Project;
  notes: Note[];
  tasks: Task[];
  ideas: Idea[];
  decisions: Decision[];
}

interface PreviewMessage {
  role: "user" | "assistant";
  content: string;
  time: string;
}

function suggestReply(
  question: string,
  project: Project,
  ctx: {
    notes: Note[];
    tasks: Task[];
    ideas: Idea[];
    decisions: Decision[];
  },
): string {
  const q = question.toLowerCase();
  if (q.includes("resumo") || q.includes("resuma") || q.includes("visão geral")) {
    return (
      `${project.name} está com status "${project.status}" e prioridade "${project.priority}". ` +
      `Progresso atual: ${project.progress}%. ` +
      `Objetivo: ${project.objective || "ainda não descrito"}.`
    );
  }
  if (q.includes("tarefa") || q.includes("pendente") || q.includes("atrasa")) {
    const open = ctx.tasks.filter(
      (t) => t.status !== "done" && t.status !== "cancelled",
    );
    return `Existem ${open.length} tarefa(s) em aberto neste projeto. ${
      open
        .slice(0, 3)
        .map((t) => `• ${t.title}`)
        .join(" ") || ""
    }`;
  }
  if (q.includes("decis")) {
    if (ctx.decisions.length === 0)
      return "Nenhuma decisão registrada ainda para este projeto.";
    const last = ctx.decisions[0]!;
    return `Última decisão: "${last.title}". Motivo: ${last.rationale}`;
  }
  if (q.includes("ideia")) {
    return `Ideias registradas: ${ctx.ideas.length}. ${
      ctx.ideas[0] ? `Mais recente: "${ctx.ideas[0].title}".` : ""
    }`;
  }
  if (q.includes("próximo") || q.includes("proximo") || q.includes("passo")) {
    return "Sugestão: avance com as tarefas críticas em aberto e revise a última decisão registrada antes da próxima reunião.";
  }
  return `Ainda estou em modo simulado, mas já entendi o contexto de "${project.name}". Quando a IA for conectada, respondo usando notas, tarefas, decisões e reuniões deste projeto.`;
}

const SUGGESTIONS = [
  "Resuma o projeto",
  "Quais tarefas estão em aberto?",
  "Qual foi a última decisão?",
  "Quais são os próximos passos?",
];

export function ProjectBrainPanel({
  project,
  notes,
  tasks,
  ideas,
  decisions,
}: ProjectBrainPanelProps) {
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [draft, setDraft] = useState("");

  const contextChips = useMemo(
    () => [
      { label: "Notas", count: notes.length },
      { label: "Tarefas", count: tasks.length },
      { label: "Ideias", count: ideas.length },
      { label: "Decisões", count: decisions.length },
    ],
    [notes.length, tasks.length, ideas.length, decisions.length],
  );

  function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const userMessage: PreviewMessage = {
      role: "user",
      content: trimmed,
      time: now,
    };
    const answer: PreviewMessage = {
      role: "assistant",
      content: suggestReply(trimmed, project, { notes, tasks, ideas, decisions }),
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage, answer]);
    setDraft("");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary/80" />
            Brain do projeto
          </CardTitle>
          <CardDescription>
            Chat contextual simulado. A arquitetura já está pronta para IA real.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          {contextChips.map((chip) => (
            <span
              key={chip.label}
              className="rounded-full border border-border/60 bg-background/50 px-2 py-0.5"
            >
              {chip.label}: {chip.count}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => send(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border/60 bg-background/30 px-4 py-6 text-center text-xs text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Envie uma pergunta ou toque em uma sugestão acima.
            </div>
          ) : (
            <ol className="space-y-2">
              {messages.map((m, idx) => (
                <li
                  key={idx}
                  className={
                    m.role === "user"
                      ? "ml-6 rounded-md bg-primary/10 px-3 py-2 text-sm"
                      : "mr-6 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm"
                  }
                >
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.role === "user" ? "Você" : "Brain"} · {formatDateTime(m.time)}
                  </p>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <Textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Pergunte algo sobre este projeto…"
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
          />
          <Button type="submit" size="icon" aria-label="Enviar">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
