# Exportação para Markdown

Todo projeto do SimplixBrain pode ser exportado como pacote Markdown navegável. A ideia é que o workspace seja **portável** — nada fica preso ao produto.

## Estrutura pretendida

```
/projects/gamma/
├── README.md            # visão geral do projeto (metadados + objetivo)
├── roadmap.md           # tarefas com status
├── decisions.md         # decisões com contexto e "por quê"
├── ideas.md             # ideias com potencial/esforço
├── meetings.md          # reuniões com pautas e decisões
└── notes/
    ├── <slug>.md
    └── ...
```

## Utilitários já disponíveis

`src/lib/export/markdown.ts` exporta:

- `noteToMarkdown(note, project?)` — front matter YAML + conteúdo. Compatível com Obsidian.
- `decisionToMarkdown(decision, project?)` — Markdown com seções Contexto / Decisão / Por quê / Alternativas / Impacto / Participantes.
- `projectToMarkdown(project, ctx)` — README rico contendo tarefas (checkbox), decisões, ideias, reuniões e notas resumidas.
- `downloadMarkdown(filename, content)` — dispara download do arquivo `.md`.
- `downloadJson(filename, data)` — usado em Configurações para baixar backup completo.

## Consumo

- **Botão "Baixar backup"** em Configurações usa `downloadJson`.
- **Exportação por projeto/nota/decisão** ficará wire-up nas próximas rodadas — as funções já estão prontas.

## Sincronização com Obsidian (futuro)

Fase 4/5 vai adicionar um **importador de vault** (ler pasta de `.md` do disco / drive e alimentar Notas), fechando o ciclo: SimplixBrain ↔ Obsidian.
