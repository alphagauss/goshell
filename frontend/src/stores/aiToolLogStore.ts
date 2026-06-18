import { createStore } from "@/stores/createStore";
import type { AIToolLogEntry } from "@/types";

interface AIToolLogStoreState {
  entries: AIToolLogEntry[];
  lastUpdatedAt: number | null;
}

const store = createStore<AIToolLogStoreState>({
  entries: [],
  lastUpdatedAt: null,
});

export function useAIToolLogStore() {
  return store.useStore();
}

export function appendAIToolLogEntry(entry: AIToolLogEntry) {
  store.setState((current) => ({
    entries: [entry, ...current.entries],
    lastUpdatedAt: Date.now(),
  }));
}

export function clearAIToolLogEntries() {
  store.setState({
    entries: [],
    lastUpdatedAt: null,
  });
}

export function clearAIToolLogEntriesForConn(connID: string) {
  store.setState((current) => ({
    ...current,
    entries: current.entries.filter((item) => item.connId !== connID),
    lastUpdatedAt: Date.now(),
  }));
}
