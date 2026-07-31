import { sqlStrategy } from "./strategies/sql";
import { vectorStrategy } from "./strategies/vector";
import { hybridStrategy } from "./strategies/hybrid";
import type { OrchestratorContext, Strategy, StrategyName, StrategyResult } from "./types";

/**
 * Returns an ordered list of strategies to try for the given intent.
 * Strategies return null when they can't handle → router moves to next.
 * Every chain ends in hybrid, so nothing goes unanswered.
 */
export async function pickStrategies(
  ctx: OrchestratorContext,
): Promise<Array<{ name: StrategyName; run: Strategy }>> {
  const { intent } = ctx;
  const sql = await sqlStrategy(ctx);

  switch (intent.taskClass) {
    case "sql":
      return [
        { name: "sql", run: sql },
        { name: "hybrid", run: hybridStrategy },
      ];
    case "vector":
      return [
        { name: "vector", run: vectorStrategy },
        { name: "hybrid", run: hybridStrategy },
      ];
    case "planner":
    case "generation":
    case "coding":
      return [{ name: "hybrid", run: hybridStrategy }];
    default:
      // conversation, summarization, translation, extraction, memory...
      return [
        { name: "sql", run: sql },
        { name: "hybrid", run: hybridStrategy },
      ];
  }
}

export async function runStrategies(
  ctx: OrchestratorContext,
): Promise<{ result: StrategyResult; strategy: StrategyName }> {
  const chain = await pickStrategies(ctx);
  for (const { name, run } of chain) {
    const result = await run(ctx);
    if (result) return { result, strategy: name };
  }
  return {
    strategy: "hybrid",
    result: {
      answer: "Não encontrei essa informação no Brain.",
      hits: [],
      meta: { llmSkipped: true },
    },
  };
}
