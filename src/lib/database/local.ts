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

import { createId } from "@/lib/utils/id";

import {
  type ConversationRepository,
  type CreateInput,
  type CrudRepository,
  type DecisionRepository,
  type IdeaRepository,
  type MeetingRepository,
  type NoteRepository,
  type ProjectRepository,
  type TaskRepository,
  type TimelineRepository,
  type UpdateInput,
} from "./repositories";
import {
  readCollection,
  writeCollection,
  type StorageKey,
} from "./storage";

function nowIso(): string {
  return new Date().toISOString();
}

function makeCrud<T extends BaseEntity>(key: StorageKey): CrudRepository<T> {
  return {
    findAll(): T[] {
      return readCollection<T>(key).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
    },
    findById(id: string): T | null {
      return readCollection<T>(key).find((it) => it.id === id) ?? null;
    },
    create(input: CreateInput<T>): T {
      const now = nowIso();
      const entity = {
        ...input,
        id: createId(),
        createdAt: now,
        updatedAt: now,
      } as T;
      writeCollection<T>(key, [entity, ...readCollection<T>(key)]);
      return entity;
    },
    update(id: string, input: UpdateInput<T>): T | null {
      const items = readCollection<T>(key);
      const idx = items.findIndex((it) => it.id === id);
      if (idx === -1) return null;
      const current = items[idx]!;
      const next = {
        ...current,
        ...input,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: nowIso(),
      } as T;
      items[idx] = next;
      writeCollection<T>(key, items);
      return next;
    },
    delete(id: string): boolean {
      const items = readCollection<T>(key);
      const next = items.filter((it) => it.id !== id);
      if (next.length === items.length) return false;
      writeCollection<T>(key, next);
      return true;
    },
  };
}

class LocalProjectRepository implements ProjectRepository {
  private base = makeCrud<Project>("projects");
  findAll() {
    return this.base.findAll();
  }
  findById(id: string) {
    return this.base.findById(id);
  }
  findBySlug(slug: string): Project | null {
    return this.base.findAll().find((p) => p.slug === slug) ?? null;
  }
  create(input: CreateInput<Project>): Project {
    return this.base.create(input);
  }
  update(id: string, input: UpdateInput<Project>): Project | null {
    return this.base.update(id, input);
  }
  delete(id: string): boolean {
    return this.base.delete(id);
  }
}

class LocalTimelineRepository implements TimelineRepository {
  findAll(): TimelineEvent[] {
    return readCollection<TimelineEvent>("timeline").sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
  }
  record(
    event: Omit<TimelineEvent, "id" | "timestamp"> & { timestamp?: string },
  ): TimelineEvent {
    const entity: TimelineEvent = {
      ...event,
      id: createId(),
      timestamp: event.timestamp ?? nowIso(),
    };
    writeCollection<TimelineEvent>("timeline", [
      entity,
      ...readCollection<TimelineEvent>("timeline"),
    ]);
    return entity;
  }
  clear(): void {
    writeCollection<TimelineEvent>("timeline", []);
  }
}

class LocalConversationRepository implements ConversationRepository {
  private base = makeCrud<Conversation>("conversations");
  findAll() {
    return this.base.findAll();
  }
  findById(id: string) {
    return this.base.findById(id);
  }
  create(input: CreateInput<Conversation>): Conversation {
    return this.base.create(input);
  }
  update(id: string, input: UpdateInput<Conversation>): Conversation | null {
    return this.base.update(id, input);
  }
  delete(id: string): boolean {
    return this.base.delete(id);
  }
  appendMessage(id: string, message: Conversation["messages"][number]) {
    const current = this.base.findById(id);
    if (!current) return null;
    return this.base.update(id, {
      messages: [...current.messages, message],
    });
  }
}

export const projectRepository: ProjectRepository = new LocalProjectRepository();
export const noteRepository: NoteRepository = makeCrud<Note>("notes");
export const taskRepository: TaskRepository = makeCrud<Task>("tasks");
export const ideaRepository: IdeaRepository = makeCrud<Idea>("ideas");
export const decisionRepository: DecisionRepository =
  makeCrud<Decision>("decisions");
export const meetingRepository: MeetingRepository =
  makeCrud<Meeting>("meetings");
export const timelineRepository: TimelineRepository =
  new LocalTimelineRepository();
export const conversationRepository: ConversationRepository =
  new LocalConversationRepository();
