import { z } from "zod";

import {
  DECISION_STATUS,
  IDEA_EFFORT,
  IDEA_POTENTIAL,
  IDEA_STATUS,
  NOTE_TYPE,
  PRIORITY,
  PROJECT_STATUS,
  TASK_STATUS,
} from "@/lib/constants/enums";

const tagList = z
  .array(z.string().trim().min(1).max(32))
  .max(20)
  .default([]);

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome").max(80),
  slug: z.string().trim().min(2).max(64),
  description: z.string().max(500).default(""),
  objective: z.string().max(1000).default(""),
  status: z.enum(PROJECT_STATUS),
  priority: z.enum(PRIORITY),
  category: z.string().trim().max(40).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  color: z.string().max(24).optional(),
  icon: z.string().max(24).optional(),
  tags: tagList,
});
export type ProjectFormValues = z.infer<typeof projectSchema>;

export const noteSchema = z.object({
  title: z.string().trim().min(2, "Informe um título").max(120),
  content: z.string().default(""),
  projectId: z.string().optional(),
  type: z.enum(NOTE_TYPE),
  tags: tagList,
  favorite: z.boolean().default(false),
  archived: z.boolean().default(false),
});
export type NoteFormValues = z.infer<typeof noteSchema>;

export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(160),
  done: z.boolean().default(false),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Informe um título").max(160),
  description: z.string().max(2000).optional(),
  projectId: z.string().optional(),
  status: z.enum(TASK_STATUS),
  priority: z.enum(PRIORITY),
  dueDate: z.string().optional(),
  assignee: z.string().trim().max(80).optional(),
  tags: tagList,
  subtasks: z.array(subtaskSchema).default([]),
});
export type TaskFormValues = z.infer<typeof taskSchema>;

export const ideaSchema = z.object({
  title: z.string().trim().min(2, "Informe um título").max(140),
  description: z.string().max(2000).default(""),
  projectId: z.string().optional(),
  category: z.string().trim().max(40).optional(),
  potential: z.enum(IDEA_POTENTIAL),
  effort: z.enum(IDEA_EFFORT).optional(),
  status: z.enum(IDEA_STATUS),
  tags: tagList,
});
export type IdeaFormValues = z.infer<typeof ideaSchema>;

export const quickIdeaSchema = z.object({
  title: z.string().trim().min(2, "Informe um título").max(140),
  description: z.string().max(2000).default(""),
  projectId: z.string().optional(),
});
export type QuickIdeaFormValues = z.infer<typeof quickIdeaSchema>;

export const decisionSchema = z.object({
  title: z.string().trim().min(2, "Informe um título").max(160),
  context: z.string().max(2000).default(""),
  decision: z.string().min(2, "Informe a decisão").max(1000),
  rationale: z.string().min(2, "Explique o motivo").max(2000),
  alternatives: z.string().max(2000).optional(),
  expectedImpact: z.string().max(1000).optional(),
  projectId: z.string().optional(),
  participants: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  date: z.string(),
  status: z.enum(DECISION_STATUS),
  tags: tagList,
});
export type DecisionFormValues = z.infer<typeof decisionSchema>;

export const meetingSchema = z.object({
  title: z.string().trim().min(2, "Informe um título").max(160),
  projectId: z.string().optional(),
  date: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  participants: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  agenda: z.string().max(2000).optional(),
  notes: z.string().max(8000).optional(),
  decisionsTaken: z.array(z.string().trim().min(1)).default([]),
  generatedTaskIds: z.array(z.string()).default([]),
  nextSteps: z.string().max(2000).optional(),
});
export type MeetingFormValues = z.infer<typeof meetingSchema>;
