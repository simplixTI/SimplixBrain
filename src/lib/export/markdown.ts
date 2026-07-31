import {
  DECISION_STATUS_LABEL,
  IDEA_POTENTIAL_LABEL,
  IDEA_STATUS_LABEL,
  NOTE_TYPE_LABEL,
  PRIORITY_LABEL,
  PROJECT_STATUS_LABEL,
  TASK_STATUS_LABEL,
} from "@/lib/constants/enums";
import { formatDate, slugify } from "@/lib/utils";
import type {
  Decision,
  Idea,
  Meeting,
  Note,
  Project,
  Task,
} from "@/types";

function safeDate(iso?: string): string {
  if (!iso) return "—";
  return formatDate(iso);
}

export function noteToMarkdown(note: Note, project?: Project): string {
  const meta = [
    `type: ${NOTE_TYPE_LABEL[note.type]}`,
    project ? `project: ${project.name}` : "project: —",
    note.tags.length > 0 ? `tags: ${note.tags.join(", ")}` : "tags: —",
    `favorite: ${note.favorite ? "true" : "false"}`,
    `created: ${safeDate(note.createdAt)}`,
    `updated: ${safeDate(note.updatedAt)}`,
  ];
  return `---\n${meta.join("\n")}\n---\n\n# ${note.title}\n\n${note.content.trim()}\n`;
}

export function decisionToMarkdown(
  decision: Decision,
  project?: Project,
): string {
  return `# ${decision.title}\n\n**Status:** ${DECISION_STATUS_LABEL[decision.status]}${
    project ? ` · **Projeto:** ${project.name}` : ""
  } · **Data:** ${safeDate(decision.date)}\n\n## Contexto\n\n${decision.context || "—"}\n\n## Decisão\n\n${decision.decision}\n\n## Por quê\n\n${decision.rationale}\n${
    decision.alternatives
      ? `\n## Alternativas consideradas\n\n${decision.alternatives}\n`
      : ""
  }${
    decision.expectedImpact
      ? `\n## Impacto esperado\n\n${decision.expectedImpact}\n`
      : ""
  }${
    decision.participants.length > 0
      ? `\n## Participantes\n\n${decision.participants.map((p) => `- ${p}`).join("\n")}\n`
      : ""
  }`;
}

export function projectToMarkdown(
  project: Project,
  ctx: {
    notes: Note[];
    tasks: Task[];
    ideas: Idea[];
    decisions: Decision[];
    meetings: Meeting[];
  },
): string {
  const lines: string[] = [];
  lines.push(`# ${project.name}`);
  lines.push("");
  lines.push(project.description || "_Sem descrição._");
  lines.push("");
  lines.push("## Objetivo");
  lines.push(project.objective || "_Não descrito._");
  lines.push("");
  lines.push("## Detalhes");
  lines.push(`- **Status:** ${PROJECT_STATUS_LABEL[project.status]}`);
  lines.push(`- **Prioridade:** ${PRIORITY_LABEL[project.priority]}`);
  if (project.category) lines.push(`- **Categoria:** ${project.category}`);
  lines.push(`- **Progresso:** ${project.progress}%`);
  lines.push(`- **Início:** ${safeDate(project.startDate)}`);
  lines.push(`- **Prazo:** ${safeDate(project.dueDate)}`);
  if (project.tags.length > 0)
    lines.push(`- **Tags:** ${project.tags.join(", ")}`);
  lines.push("");

  if (ctx.tasks.length > 0) {
    lines.push("## Tarefas");
    for (const t of ctx.tasks) {
      const done = t.status === "done" ? "x" : " ";
      lines.push(
        `- [${done}] ${t.title} — ${TASK_STATUS_LABEL[t.status]} · ${PRIORITY_LABEL[t.priority]}${
          t.dueDate ? ` · prazo ${safeDate(t.dueDate)}` : ""
        }`,
      );
    }
    lines.push("");
  }

  if (ctx.decisions.length > 0) {
    lines.push("## Decisões");
    for (const d of ctx.decisions) {
      lines.push(`### ${d.title}`);
      lines.push(
        `_${DECISION_STATUS_LABEL[d.status]} · ${safeDate(d.date)}_`,
      );
      lines.push("");
      lines.push(`**Por quê:** ${d.rationale}`);
      if (d.alternatives) lines.push(`\n**Alternativas:** ${d.alternatives}`);
      lines.push("");
    }
  }

  if (ctx.ideas.length > 0) {
    lines.push("## Ideias");
    for (const i of ctx.ideas) {
      lines.push(
        `- **${i.title}** (${IDEA_STATUS_LABEL[i.status]}, potencial ${IDEA_POTENTIAL_LABEL[i.potential]})${
          i.description ? ` — ${i.description}` : ""
        }`,
      );
    }
    lines.push("");
  }

  if (ctx.meetings.length > 0) {
    lines.push("## Reuniões");
    for (const m of ctx.meetings) {
      lines.push(`### ${m.title} — ${safeDate(m.date)}`);
      if (m.notes) {
        lines.push("");
        lines.push(m.notes);
      }
      if (m.decisionsTaken.length > 0) {
        lines.push("");
        lines.push("**Decisões tomadas:**");
        for (const d of m.decisionsTaken) lines.push(`- ${d}`);
      }
      lines.push("");
    }
  }

  if (ctx.notes.length > 0) {
    lines.push("## Notas");
    for (const n of ctx.notes) {
      lines.push(`### ${n.title}`);
      lines.push(`_${NOTE_TYPE_LABEL[n.type]}_`);
      lines.push("");
      lines.push(n.content.trim());
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string): void {
  if (typeof window === "undefined") return;
  const safe = filename.endsWith(".md") ? filename : `${slugify(filename)}.md`;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safe;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown): void {
  if (typeof window === "undefined") return;
  const safe = filename.endsWith(".json") ? filename : `${slugify(filename)}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safe;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
