"use client";

import { useRouter } from "next/navigation";
import {
  Brain,
  CalendarClock,
  CheckSquare,
  Compass,
  FileText,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Network,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  useDecisions,
  useIdeas,
  useMeetings,
  useNotes,
  useProjects,
  useTasks,
} from "@/hooks/use-data";

interface GlobalCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_ACTIONS = [
  { icon: Network, label: "Ir para o Brain", href: "/", keywords: "grafo obsidian brain home" },
  {
    icon: LayoutDashboard,
    label: "Ir para o Dashboard",
    href: "/dashboard",
    keywords: "dashboard visão geral resumo",
  },
  {
    icon: Compass,
    label: "Ver projetos",
    href: "/projects",
    keywords: "projetos lista projeto",
  },
  { icon: FileText, label: "Ver notas", href: "/notes", keywords: "notas markdown notion" },
  {
    icon: CheckSquare,
    label: "Ver tarefas",
    href: "/tasks",
    keywords: "tarefas todo tasks pendentes",
  },
  {
    icon: Lightbulb,
    label: "Registrar nova ideia",
    href: "/ideas",
    keywords: "ideia inbox captura",
  },
  {
    icon: Brain,
    label: "Registrar decisão",
    href: "/decisions",
    keywords: "decisão por quê motivo",
  },
  {
    icon: CalendarClock,
    label: "Registrar reunião",
    href: "/meetings",
    keywords: "reunião meeting encontro",
  },
  {
    icon: MessageSquare,
    label: "Timeline global",
    href: "/timeline",
    keywords: "timeline atividade histórico",
  },
  { icon: Settings, label: "Abrir configurações", href: "/settings", keywords: "config settings tema" },
];

export function GlobalCommandPalette({
  open,
  onOpenChange,
}: GlobalCommandPaletteProps) {
  const router = useRouter();
  const projects = useProjects();
  const notes = useNotes();
  const tasks = useTasks();
  const ideas = useIdeas();
  const decisions = useDecisions();
  const meetings = useMeetings();

  const [_, setTick] = useState(0);
  useEffect(() => {
    if (open) setTick((t) => t + 1);
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange],
  );

  const results = useMemo(() => {
    return {
      projects: projects.slice(0, 6),
      notes: notes.slice(0, 6),
      tasks: tasks.slice(0, 6),
      ideas: ideas.slice(0, 6),
      decisions: decisions.slice(0, 6),
      meetings: meetings.slice(0, 6),
    };
  }, [projects, notes, tasks, ideas, decisions, meetings]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <Command shouldFilter>
          <CommandInput placeholder="Buscar projetos, notas, tarefas, ideias, decisões, reuniões…" />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>

            <CommandGroup heading="Ações rápidas">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <CommandItem
                    key={a.href}
                    value={`${a.label} ${a.keywords}`}
                    onSelect={() => navigate(a.href)}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {a.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {results.projects.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Projetos">
                  {results.projects.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`projeto ${p.name} ${p.description} ${p.tags.join(" ")}`}
                      onSelect={() => navigate(`/projects/${p.slug}`)}
                    >
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full"
                        style={{ background: p.color ?? "hsl(var(--primary))" }}
                      />
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="text-mono text-[10px] uppercase text-muted-foreground">
                        {p.status}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            {results.notes.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Notas">
                  {results.notes.map((n) => (
                    <CommandItem
                      key={n.id}
                      value={`nota ${n.title} ${n.tags.join(" ")}`}
                      onSelect={() => navigate(`/notes/${n.id}`)}
                    >
                      <FileText className="h-4 w-4 text-[hsl(var(--hue-cyan))]" />
                      <span className="flex-1 truncate">{n.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            {results.tasks.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Tarefas">
                  {results.tasks.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={`tarefa ${t.title} ${t.tags.join(" ")}`}
                      onSelect={() => navigate(`/tasks`)}
                    >
                      <CheckSquare className="h-4 w-4 text-[hsl(var(--hue-amber))]" />
                      <span className="flex-1 truncate">{t.title}</span>
                      <span className="text-mono text-[10px] uppercase text-muted-foreground">
                        {t.status}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            {results.ideas.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Ideias">
                  {results.ideas.map((i) => (
                    <CommandItem
                      key={i.id}
                      value={`ideia ${i.title} ${i.tags.join(" ")}`}
                      onSelect={() => navigate("/ideas")}
                    >
                      <Lightbulb className="h-4 w-4 text-[hsl(var(--hue-fuchsia))]" />
                      <span className="flex-1 truncate">{i.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            {results.decisions.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Decisões">
                  {results.decisions.map((d) => (
                    <CommandItem
                      key={d.id}
                      value={`decisão ${d.title} ${d.rationale}`}
                      onSelect={() => navigate("/decisions")}
                    >
                      <Brain className="h-4 w-4 text-[hsl(var(--hue-violet))]" />
                      <span className="flex-1 truncate">{d.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}

            {results.meetings.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Reuniões">
                  {results.meetings.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={`reunião ${m.title} ${m.participants.join(" ")}`}
                      onSelect={() => navigate("/meetings")}
                    >
                      <CalendarClock className="h-4 w-4 text-[hsl(var(--hue-rose))]" />
                      <span className="flex-1 truncate">{m.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
