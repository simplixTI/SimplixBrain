import type {
  DecisionStatus,
  IdeaEffort,
  IdeaPotential,
  IdeaStatus,
  NoteType,
  Priority,
  ProjectStatus,
  TaskStatus,
  TimelineEventType,
} from "@/lib/constants/enums";

export type ISODate = string;

export interface BaseEntity {
  id: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Project extends BaseEntity {
  name: string;
  slug: string;
  description: string;
  objective: string;
  status: ProjectStatus;
  priority: Priority;
  category?: string;
  startDate?: ISODate;
  dueDate?: ISODate;
  progress: number;
  color?: string;
  icon?: string;
  tags: string[];
}

export interface Note extends BaseEntity {
  title: string;
  content: string;
  projectId?: string;
  type: NoteType;
  tags: string[];
  favorite: boolean;
  archived: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  projectId?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: ISODate;
  assignee?: string;
  tags: string[];
  subtasks: Subtask[];
  completedAt?: ISODate;
}

export interface Idea extends BaseEntity {
  title: string;
  description: string;
  projectId?: string;
  category?: string;
  potential: IdeaPotential;
  effort?: IdeaEffort;
  status: IdeaStatus;
  tags: string[];
}

export interface Decision extends BaseEntity {
  title: string;
  context: string;
  decision: string;
  rationale: string;
  alternatives?: string;
  expectedImpact?: string;
  projectId?: string;
  participants: string[];
  date: ISODate;
  status: DecisionStatus;
  tags: string[];
}

export interface Meeting extends BaseEntity {
  title: string;
  projectId?: string;
  date: ISODate;
  startTime?: string;
  endTime?: string;
  participants: string[];
  agenda?: string;
  notes?: string;
  decisionsTaken: string[];
  generatedTaskIds: string[];
  nextSteps?: string;
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  entityKind: "project" | "task" | "note" | "idea" | "decision" | "meeting";
  entityId: string;
  projectId?: string;
  title: string;
  description?: string;
  timestamp: ISODate;
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: ISODate;
  sources?: ChatSource[];
}

export interface ChatSource {
  entityKind: "project" | "task" | "note" | "idea" | "decision" | "meeting";
  entityId: string;
  title: string;
}

export interface Conversation extends BaseEntity {
  title: string;
  projectId?: string;
  messages: ChatMessage[];
}

export type CreateInput<T extends BaseEntity> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateInput<T extends BaseEntity> = Partial<
  Omit<T, "id" | "createdAt" | "updatedAt">
>;
