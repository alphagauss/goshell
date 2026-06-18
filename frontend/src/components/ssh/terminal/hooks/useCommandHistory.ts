import { useEffect, useRef, useState } from "react";

export interface CommandHistoryEntry {
  id: string;
  command: string;
  createdAt: number;
}

function readHistory(persistKey: string) {
  if (typeof window === "undefined") {
    return [] as CommandHistoryEntry[];
  }

  try {
    const saved = window.localStorage.getItem(persistKey);
    if (!saved) {
      return [] as CommandHistoryEntry[];
    }

    const parsed = JSON.parse(saved) as CommandHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as CommandHistoryEntry[];
  }
}

export function useCommandHistory(persistKey: string) {
  const [history, setHistory] = useState<CommandHistoryEntry[]>(() => readHistory(persistKey));
  const draftInputRef = useRef("");
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(persistKey, JSON.stringify(history.slice(-500)));
  }, [history, persistKey]);

  function updateCurrentInput(value: string) {
    draftInputRef.current = value;
  }

  function addCommand(command: string) {
    const trimmed = command.trim();
    if (!trimmed) {
      return null;
    }

    const entry: CommandHistoryEntry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`,
      command: trimmed,
      createdAt: Date.now(),
    };

    setHistory((current) => [...current, entry].slice(-500));
    historyIndexRef.current = -1;
    draftInputRef.current = "";
    return entry;
  }

  function searchCommands(keyword: string) {
    const needle = keyword.trim().toLowerCase();
    if (!needle) {
      return history.slice(-50).reverse();
    }

    return history
      .filter((entry) => entry.command.toLowerCase().includes(needle))
      .slice(-50)
      .reverse();
  }

  function getPreviousCommand(currentInput = draftInputRef.current) {
    if (history.length === 0) {
      return null;
    }

    if (historyIndexRef.current === -1) {
      draftInputRef.current = currentInput;
      historyIndexRef.current = history.length - 1;
    } else if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
    }

    return history[historyIndexRef.current]?.command ?? null;
  }

  function getNextCommand() {
    if (historyIndexRef.current === -1) {
      return null;
    }

    if (historyIndexRef.current < history.length - 1) {
      historyIndexRef.current += 1;
      return history[historyIndexRef.current]?.command ?? null;
    }

    historyIndexRef.current = -1;
    return draftInputRef.current;
  }

  function resetNavigation() {
    historyIndexRef.current = -1;
  }

  function clearHistory() {
    setHistory([]);
    resetNavigation();
  }

  function getStats() {
    return {
      total: history.length,
    };
  }

  return {
    history,
    addCommand,
    clearHistory,
    getNextCommand,
    getPreviousCommand,
    getStats,
    resetNavigation,
    searchCommands,
    updateCurrentInput,
  };
}
