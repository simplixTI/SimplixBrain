# SimplixBrain

Sistema de produtividade, organização e memória inteligente para empreendedores, consultores e profissionais que administram vários projetos em paralelo. Combina conceitos de Obsidian, Notion, gestor de projetos, base de conhecimento e assistente executivo com IA.

Esta é a **Fase 1 (MVP local)**: 100% no navegador, sem backend, com arquitetura desacoplada pronta para receber Supabase, IA (OpenAI/Gemini/Claude) e integrações externas (Gmail, Calendar, Drive, GitHub, WhatsApp, Slack).

## Stack

- Next.js 15 (App Router)
- TypeScript strict
- Tailwind CSS + shadcn/ui + Radix
- Zustand (mínimo — só onde precisa)
- React Hook Form + Zod
- `react-force-graph-2d` (grafo Brain)
- `react-markdown` + `remark-gfm` (editor de notas)
- Persistência: `localStorage` via repositórios desacoplados
- Tipografia: Bricolage Grotesque (display), Onest (body), JetBrains Mono (mono)

## Instalação

```bash
git clone <repo>
cd SimplixBrain
npm install
```

## Executando

```bash
npm run dev       # dev server (localhost:3000)
npm run build     # build de produção
npm run start     # roda o build
npm run lint      # eslint
npm run typecheck # tsc --noEmit
npm run test      # vitest run
npm run test:watch
```

## Estrutura de pastas

```
src/
├── app/                    # rotas do App Router (grupo (app))
│   ├── layout.tsx
│   ├── globals.css
│   └── (app)/
│       ├── layout.tsx      # AppShell
│       ├── page.tsx        # Home → Brain (grafo)
│       ├── dashboard/
│       ├── projects/[slug]/
│       ├── notes/[id]/
│       ├── tasks/
│       ├── ideas/
│       ├── decisions/
│       ├── meetings/
│       ├── timeline/
│       └── settings/
├── components/
│   ├── ui/                 # primitives shadcn/Radix
│   ├── layout/             # Sidebar, Topbar, Logo, ThemeToggle, AppShell
│   ├── dashboard/
│   ├── projects/
│   ├── notes/
│   ├── tasks/
│   ├── ideas/
│   ├── decisions/
│   ├── meetings/
│   ├── timeline/
│   ├── brain/              # KnowledgeGraph
│   ├── search/             # GlobalCommandPalette (Cmd+K)
│   ├── settings/
│   └── providers/
├── hooks/                  # use-data, use-collection, use-command-palette
├── lib/
│   ├── constants/          # enums + labels PT-BR
│   ├── validation/         # schemas Zod
│   ├── database/           # storage + repositórios + seed loader + events bus
│   ├── export/             # exportadores Markdown/JSON
│   └── utils/              # cn, format, id, greeting
├── data/                   # seed determinístico
└── types/                  # tipos de entidades
tests/                      # vitest (formatters, schemas, repositórios)
docs/                       # arquitetura, roadmap, futuro
```

## Variáveis de ambiente (futuras)

Nenhuma exigida na Fase 1. Placeholders previstos para as próximas fases:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GOOGLE_GEMINI_API_KEY=
ANTHROPIC_API_KEY=
GITHUB_TOKEN=
```

## Deploy (Vercel)

1. Suba o repo no GitHub.
2. Importe no Vercel → project preset "Next.js".
3. Sem env vars nesta fase.
4. Deploy.

## Módulos entregues (MVP)

- **Brain** (home) — grafo de conhecimento interativo estilo Obsidian
- **Dashboard** — saudação, stat cards coloridos, prioridades do dia, projetos recentes, atividade recente, **Brain Insights** com regras heurísticas
- **Projetos** — lista com cards/lista, filtros e detalhe com 9 abas (visão geral, notas, tarefas, ideias, decisões, reuniões, arquivos, timeline, brain do projeto)
- **Notas** — grid com filtros + editor markdown com autosave, 3 modos (editar/split/preview)
- **Tarefas** — 6 visualizações (todas/hoje/7 dias/atrasadas/sem projeto/concluídas) + subtarefas
- **Ideias** — caixa de entrada rápida + form completo
- **Decisões** — timeline mensal destacando o "por quê" da escolha
- **Reuniões** — pauta, anotações, decisões, próximos passos e **gerador automático de tarefas**
- **Timeline global** — log cronológico agrupado por dia
- **Cmd+K** — busca global em todas as entidades
- **Configurações** — tema, backup JSON, reset e limpeza

## Dados de demonstração

Projetos reais como seed: **Gamma, FaithOn, Campanha360, SAP Consulting, SimplixBrain**, com tarefas, notas, ideias, decisões e reuniões relacionadas.

Para restaurar: **Configurações → Restaurar dados de demonstração**.

## Limitações atuais

- Persistência apenas em `localStorage` (perdido ao trocar de navegador/dispositivo).
- Sem autenticação (usuário único local).
- Sem IA real ainda — Brain Chat e Brain Insights usam regras determinísticas simuladas.
- Sem integrações externas.
- Sem upload de arquivos.

## Próximos passos recomendados

Ver [`docs/roadmap.md`](docs/roadmap.md).

## Documentação técnica

- [`docs/architecture.md`](docs/architecture.md) — decisões de arquitetura
- [`docs/roadmap.md`](docs/roadmap.md) — fases 1 a 6
- [`docs/supabase-schema.md`](docs/supabase-schema.md) — modelagem futura
- [`docs/ai-architecture.md`](docs/ai-architecture.md) — camada de IA prevista
- [`docs/markdown-export.md`](docs/markdown-export.md) — exportação para Markdown
