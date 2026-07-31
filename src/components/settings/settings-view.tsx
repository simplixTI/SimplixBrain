"use client";

import {
  Download,
  Monitor,
  Moon,
  RefreshCcw,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useDecisions,
  useIdeas,
  useMeetings,
  useNotes,
  useProjects,
  useTasks,
  useTimeline,
} from "@/hooks/use-data";
import { downloadJson } from "@/lib/export/markdown";
import { clearAll } from "@/lib/database/storage";
import { resetToSeedData } from "@/lib/database/seed-loader";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "light", label: "Claro", icon: Sun },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const projects = useProjects();
  const notes = useNotes();
  const tasks = useTasks();
  const ideas = useIdeas();
  const decisions = useDecisions();
  const meetings = useMeetings();
  const timeline = useTimeline();

  function handleReset() {
    if (
      !window.confirm(
        "Isso apaga os dados atuais e restaura os projetos de demonstração. Confirma?",
      )
    )
      return;
    resetToSeedData();
    toast.success("Workspace restaurado para os dados de demonstração.");
  }

  function handleClear() {
    if (
      !window.confirm(
        "Isso apaga TODOS os dados do SimplixBrain neste navegador. Confirma?",
      )
    )
      return;
    clearAll();
    toast.success("Workspace zerado. Atualize a página.");
  }

  function handleExport() {
    downloadJson(
      `simplixbrain-backup-${new Date().toISOString().slice(0, 10)}`,
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        projects,
        notes,
        tasks,
        ideas,
        decisions,
        meetings,
        timeline,
      },
    );
    toast.success("Backup baixado.");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <p className="text-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Preferências
        </p>
        <h1 className="text-display text-3xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Ajustes de aparência e dados do workspace.
        </p>
      </div>

      <Card className="surface">
        <CardHeader>
          <CardTitle>Tema</CardTitle>
          <CardDescription>
            Escolha entre modo escuro, claro ou seguir o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = mounted && theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-sm transition-all",
                    active
                      ? "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
                      : "border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Workspace
          </CardTitle>
          <CardDescription>
            {projects.length} projetos · {notes.length} notas · {tasks.length} tarefas
            · {ideas.length} ideias · {decisions.length} decisões ·{" "}
            {meetings.length} reuniões · {timeline.length} eventos
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Baixar backup (JSON)
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCcw className="h-4 w-4" />
            Restaurar dados de demonstração
          </Button>
          <Button
            variant="ghost"
            className="text-[hsl(var(--hue-rose))] hover:bg-[hsl(var(--hue-rose)/0.1)] hover:text-[hsl(var(--hue-rose))]"
            onClick={handleClear}
          >
            <Trash2 className="h-4 w-4" />
            Zerar tudo
          </Button>
        </CardContent>
      </Card>

      <Card className="surface">
        <CardHeader>
          <CardTitle>Sobre</CardTitle>
          <CardDescription>SimplixBrain MVP · v0.1.0</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Os dados desta versão são persistidos no{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              localStorage
            </code>{" "}
            do navegador. Repositórios estão desacoplados para trocar por Supabase
            sem alterar as telas.
          </p>
          <p>
            Próximas fases previstas: autenticação + banco (Supabase), IA
            (OpenAI/Gemini/Claude), base de conhecimento com embeddings,
            integrações (Gmail, Calendar, Drive, GitHub, WhatsApp, Slack) e
            agentes especialistas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
