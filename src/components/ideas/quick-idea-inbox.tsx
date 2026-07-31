"use client";

import { Inbox, Send, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/hooks/use-data";
import { ideaRepository, timelineRepository } from "@/lib/database/local";

export function QuickIdeaInbox() {
  const projects = useProjects();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [pending, setPending] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setPending(true);
    const created = ideaRepository.create({
      title: trimmed,
      description: "",
      projectId: projectId === "none" ? undefined : projectId,
      potential: "medium",
      status: "new",
      tags: [],
    });
    timelineRepository.record({
      type: "idea_created",
      entityKind: "idea",
      entityId: created.id,
      projectId: created.projectId,
      title: `Ideia registrada: ${created.title}`,
    });
    toast.success("Ideia capturada.");
    setTitle("");
    setPending(false);
  }

  return (
    <div className="surface relative overflow-hidden rounded-xl p-4">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[hsl(var(--hue-amber)/0.15)] blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-[hsl(var(--hue-fuchsia)/0.15)] blur-3xl"
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--hue-amber)/0.18)] text-[hsl(var(--hue-amber))]">
            <Inbox className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Caixa de entrada de ideias</p>
            <p className="text-[11px] text-muted-foreground">
              Registre a ideia em uma linha. Refina depois.
            </p>
          </div>
          <Sparkles className="ml-auto h-4 w-4 text-[hsl(var(--hue-amber))]/70" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Qual foi a sacada que apareceu agora?"
            className="flex-1"
            disabled={pending}
          />
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem projeto</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={pending || !title.trim()}>
            <Send className="h-4 w-4" />
            Capturar
          </Button>
        </form>
      </div>
    </div>
  );
}
