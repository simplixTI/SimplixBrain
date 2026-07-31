import { describe, expect, it } from "vitest";

import { classify } from "@/lib/ai/orchestrator/classifier";

describe("orchestrator classifier", () => {
  const cases: Array<{ q: string; taskClass: string; minConfidence: number }> = [
    { q: "Listar tarefas pendentes do Gamma", taskClass: "sql",           minConfidence: 0.8 },
    { q: "Mostre os projetos ativos",         taskClass: "sql",           minConfidence: 0.8 },
    { q: "Quantos projetos temos?",           taskClass: "sql",           minConfidence: 0.85 },
    { q: "Buscar documento sobre contrato",   taskClass: "vector",        minConfidence: 0.8 },
    { q: "Traduzir esse texto pra inglês",    taskClass: "translation",   minConfidence: 0.85 },
    { q: "Resuma a reunião de ontem",         taskClass: "summarization", minConfidence: 0.85 },
    { q: "Refatorar essa função em TypeScript", taskClass: "coding",      minConfidence: 0.7 },
    { q: "Crie um plano estratégico pro Gamma", taskClass: "planner",     minConfidence: 0.75 },
    { q: "Extrair CNPJ desse texto",          taskClass: "extraction",    minConfidence: 0.7 },
    { q: "O que rolou na última reunião?",    taskClass: "conversation", minConfidence: 0.3 },
  ];

  for (const { q, taskClass, minConfidence } of cases) {
    it(`classifies "${q}" as ${taskClass}`, () => {
      const intent = classify(q);
      expect(intent.taskClass).toBe(taskClass);
      expect(intent.confidence).toBeGreaterThanOrEqual(minConfidence);
      expect(intent.keywords.length).toBeGreaterThan(0);
    });
  }

  it("returns keywords stripped of accents and stopwords", () => {
    const intent = classify("Quais tarefas atrasadas do projeto Gamma?");
    expect(intent.keywords).not.toContain("do");
    expect(intent.keywords).toContain("gamma");
    expect(intent.keywords).toContain("tarefas");
  });
});
