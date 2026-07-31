import type { RetrievalHit } from "@/lib/brain/retrieval";

import type { ChatMessage } from "../types";

import type { TaskClass } from "./types";

const SYSTEM_BASE = `Você é o Brain do SimplixBrain — um sistema operacional pessoal.
Regras absolutas:
1. Responda SOMENTE com base no contexto fornecido em "FONTES".
2. Se as fontes forem insuficientes, responda literalmente: "Não encontrei essa informação no Brain."
3. Nunca invente fatos, datas, nomes, valores ou relações que não estejam nas fontes.
4. Cite as fontes usando [#N] onde N é o índice.
5. Português do Brasil. Direto e sem enrolação.`;

const TASK_INSTRUCTIONS: Partial<Record<TaskClass, string>> = {
  summarization: "Priorize concisão. Estruture em bullets quando fizer sentido.",
  translation:  "Devolva apenas a tradução, sem comentário adicional.",
  extraction:   "Devolva JSON válido conforme o formato pedido. Se não encontrar, devolva {}.",
  planner:      "Estruture como plano numerado com etapas concretas, responsáveis (quando houver) e datas (se disponíveis nas fontes).",
  coding:       "Responda com blocos de código quando aplicável. Explique só o essencial.",
  generation:   "Seja criativo mas mantenha coerência com as fontes.",
  conversation: "",
};

const SNIPPET_CHARS = 800;
const MAX_HITS = 12;

function formatHit(hit: RetrievalHit, idx: number): string {
  const body = hit.node.body ? hit.node.body.slice(0, SNIPPET_CHARS) : "";
  const subtitle = hit.node.subtitle ? ` — ${hit.node.subtitle}` : "";
  return `[#${idx + 1}] ${hit.node.kind}: ${hit.node.title}${subtitle}\n${body}`.trim();
}

export interface BuildPromptInput {
  query: string;
  hits: RetrievalHit[];
  history?: ChatMessage[];
  taskClass: TaskClass;
}

export function buildMessages(input: BuildPromptInput): ChatMessage[] {
  const taskLine = TASK_INSTRUCTIONS[input.taskClass];
  const systemParts = [SYSTEM_BASE];
  if (taskLine) systemParts.push(`Instrução específica para esta task (${input.taskClass}):\n${taskLine}`);

  const hits = input.hits.slice(0, MAX_HITS);
  const sourcesBlock = hits.length
    ? `FONTES (use apenas estas):\n\n${hits.map((h, i) => formatHit(h, i)).join("\n\n---\n\n")}`
    : "FONTES: (nenhuma)";

  return [
    { role: "system", content: systemParts.join("\n\n") },
    { role: "system", content: sourcesBlock },
    ...(input.history ?? []),
    { role: "user", content: input.query },
  ];
}
