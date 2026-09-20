import { useEffect, useState, useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

export type LocalThread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

const KEY = "studai.threads.v1";

function read(): LocalThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: LocalThread[] | null = null;

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(next: LocalThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  cache = next;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLocalThreads() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      if (cache === null) cache = read();
      return cache;
    },
    () => [],
  );
  return snapshot;
}

export function createLocalThread(id: string, title = "New chat"): LocalThread {
  const list = read();
  const t: LocalThread = { id, title, updatedAt: Date.now(), messages: [] };
  write([t, ...list.filter((x) => x.id !== id)]);
  return t;
}

export function getLocalThread(id: string): LocalThread | undefined {
  return read().find((t) => t.id === id);
}

export function updateLocalThread(id: string, patch: Partial<LocalThread>) {
  const list = read();
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) {
    write([{ id, title: "New chat", updatedAt: Date.now(), messages: [], ...patch }, ...list]);
    return;
  }
  const next = [...list];
  next[idx] = { ...next[idx], ...patch, updatedAt: Date.now() };
  next.sort((a, b) => b.updatedAt - a.updatedAt);
  write(next);
}

export function deleteLocalThread(id: string) {
  write(read().filter((t) => t.id !== id));
}

export function readLocalThreads(): LocalThread[] {
  return read();
}

export function clearLocalThreads() {
  write([]);
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}