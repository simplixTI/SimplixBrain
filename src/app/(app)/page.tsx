"use client";

import { MessageSquare, Network, Sparkles } from "lucide-react";

import { KnowledgeGraph } from "@/components/brain/knowledge-graph";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Segundo cérebro
        </p>
        <h1 className="text-display text-3xl font-semibold md:text-4xl">
          O cérebro do seu <span className="shimmer-text">workspace</span>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Grafo interativo do conhecimento e chat contextual sobre projetos,
          notas, tarefas e decisões. Estilo Obsidian — mas conectado ao seu
          fluxo de produção.
        </p>
      </div>

      <Tabs defaultValue="graph">
        <TabsList>
          <TabsTrigger value="graph">
            <Network className="h-3.5 w-3.5" />
            Grafo
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph">
          <KnowledgeGraph />
        </TabsContent>

        <TabsContent value="chat">
          <Card className="surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Brain Chat
              </CardTitle>
              <CardDescription>
                O chat global com contexto completo será liberado na próxima
                rodada. A arquitetura já está pronta para plugar OpenAI, Gemini
                ou Claude — e receber voz própria.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Enquanto isso, cada projeto já tem seu Brain simulado na aba{" "}
              <em>Brain</em> do detalhe.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
