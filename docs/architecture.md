# Arquitetura

## Princípios

1. **Repositórios desacoplados.** Toda leitura/escrita de entidade passa por uma interface (`ProjectRepository`, `NoteRepository`, etc.). A implementação atual é local (`localStorage`); a próxima será Supabase — sem alterar componentes.
2. **Zod é a fonte de verdade dos formulários.** Nenhum form escreve direto sem validar.
3. **Sem `any`.** Tipagem estrita, enums nomeados em `lib/constants/enums.ts`.
4. **Client-first para dados dinâmicos.** Como o backend é `localStorage`, quase tudo é `"use client"` com hooks reativos.
5. **Reatividade via bus de eventos.** `writeCollection` dispara `invalidate(key)` em `lib/database/events.ts`; hooks `useCollection`/`useProjects`/etc. reagem.

## Camadas

```
┌──────────────────────────────────────────────────────┐
│  UI (pages, components/*)                            │
│    ↕ hooks (useProjects, useTasks, useCollection…)   │
│  Repositories (interfaces em lib/database/*.ts)      │
│    ↕                                                 │
│  Storage abstraction (lib/database/storage.ts)       │
│    ↕                                                 │
│  localStorage (Fase 1) → Supabase (Fase 2)           │
└──────────────────────────────────────────────────────┘
```

## Fluxo típico de mutação

1. Form envia (`react-hook-form` + `zodResolver`).
2. Componente chama `repo.create(payload)` ou `repo.update(id, patch)`.
3. Repositório grava via `writeCollection(key, list)`.
4. `writeCollection` dispara `invalidate(key)`.
5. Todo `useCollection(key, ...)` re-lê e re-renderiza.
6. Componente também chama `timelineRepository.record({...})` quando faz sentido — a Timeline global e a atividade recente do Dashboard atualizam sozinhas.

## Convenções

- **Nomes de arquivo.** kebab-case (`project-form.tsx`).
- **Componentes.** PascalCase; hooks em `useCamelCase`; tipos em PascalCase.
- **Estilos.** Tailwind + classes utilitárias definidas em `globals.css` (`.text-display`, `.text-mono`, `.surface`, `.glow-primary`, `.shimmer-text`, `.brain-animate`).
- **Paleta.** Variáveis CSS `--hue-violet/cyan/lime/amber/rose/indigo/fuchsia` para cores acentuadas (dark + light).
- **Ícones.** Só `lucide-react`.
- **Estados vazios.** Sempre via `EmptyState` (`components/ui/empty-state.tsx`).
- **Toasts.** `sonner` (`toast.success` / `toast.error`).

## Onde ficam as coisas

| Preocupação | Diretório |
|---|---|
| Tipos de entidade | `src/types/index.ts` |
| Enums + labels PT-BR | `src/lib/constants/enums.ts` |
| Schemas Zod | `src/lib/validation/schemas.ts` |
| Interface de repositório | `src/lib/database/repositories.ts` |
| Implementação local | `src/lib/database/local.ts` |
| Storage (localStorage) | `src/lib/database/storage.ts` |
| Bus reativo | `src/lib/database/events.ts` |
| Seed de demonstração | `src/data/seed.ts` |
| Exportadores Markdown/JSON | `src/lib/export/markdown.ts` |
| Hooks de dados | `src/hooks/use-data.ts` |
| Cmd+K store | `src/hooks/use-command-palette.ts` |
| Brain (grafo) | `src/components/brain/knowledge-graph.tsx` |

## Como adicionar uma entidade nova

1. Definir o tipo em `src/types/index.ts`.
2. Criar enum/labels em `src/lib/constants/enums.ts` se tiver estados.
3. Criar schema em `src/lib/validation/schemas.ts`.
4. Adicionar o `StorageKey` em `src/lib/database/storage.ts`.
5. Instanciar repositório em `src/lib/database/local.ts` (usa `makeCrud<T>(key)` como base).
6. Expor um hook `useX()` em `src/hooks/use-data.ts`.
7. Criar componentes em `src/components/x/` e página em `src/app/(app)/x/page.tsx`.
8. Adicionar entrada em `src/components/layout/nav-config.ts` se merecer sidebar.
9. Registrar eventos na `timelineRepository` nas mutações principais.
