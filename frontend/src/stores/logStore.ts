import { useSyncExternalStore } from "react";
import type { LogEntry } from "@/types";

const STORAGE_KEY = "goshell:log-entries";
const MAX_LOGS = 500;

let entries = loadEntries();
const listeners = new Set<() => void>();

function loadEntries(): LogEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLogEntry).slice(0, MAX_LOGS);
  } catch {
    return [];
  }
}

function isLogEntry(value: unknown): value is LogEntry {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LogEntry>;
  return typeof candidate.id === "string" && typeof candidate.scope === "string" && typeof candidate.message === "string";
}

function persistEntries() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore persistence failures.
  }
}

function notify() {
  persistEntries();
  for (const listener of listeners) {
    listener();
  }
}

export function appendLogEntry(entry: LogEntry) {
  entries = [entry, ...entries].slice(0, MAX_LOGS);
  notify();
}

export function clearLogEntries() {
  entries = [];
  notify();
}

export function getLogEntries() {
  return entries;
}

export function subscribeLogStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLogStore() {
  return useSyncExternalStore(subscribeLogStore, getLogEntries, () => []);
}
