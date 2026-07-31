import { describe, expect, it } from "vitest";

import {
  decisionSchema,
  ideaSchema,
  noteSchema,
  projectSchema,
  taskSchema,
} from "@/lib/validation/schemas";

describe("Zod schemas", () => {
  it("projectSchema accepts a valid project", () => {
    const parsed = projectSchema.parse({
      name: "Gamma",
      slug: "gamma",
      description: "App de transporte aquaviário",
      objective: "Lançar MVP",
      status: "active",
      priority: "high",
      progress: 40,
      tags: ["mobile"],
    });
    expect(parsed.name).toBe("Gamma");
    expect(parsed.tags).toEqual(["mobile"]);
  });

  it("projectSchema rejects too-short name", () => {
    expect(() =>
      projectSchema.parse({
        name: "A",
        slug: "a",
        status: "active",
        priority: "medium",
        progress: 0,
      }),
    ).toThrow();
  });

  it("noteSchema requires title", () => {
    expect(() =>
      noteSchema.parse({
        title: "",
        type: "general",
      }),
    ).toThrow();
  });

  it("taskSchema defaults tags/subtasks to empty", () => {
    const parsed = taskSchema.parse({
      title: "Estudar Supabase",
      status: "todo",
      priority: "medium",
    });
    expect(parsed.tags).toEqual([]);
    expect(parsed.subtasks).toEqual([]);
  });

  it("ideaSchema keeps status and potential", () => {
    const parsed = ideaSchema.parse({
      title: "Voz própria",
      description: "Brain com voz",
      potential: "high",
      status: "new",
    });
    expect(parsed.status).toBe("new");
    expect(parsed.potential).toBe("high");
  });

  it("decisionSchema demands decision + rationale", () => {
    expect(() =>
      decisionSchema.parse({
        title: "Decidido X",
        decision: "",
        rationale: "",
        date: "2026-01-01",
        status: "approved",
      }),
    ).toThrow();
  });
});
