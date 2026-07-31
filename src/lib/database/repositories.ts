import type {
  BaseEntity,
  Conversation,
  Decision,
  Idea,
  Meeting,
  Note,
  Project,
  Task,
  TimelineEvent,
} from "@/types";

export type CreateInput<T extends BaseEntity> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateInput<T extends BaseEntity> = Partial<
  Omit<T, "id" | "createdAt">
>;

export interface CrudRepository<T extends BaseEntity> {
  findAll(): T[];
  findById(id: string): T | null;
  create(input: CreateInput<T>): T;
  update(id: string, input: UpdateInput<T>): T | null;
  delete(id: string): boolean;
}

export interface ProjectRepository extends CrudRepository<Project> {
  findBySlug(slug: string): Project | null;
}

export type NoteRepository = CrudRepository<Note>;
export type TaskRepository = CrudRepository<Task>;
export type IdeaRepository = CrudRepository<Idea>;
export type DecisionRepository = CrudRepository<Decision>;
export type MeetingRepository = CrudRepository<Meeting>;

export interface TimelineRepository {
  findAll(): TimelineEvent[];
  record(event: Omit<TimelineEvent, "id" | "timestamp"> & { timestamp?: string }): TimelineEvent;
  clear(): void;
}

export interface ConversationRepository extends CrudRepository<Conversation> {
  appendMessage(id: string, message: Conversation["messages"][number]): Conversation | null;
}
