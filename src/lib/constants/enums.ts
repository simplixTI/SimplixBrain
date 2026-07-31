export const PROJECT_STATUS = [
  "idea",
  "planning",
  "active",
  "paused",
  "completed",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const PRIORITY = ["low", "medium", "high", "critical"] as const;
export type Priority = (typeof PRIORITY)[number];

export const TASK_STATUS = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

export const NOTE_TYPE = [
  "general",
  "technical",
  "commercial",
  "strategic",
  "research",
  "reference",
  "draft",
] as const;
export type NoteType = (typeof NOTE_TYPE)[number];

export const IDEA_STATUS = [
  "new",
  "evaluating",
  "planned",
  "in_progress",
  "discarded",
  "implemented",
] as const;
export type IdeaStatus = (typeof IDEA_STATUS)[number];

export const IDEA_POTENTIAL = ["low", "medium", "high", "very_high"] as const;
export type IdeaPotential = (typeof IDEA_POTENTIAL)[number];

export const IDEA_EFFORT = ["xs", "s", "m", "l", "xl"] as const;
export type IdeaEffort = (typeof IDEA_EFFORT)[number];

export const DECISION_STATUS = [
  "proposed",
  "approved",
  "rejected",
  "superseded",
] as const;
export type DecisionStatus = (typeof DECISION_STATUS)[number];

export const TIMELINE_EVENT_TYPE = [
  "project_created",
  "project_updated",
  "status_changed",
  "task_created",
  "task_completed",
  "note_created",
  "note_updated",
  "idea_created",
  "decision_recorded",
  "meeting_recorded",
] as const;
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPE)[number];

export const ENTITY_KIND = [
  "project",
  "note",
  "task",
  "idea",
  "decision",
  "meeting",
] as const;
export type EntityKind = (typeof ENTITY_KIND)[number];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  idea: "Ideia",
  planning: "Planejamento",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  archived: "Arquivado",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "A fazer",
  in_progress: "Em andamento",
  blocked: "Bloqueada",
  done: "Concluída",
  cancelled: "Cancelada",
};

export const NOTE_TYPE_LABEL: Record<NoteType, string> = {
  general: "Geral",
  technical: "Técnica",
  commercial: "Comercial",
  strategic: "Estratégica",
  research: "Pesquisa",
  reference: "Referência",
  draft: "Rascunho",
};

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  new: "Nova",
  evaluating: "Avaliando",
  planned: "Planejada",
  in_progress: "Em execução",
  discarded: "Descartada",
  implemented: "Implementada",
};

export const IDEA_POTENTIAL_LABEL: Record<IdeaPotential, string> = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  very_high: "Muito alto",
};

export const IDEA_EFFORT_LABEL: Record<IdeaEffort, string> = {
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
};

export const DECISION_STATUS_LABEL: Record<DecisionStatus, string> = {
  proposed: "Proposta",
  approved: "Aprovada",
  rejected: "Rejeitada",
  superseded: "Substituída",
};

export const TIMELINE_EVENT_LABEL: Record<TimelineEventType, string> = {
  project_created: "Projeto criado",
  project_updated: "Projeto atualizado",
  status_changed: "Status alterado",
  task_created: "Tarefa criada",
  task_completed: "Tarefa concluída",
  note_created: "Nota criada",
  note_updated: "Nota atualizada",
  idea_created: "Ideia registrada",
  decision_recorded: "Decisão registrada",
  meeting_recorded: "Reunião registrada",
};
