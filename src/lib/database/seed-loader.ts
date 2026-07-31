import {
  seedDecisions,
  seedIdeas,
  seedMeetings,
  seedNotes,
  seedProjects,
  seedTasks,
  seedTimeline,
} from "@/data/seed";

import { readMeta, writeCollection, writeMeta } from "./storage";

const SEED_FLAG = "seeded.v1";

export function ensureSeedData(): void {
  if (typeof window === "undefined") return;
  const already = readMeta<boolean>(SEED_FLAG, false);
  if (already) return;

  writeCollection("projects", seedProjects);
  writeCollection("notes", seedNotes);
  writeCollection("tasks", seedTasks);
  writeCollection("ideas", seedIdeas);
  writeCollection("decisions", seedDecisions);
  writeCollection("meetings", seedMeetings);
  writeCollection("timeline", seedTimeline);
  writeCollection("conversations", []);
  writeMeta(SEED_FLAG, true);
}

export function resetToSeedData(): void {
  if (typeof window === "undefined") return;
  writeCollection("projects", seedProjects);
  writeCollection("notes", seedNotes);
  writeCollection("tasks", seedTasks);
  writeCollection("ideas", seedIdeas);
  writeCollection("decisions", seedDecisions);
  writeCollection("meetings", seedMeetings);
  writeCollection("timeline", seedTimeline);
  writeCollection("conversations", []);
  writeMeta(SEED_FLAG, true);
}
