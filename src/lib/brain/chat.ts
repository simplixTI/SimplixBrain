import type { SupabaseClient } from "@supabase/supabase-js";

import type { AIProvider } from "@/lib/ai/provider";
import type { ResolvedProviders } from "@/lib/ai/resolve";
import type { ChatMessage } from "@/lib/ai/types";
import type { Database } from "@/lib/supabase/database.types";

import { retrieve, type RetrievalHit } from "./retrieval";

type Client = SupabaseClient<Database>;

export interface RunChatInput {
  workspaceId: string;
  query: string;
  history?: ChatMessage[];
  focusNodeId?: string;
  minHits?: number;
}

export interface RunChatResult {
  answer: string;
  hits: RetrievalHit[];
  emptyRetrieval: boolean;
  usage?: { inputTokens?: number; outputTokens?: number };
  model?: string;
}

const SYSTEM_PROMPT = `Você é o Brain do SimplixBrain, um sistema operacional pessoal.
Regras absolutas:
1. Responda EXCLUSIVAMENTE com base no contexto fornecido em "FONTES".
2. Se as fontes não trouxerem informação suficiente, responda literalmente: "Não encontrei essa informação no Brain."
3. Nunca invente fatos, datas, nomes, valores ou relações que não estejam nas fontes.
4. Cite as fontes usadas usando o formato [#N] onde N é o índice da fonte.
5. Responda em português do Brasil, direto e sem enrolação.`;

function buildContext(hits: RetrievalHit[]): string {
  if (hits.length === 0) return "(nenhuma fonte encontrada)";
  return hits
    .map((h, i) => {
      const body = h.node.body ? h.node.body.slice(0, 800) : "";
      const subtitle = h.node.subtitle ? ` — ${h.node.subtitle}` : "";
      return `[#${i + 1}] ${h.node.kind}: ${h.node.title}${subtitle}\n${body}`.trim();
    })
    .join("\n\n---\n\n");
}

/**
 * End-to-end Chat pipeline: embed → retrieve → build prompt → call LLM.
 * Never calls the LLM when retrieval is empty (short-circuits with a fixed
 * "not found" response). This enforces the "IA nunca inventa" contract.
 */
export async function runChat(
  client: Client,
  providers: ResolvedProviders | AIProvider,
  input: RunChatInput,
): Promise<RunChatResult> {
  const isResolved = "name" in providers ? false : true;
  const chat: AIProvider = isResolved
    ? (providers as ResolvedProviders).chat
    : (providers as AIProvider);
  const embedProvider: AIProvider | null = isResolved
    ? (providers as ResolvedProviders).embed
    : (providers as AIProvider);

  let embedding: number[] | undefined;
  if (embedProvider) {
    try {
      const embed = await embedProvider.embed([input.query]);
      embedding = embed.vectors[0];
    } catch {
      // Fall through — vector branch will be skipped if embed fails.
    }
  }

  const retrieval = await retrieve(client, {
    workspaceId: input.workspaceId,
    query: input.query,
    focusNodeId: input.focusNodeId,
    embedding,
  });

  const minHits = input.minHits ?? 1;
  if (retrieval.hits.length < minHits) {
    return {
      answer: "Não encontrei essa informação no Brain.",
      hits: [],
      emptyRetrieval: true,
    };
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `FONTES (rank por score, use apenas estas):\n\n${buildContext(retrieval.hits)}`,
    },
    ...(input.history ?? []),
    { role: "user", content: input.query },
  ];

  const response = await chat.chat(messages);

  return {
    answer: response.text,
    hits: retrieval.hits,
    emptyRetrieval: false,
    usage: response.usage,
    model: response.model,
  };
}
