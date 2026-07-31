import { describe, expect, it } from "vitest";

import {
  ideaRepository,
  noteRepository,
  projectRepository,
  taskRepository,
  timelineRepository,
} from "@/lib/database/local";

describe("local repositories", () => {
  it("creates and retrieves a project by slug", () => {
    const created = projectRepository.create({
      name: "Alpha",
      slug: "alpha",
      description: "",
      objective: "",
      status: "planning",
      priority: "medium",
      progress: 0,
      tags: [],
    });
    expect(created.id).toBeDefined();
    expect(projectRepository.findBySlug("alpha")?.id).toBe(created.id);
  });

  it("updates a task and preserves createdAt", async () => {
    const created = taskRepository.create({
      title: "Init",
      status: "todo",
      priority: "medium",
      tags: [],
      subtasks: [],
    });
    const before = created.createdAt;
    // Ensure updatedAt differs from createdAt.
    await new Promise((resolve) => setTimeout(resolve, 5));
    const updated = taskRepository.update(created.id, { title: "Renamed" });
    expect(updated?.title).toBe("Renamed");
    expect(updated?.createdAt).toBe(before);
    expect(updated?.updatedAt).not.toBe(before);
  });

  it("deletes an idea", () => {
    const idea = ideaRepository.create({
      title: "Sacada",
      description: "",
      potential: "medium",
      status: "new",
      tags: [],
    });
    expect(ideaRepository.findById(idea.id)?.title).toBe("Sacada");
    expect(ideaRepository.delete(idea.id)).toBe(true);
    expect(ideaRepository.findById(idea.id)).toBeNull();
  });

  it("notes list is sorted by updatedAt desc", async () => {
    noteRepository.create({
      title: "A",
      content: "",
      type: "general",
      tags: [],
      favorite: false,
      archived: false,
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    noteRepository.create({
      title: "B",
      content: "",
      type: "general",
      tags: [],
      favorite: false,
      archived: false,
    });
    const list = noteRepository.findAll();
    expect(list.map((n) => n.title)).toEqual(["B", "A"]);
  });

  it("timeline records events with generated id and timestamp", () => {
    const event = timelineRepository.record({
      type: "project_created",
      entityKind: "project",
      entityId: "abc",
      title: "Projeto criado: Alpha",
    });
    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(timelineRepository.findAll()).toHaveLength(1);
  });
});
