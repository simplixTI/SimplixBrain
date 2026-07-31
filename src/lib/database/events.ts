import type { StorageKey } from "./storage";

type Listener = () => void;

const listeners = new Map<StorageKey | "*", Set<Listener>>();

export function subscribe(key: StorageKey | "*", cb: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(cb);
  return () => {
    set?.delete(cb);
  };
}

export function invalidate(key: StorageKey): void {
  listeners.get(key)?.forEach((cb) => cb());
  listeners.get("*")?.forEach((cb) => cb());
}
