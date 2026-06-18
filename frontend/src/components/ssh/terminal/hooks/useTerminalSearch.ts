import { useEffect, useMemo, useState } from "react";
import type { TerminalBlockItem } from "@/components/ssh/terminal/hooks/useBlockManager";

export interface TerminalSearchResult {
  blockID: string;
  label: string;
  preview: string;
}

export function useTerminalSearch(blocks: TerminalBlockItem[]) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo<TerminalSearchResult[]>(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return [];
    }

    return blocks
      .flatMap((block) => {
        const command = block.command?.toLowerCase() ?? "";
        const output = block.output.toLowerCase();
        const match = command.includes(needle) || output.includes(needle);
        if (!match) {
          return [];
        }

        const label = block.command ? `$ ${block.command}` : block.output.split("\n")[0] || "系统输出";
        const preview = block.output.replace(/\s+/g, " ").slice(0, 120);
        return [
          {
            blockID: block.id,
            label,
            preview,
          },
        ];
      })
      .slice(0, 100);
  }, [blocks, query]);

  useEffect(() => {
    setActiveIndex(results.length > 0 ? 0 : -1);
  }, [results.length, query]);

  const activeResult = activeIndex >= 0 ? results[activeIndex] ?? null : null;

  function open(initialQuery = "") {
    setQuery(initialQuery);
    setVisible(true);
  }

  function close() {
    setVisible(false);
  }

  function next() {
    if (results.length === 0) {
      return;
    }
    setActiveIndex((current) => (current + 1) % results.length);
  }

  function previous() {
    if (results.length === 0) {
      return;
    }
    setActiveIndex((current) => (current - 1 + results.length) % results.length);
  }

  function reset() {
    setQuery("");
    setVisible(false);
    setActiveIndex(-1);
  }

  return {
    activeIndex,
    activeResult,
    close,
    next,
    open,
    previous,
    query,
    results,
    reset,
    setQuery,
    visible,
  };
}
