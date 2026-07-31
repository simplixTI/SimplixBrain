import { invalidate } from "./events";

const NS = "simplixbrain.v1";

export type StorageKey =
  | "projects"
  | "notes"
  | "tasks"
  | "ideas"
  | "decisions"
  | "meetings"
  | "timeline"
  | "conversations"
  | "meta";

function fullKey(key: StorageKey): string {
  return `${NS}.${key}`;
}

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCollection<T>(key: StorageKey): T[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(fullKey(key));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCollection<T>(key: StorageKey, value: T[]): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(fullKey(key), JSON.stringify(value));
  invalidate(key);
}

export function readMeta<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(`${NS}.meta.${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeMeta<T>(key: string, value: T): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(`${NS}.meta.${key}`, JSON.stringify(value));
}

export function clearAll(): void {
  if (!hasWindow()) return;
  const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(NS));
  for (const k of keys) window.localStorage.removeItem(k);
}
