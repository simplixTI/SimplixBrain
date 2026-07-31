# Roadmap

## Fase 1 — MVP local ✅ (atual)

- Projetos, Notas, Tarefas, Ideias, Decisões, Reuniões, Timeline
- Brain (grafo interativo) + Brain Chat simulado (por projeto)
- Cmd+K global
- Configurações (tema, backup JSON, reset)
- Persistência via `localStorage`
- Sem integrações externas

## Fase 2 — Supabase

- Autenticação (email/OAuth Google)
- Banco PostgreSQL (schema em [`supabase-schema.md`](supabase-schema.md))
- Row Level Security por `workspace_id`
- Sincronização em tempo real (`postgres_changes`)
- Storage para arquivos e anexos
- Backup automático
- Trocar implementações `Local*Repository` por `Supabase*Repository` sem alterar UI

## Fase 3 — Inteligência artificial

- Interface `AIProvider` (`chat`, `summarize`, `generateInsights`, `speak`, `transcribe`)
- Providers plugáveis: OpenAI, Gemini, Claude
- Substituir `Brain Insights` heurístico por geração real
- Chat contextual global (Brain Chat) com contexto do workspace
- Resumo de projeto / decisões / reuniões
- Priorização de tarefas
- Extração automática de tarefas a partir de anotações e emails
- Memória persistente entre conversas
- **Voz própria** (TTS + STT) — ambição declarada

## Fase 4 — Base de conhecimento

- Upload de PDFs e documentos
- Leitura e chunking
- Embeddings + `pgvector`
- Busca semântica
- RAG contextual no Brain Chat
- Citação de fontes nas respostas

## Fase 5 — Integrações em tempo real

- **Gmail** — emails viram Notas ou geram Tarefas
- **Google Calendar** — reuniões sincronizadas
- **Google Drive** — arquivos vinculados a projetos
- **GitHub** — issues como tarefas; PRs como decisões
- **WhatsApp (Z-API)** — mensagens viram eventos na timeline
- **Slack** — threads viram registros de decisão

Estas integrações entram via adapters no padrão existente (ex.: `GoogleCalendarMeetingRepository`), sem alterar componentes.

## Fase 6 — Agentes especialistas

- CEO Agent — visão executiva do workspace inteiro
- CTO Agent — foco em decisões técnicas
- Commercial Agent — pipeline comercial
- SAP Agent — conhecimento específico do domínio
- FaithOn Agent — conteúdo espiritual/devocional
- Gamma Agent — operações do transporte aquaviário
- Immigration Agent — processos de imigração/documentação
