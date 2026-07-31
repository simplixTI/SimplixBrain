import crypto from "node:crypto";

import type { OrchestratedResponse } from "./types";

const DEFAULT_TTL_MS = 5 * 60_000;
const MAX_ENTRIES = 500;

interface Entry {
  at: number;
  response: OrchestratedResponse;
}

const store = new Map<string, Entry>();

function normalize(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function cacheKey(input: {
  workspaceId: string;
  query: string;
  focusNodeId?: string;
}): string {
  const raw = [
    input.workspaceId,
    normalize(input.query),
    input.focusNodeId ?? "",
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function getCached(key: string, ttlMs = DEFAULT_TTL_MS): OrchestratedResponse | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > ttlMs) {
    store.delete(key);
    return null;
  }
  return { ...entry.response, meta: { ...entry.response.meta, cacheHit: true } };
}

export function setCached(key: string, response: OrchestratedResponse): void {
  if (store.size >= MAX_ENTRIES) {
    // Trim oldest ~10% to keep the map bounded.
    const kill = Math.floor(MAX_ENTRIES * 0.1);
    let n = 0;
    for (const k of store.keys()) {
      if (n++ >= kill) break;
      store.delete(k);
    }
  }
  store.set(key, { at: Date.now(), response });
}

export function clearCache(): void {
  store.clear();
}
