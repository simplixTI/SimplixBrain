import type { Intent, TaskClass } from "./types";

interface Rule {
  regex: RegExp;
  taskClass: TaskClass;
  confidence: number;
  name: string;
}

/**
 * Rules-first classifier. Fast, deterministic, zero cost.
 * When no rule matches with confidence >= 0.7, falls back to "conversation"
 * which routes through hybrid retrieval + LLM.
 *
 * Order matters — earlier rules take precedence when they tie on confidence.
 */
const RULES: Rule[] = [
  { name: "vector.doc-lookup", regex: /\b(buscar?|encontrar?|achar?|localiza[rv]|onde\s+est[áa])\b.*\b(documento|pdf|contrato|artigo|nota|transcri[cç][aã]o|arquivo)\b/i, taskClass: "vector", confidence: 0.85 },
  { name: "sql.list",          regex: /^\s*(listar?|liste|mostrar?|mostre|exibir?|quais)\b/i,                                                   taskClass: "sql", confidence: 0.85 },
  { name: "sql.count",         regex: /^\s*(quantos?|quantas?)\b/i,                                                                            taskClass: "sql", confidence: 0.9 },
  { name: "translation",       regex: /\b(traduzir?|traduza|traduc[aã]o|translate)\b/i,                                                        taskClass: "translation", confidence: 0.9 },
  { name: "summarization",     regex: /\b(resumir?|resuma|resumo|sum[aá]rio|summarize|tl;?dr)\b/i,                                             taskClass: "summarization", confidence: 0.9 },
  { name: "coding",            regex: /\b(c[oó]digo|function|classe|typescript|javascript|python|sql\b|refactor|refatorar?|bug|debug)\b/i,     taskClass: "coding", confidence: 0.75 },
  { name: "planner",           regex: /\b(plano|planeje|planejar?|estrat[eé]gia|roadmap|roteiro|passo[ -]?a[ -]?passo|cronograma)\b/i,          taskClass: "planner", confidence: 0.8 },
  { name: "extraction",        regex: /\b(extrair?|extra[cç][aã]o|extract|parse)\b/i,                                                          taskClass: "extraction", confidence: 0.75 },
  { name: "generation",        regex: /\b(crie|criar?|escreva|escrever?|gere|gerar?|redija|redigir?|proponha)\b/i,                             taskClass: "generation", confidence: 0.7 },
];

const KEYWORD_STOP = new Set([
  "de","da","do","das","dos","a","o","as","os","e","ou","com","para","em","no","na","nos","nas",
  "que","um","uma","uns","umas","por","the","a","an","of","in","on","at","for",
]);

function extractKeywords(text: string, limit = 6): string[] {
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !KEYWORD_STOP.has(w));
  return Array.from(new Set(words)).slice(0, limit);
}

export function classify(query: string): Intent {
  const trimmed = query.trim();

  let best: Rule | null = null;
  for (const rule of RULES) {
    if (rule.regex.test(trimmed)) {
      if (!best || rule.confidence > best.confidence) best = rule;
    }
  }

  if (best) {
    return {
      taskClass: best.taskClass,
      confidence: best.confidence,
      keywords: extractKeywords(trimmed),
      matchedPattern: best.name,
    };
  }

  return {
    taskClass: "conversation",
    confidence: 0.4,
    keywords: extractKeywords(trimmed),
  };
}
