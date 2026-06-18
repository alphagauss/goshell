import { useMemo, useRef, useState } from "react";
import { stripAnsi } from "@/components/ssh/terminal/utils/highlightAddon";

export type TerminalBlockKind = "command" | "system";
export type TerminalBlockStatus = "running" | "success" | "failed" | "cancelled";

export interface TerminalBlockItem {
  id: string;
  kind: TerminalBlockKind;
  command?: string;
  output: string;
  status: TerminalBlockStatus;
  collapsed: boolean;
  createdAt: number;
  finishedAt?: number;
  duration?: number;
}

interface TerminalBlockStats {
  total: number;
  commands: number;
  running: number;
  failed: number;
}

const PROMPT_RE = /[\$#]\s*$/;

function createID() {
  return `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stripTrailingPrompt(text: string) {
  const lines = text.replace(/\r/g, "").split("\n");
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  if (lines.length > 0 && PROMPT_RE.test(lines[lines.length - 1])) {
    lines.pop();
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  return lines.join("\n");
}

function stripCommandEcho(content: string, command?: string) {
  if (!command) {
    return content;
  }

  const normalized = content.replace(/\r/g, "");
  const commandPrefix = `${command}\n`;
  const commandPrefixCrLf = `${command}\r\n`;

  if (normalized.startsWith(commandPrefixCrLf)) {
    return normalized.slice(commandPrefixCrLf.length);
  }
  if (normalized.startsWith(commandPrefix)) {
    return normalized.slice(commandPrefix.length);
  }

  return normalized;
}

function finalizeBlock(block: TerminalBlockItem, status: TerminalBlockStatus): TerminalBlockItem {
  let output = stripTrailingPrompt(block.output);
  output = stripCommandEcho(output, block.command);
  output = output.replace(/^[\n\r]+/, "");

  if (status === "cancelled") {
    output = output.replace(/\^C[\r\n]*/g, "");
  }

  return {
    ...block,
    output,
    status,
    collapsed: block.collapsed,
    finishedAt: Date.now(),
    duration: Date.now() - block.createdAt,
  };
}

export function useBlockManager() {
  const [blocks, setBlocks] = useState<TerminalBlockItem[]>([]);
  const activeBlockIdRef = useRef<string | null>(null);

  const activeBlock = useMemo(() => {
    if (!activeBlockIdRef.current) {
      return null;
    }

    return blocks.find((block) => block.id === activeBlockIdRef.current) ?? null;
  }, [blocks]);

  const stats = useMemo<TerminalBlockStats>(() => {
    const commands = blocks.filter((block) => block.kind === "command").length;
    const running = blocks.filter((block) => block.status === "running").length;
    const failed = blocks.filter((block) => block.status === "failed").length;

    return {
      total: blocks.length,
      commands,
      running,
      failed,
    };
  }, [blocks]);

  function clearBlocks() {
    activeBlockIdRef.current = null;
    setBlocks([]);
  }

  function addSystemMessage(content: string) {
    const block: TerminalBlockItem = {
      id: createID(),
      kind: "system",
      output: content,
      status: "success",
      collapsed: false,
      createdAt: Date.now(),
    };
    setBlocks((current) => [...current, block]);
    return block;
  }

  function startCommand(command: string) {
    if (!command.trim()) {
      return null;
    }

    const block: TerminalBlockItem = {
      id: createID(),
      kind: "command",
      command,
      output: "",
      status: "running",
      collapsed: false,
      createdAt: Date.now(),
    };

    activeBlockIdRef.current = block.id;
    setBlocks((current) => [...current, block]);
    return block;
  }

  function appendOutput(text: string) {
    if (!text) {
      return false;
    }

    let ended = false;
    setBlocks((current) => {
      const next = [...current];
      const activeBlockId = activeBlockIdRef.current;
      const index = activeBlockId ? next.findIndex((block) => block.id === activeBlockId) : -1;

      if (index === -1) {
        next.push({
          id: createID(),
          kind: "system",
          output: text,
          status: "success",
          collapsed: false,
          createdAt: Date.now(),
        });
        return next;
      }

      const block = next[index];
      const updated = {
        ...block,
        output: `${block.output}${text}`,
      };

      const cleaned = stripAnsi(updated.output);
      const lines = cleaned.replace(/\r/g, "").split("\n");
      const lastLine = lines.length > 0 ? lines[lines.length - 1] : "";

      if (cleaned && PROMPT_RE.test(lastLine)) {
        next[index] = finalizeBlock(updated, updated.status === "cancelled" ? "cancelled" : "success");
        activeBlockIdRef.current = null;
        ended = true;
        return next;
      }

      next[index] = updated;
      return next;
    });

    return ended;
  }

  function finishActiveBlock(status: TerminalBlockStatus = "success") {
    const activeBlockId = activeBlockIdRef.current;
    if (!activeBlockId) {
      return null;
    }

    let finished: TerminalBlockItem | null = null;
    setBlocks((current) => {
      const next = current.map((block) => {
        if (block.id !== activeBlockId) {
          return block;
        }

        finished = finalizeBlock(block, status);
        return finished;
      });
      return next;
    });
    activeBlockIdRef.current = null;
    return finished;
  }

  function endBlockIfPrompt() {
    const activeBlock = blocks.find((block) => block.id === activeBlockIdRef.current);
    if (!activeBlock) {
      return false;
    }

    const cleaned = stripAnsi(activeBlock.output).replace(/\r/g, "");
    const lines = cleaned.split("\n");
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : "";
    if (!PROMPT_RE.test(lastLine)) {
      return false;
    }

    finishActiveBlock(activeBlock.status === "cancelled" ? "cancelled" : "success");
    return true;
  }

  function cancelCommand() {
    const active = activeBlockIdRef.current;
    if (!active) {
      return;
    }

    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== active) {
          return block;
        }

        return {
          ...block,
          output: `${block.output}^C\n`,
          status: "cancelled",
        };
      }),
    );
  }

  function toggleCollapse(blockID: string) {
    setBlocks((current) =>
      current.map((block) => (block.id === blockID ? { ...block, collapsed: !block.collapsed } : block)),
    );
  }

  function removeBlock(blockID: string) {
    setBlocks((current) => current.filter((block) => block.id !== blockID));
  }

  function getBlockContent(blockID: string) {
    const block = blocks.find((item) => item.id === blockID);
    if (!block) {
      return null;
    }

    return {
      command: block.command ?? "",
      output: block.output,
      status: block.status,
    };
  }

  function searchBlocks(keyword: string) {
    const needle = keyword.trim().toLowerCase();
    if (!needle) {
      return blocks;
    }

    return blocks.filter((block) => {
      const command = block.command?.toLowerCase() ?? "";
      const output = block.output.toLowerCase();
      return command.includes(needle) || output.includes(needle);
    });
  }

  function getStats() {
    return stats;
  }

  function exportAsText() {
    return blocks
      .map((block) => {
        if (block.kind === "command") {
          return [`$ ${block.command ?? ""}`, block.output].filter(Boolean).join("\n");
        }
        return block.output;
      })
      .join("\n");
  }

  return {
    blocks,
    activeBlock,
    stats,
    addSystemMessage,
    appendOutput,
    cancelCommand,
    clearBlocks,
    endBlockIfPrompt,
    exportAsText,
    finishActiveBlock,
    getBlockContent,
    getStats,
    removeBlock,
    searchBlocks,
    startCommand,
    toggleCollapse,
  };
}
