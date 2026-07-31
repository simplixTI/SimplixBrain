# Arquitetura de IA

A camada de IA foi projetada como **interface plugável** desde a Fase 1. O MVP usa um provider mock; substituí-lo por OpenAI / Gemini / Claude não deve tocar em componentes de UI.

## Interface

```ts
export interface AIProvider {
  chat(input: AIChatInput): Promise<AIChatResponse>;
  summarize(input: AISummaryInput): Promise<string>;
  generateInsights(input: AIInsightInput): Promise<AIInsight[]>;
  // Voz — ambição declarada
  speak?(input: AISpeakInput): Promise<Blob>;
  transcribe?(input: AITranscribeInput): Promise<string>;
}
```

- `chat` — pergunta + contexto (projeto, notas, tarefas, decisões).
- `summarize` — resumo de entidade (projeto, reunião, thread).
- `generateInsights` — regras que hoje são heurísticas (`brain-insights.tsx`) viram output de IA.
- `speak` — TTS para o Brain responder em áudio (voz própria do produto).
- `transcribe` — STT para captar perguntas por voz.

## Estratégia por fase

| Fase | Provider padrão | Uso |
|---|---|---|
| 1 (MVP) | `MockAIProvider` | Regras determinísticas no Brain Chat por projeto e nos Brain Insights |
| 3 | Roteamento entre OpenAI / Gemini / Claude via `AIGateway` | Chat contextual, summarize, insights, extração de tarefas |
| 4 | + pgvector para RAG | Base de conhecimento com citações |

## Roteamento (Fase 3)

Ideia: cada operação declara custo/qualidade esperados; um `AIGateway` decide qual modelo chamar:

- Sumários curtos → Haiku / Gemini Flash
- Chat contextual longo → Sonnet / Gemini Pro / GPT-4.1
- Geração de embeddings → text-embedding-3-large ou Gemini embedding
- TTS → OpenAI TTS ou ElevenLabs (voz personalizada)

## Contexto enviado ao Chat

Quando o Brain Chat for real, o payload padrão para chamadas globais será:

```ts
{
  workspace: { name, activeProjects, totalNotes, totalTasks },
  recentTimeline: TimelineEvent[],   // últimos 30 eventos
  scopedProject?: {                   // se for aba Brain de um projeto
    project, notes, tasks, ideas, decisions, meetings
  }
}
```

Notas e decisões passam por chunking + embedding e são recuperadas por similaridade quando o contexto exceder o token budget do modelo.

## Memória persistente

Tabela `memories` (Fase 2) armazena fatos consolidados:

- Escopo `workspace` — preferências gerais do usuário
- Escopo `project` — decisões-chave e padrões daquele projeto
- Escopo `user` — perfil / estilo / tom preferido

O `AIGateway` injeta memórias relevantes em toda chamada de chat.

## Segurança e custo

- Todas as chaves ficam em variáveis de ambiente do servidor (nunca expostas ao browser).
- Chamadas com dados sensíveis passam por proxy Next Route Handler (`app/api/ai/*`), nunca direto do cliente.
- Rate limit e budget diário por workspace.
- Log de tokens / custo por conversa (Fase 3+).
