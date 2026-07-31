"use client";

import { useEffect, useState } from "react";

import {
  conversationRepository,
  decisionRepository,
  ideaRepository,
  meetingRepository,
  noteRepository,
  projectRepository,
  taskRepository,
  timelineRepository,
} from "@/lib/database/local";
import { ensureSeedData } from "@/lib/database/seed-loader";

import { useCollection } from "./use-collection";

export function useSeeded(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    ensureSeedData();
    setReady(true);
  }, []);
  return ready;
}

export function useProjects() {
  return useCollection("projects", () => projectRepository.findAll());
}

export function useNotes() {
  return useCollection("notes", () => noteRepository.findAll());
}

export function useTasks() {
  return useCollection("tasks", () => taskRepository.findAll());
}

export function useIdeas() {
  return useCollection("ideas", () => ideaRepository.findAll());
}

export function useDecisions() {
  return useCollection("decisions", () => decisionRepository.findAll());
}

export function useMeetings() {
  return useCollection("meetings", () => meetingRepository.findAll());
}

export function useTimeline() {
  return useCollection("timeline", () => timelineRepository.findAll());
}

export function useConversations() {
  return useCollection("conversations", () =>
    conversationRepository.findAll(),
  );
}
