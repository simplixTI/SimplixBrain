"use client";

import { useEffect, useState } from "react";

import { subscribe } from "@/lib/database/events";
import type { StorageKey } from "@/lib/database/storage";

export function useCollection<T>(key: StorageKey, read: () => T[]): T[] {
  const [items, setItems] = useState<T[]>(() => []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read());
    setReady(true);
    const unsub = subscribe(key, () => setItems(read()));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return ready ? items : items;
}

export function useEntity<T>(
  key: StorageKey,
  read: () => T | null,
): T | null {
  const [value, setValue] = useState<T | null>(() => null);

  useEffect(() => {
    setValue(read());
    const unsub = subscribe(key, () => setValue(read()));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return value;
}
