import { describe, expect, it } from "vitest";

import {
  formatDate,
  greeting,
  pluralize,
  slugify,
  truncate,
} from "@/lib/utils";

describe("format utilities", () => {
  it("slugifies with accents removed and safe chars", () => {
    expect(slugify("Ação de Marketing 2026!")).toBe("acao-de-marketing-2026");
    expect(slugify("  espaço  extra  ")).toBe("espaco-extra");
    expect(slugify("!!!")).toBe("");
  });

  it("truncates strings with ellipsis when over max", () => {
    expect(truncate("abc", 10)).toBe("abc");
    expect(truncate("abcdefghijk", 6)).toBe("abcde…");
  });

  it("pluralizes correctly", () => {
    expect(pluralize(1, "tarefa", "tarefas")).toBe("1 tarefa");
    expect(pluralize(2, "tarefa", "tarefas")).toBe("2 tarefas");
    expect(pluralize(0, "item", "itens")).toBe("0 itens");
  });

  it("greeting varies by time of day", () => {
    const morning = new Date();
    morning.setHours(9, 0, 0, 0);
    expect(greeting(morning)).toBe("Bom dia");

    const afternoon = new Date();
    afternoon.setHours(15, 0, 0, 0);
    expect(greeting(afternoon)).toBe("Boa tarde");

    const night = new Date();
    night.setHours(21, 0, 0, 0);
    expect(greeting(night)).toBe("Boa noite");
  });

  it("formatDate returns pt-BR month strings", () => {
    const result = formatDate("2026-01-15T10:00:00.000Z", "MMMM");
    expect(result.toLowerCase()).toBe("janeiro");
  });
});
