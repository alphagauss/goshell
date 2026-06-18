import { ChevronDown, ChevronRight, Copy, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TerminalBlockItem } from "@/components/ssh/terminal/hooks/useBlockManager";
import { cn } from "@/lib/utils";

export function TerminalBlock({
  block,
  active = false,
  highlighted = false,
  onToggleCollapse,
  onCopy,
  onRemove,
  onReExecute,
}: {
  block: TerminalBlockItem;
  active?: boolean;
  highlighted?: boolean;
  onToggleCollapse?: (blockID: string) => void;
  onCopy?: (blockID: string) => void;
  onRemove?: (blockID: string) => void;
  onReExecute?: (blockID: string) => void;
}) {
  const statusLabel = {
    running: "运行中",
    success: "成功",
    failed: "失败",
    cancelled: "已取消",
  }[block.status];

  return (
    <article
      data-block-id={block.id}
      className={cn("terminal-block", `terminal-block--${block.kind}`, active && "is-active", highlighted && "is-highlighted")}
    >
      <header className="terminal-block__header">
        <button
          type="button"
          className="terminal-block__title"
          onClick={() => onToggleCollapse?.(block.id)}
        >
          {block.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <span>{block.kind === "command" ? `$ ${block.command ?? ""}` : "系统输出"}</span>
        </button>
        <div className="terminal-block__actions">
          <span className={cn("terminal-block__status", `terminal-block__status--${block.status}`)}>{statusLabel}</span>
          <Button size="icon" variant="ghost" title="复制" onClick={() => onCopy?.(block.id)}>
            <Copy size={14} />
          </Button>
          <Button size="icon" variant="ghost" title="重新执行" onClick={() => onReExecute?.(block.id)}>
            <RefreshCcw size={14} />
          </Button>
          <Button size="icon" variant="ghost" title="移除" onClick={() => onRemove?.(block.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </header>

      {!block.collapsed ? (
        <pre className="terminal-block__output">{block.output || " "}</pre>
      ) : null}
    </article>
  );
}
