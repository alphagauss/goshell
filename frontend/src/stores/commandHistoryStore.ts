import { createStore } from "@/stores/createStore";
import type { CommandHistoryEntry } from "@/types";

interface CommandHistoryStoreState {
  entries: CommandHistoryEntry[];
  lastUpdatedAt: number | null;
}

const store = createStore<CommandHistoryStoreState>({
  entries: [],
  lastUpdatedAt: null,
});

export function useCommandHistoryStore() {
  return store.useStore();
}

export function appendCommandHistoryEntry(entry: CommandHistoryEntry) {
  store.setState((current) => ({
    entries: [entry, ...current.entries],
    lastUpdatedAt: Date.now(),
  }));
}

export function clearCommandHistory() {
  store.setState({
    entries: [],
    lastUpdatedAt: null,
  });
}

export function clearCommandHistoryForConn(connID: string) {
  store.setState((current) => ({
    ...current,
    entries: current.entries.filter((item) => item.connID !== connID),
    lastUpdatedAt: Date.now(),
  }));
}

export function toggleCommandFavorite(entryID: string) {
  store.setState((current) => ({
    ...current,
    entries: current.entries.map((item) =>
      item.id === entryID ? { ...item, favorite: !item.favorite } : item,
    ),
    lastUpdatedAt: Date.now(),
  }));
}
