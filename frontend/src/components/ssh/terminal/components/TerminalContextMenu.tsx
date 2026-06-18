import { Search, Copy, ClipboardPaste, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TerminalContextMenu({
  visible,
  position,
  onCopy,
  onPaste,
  onSelectAll,
  onClear,
  onSearch,
  onClose,
}: {
  visible: boolean;
  position: { x: number; y: number };
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onClear: () => void;
  onSearch: () => void;
  onClose: () => void;
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="terminal-context-menu" style={{ left: position.x, top: position.y }} onMouseLeave={onClose}>
      <button type="button" className="terminal-context-menu__item" onClick={onCopy}>
        <Copy size={14} />
        <span>复制</span>
      </button>
      <button type="button" className="terminal-context-menu__item" onClick={onPaste}>
        <ClipboardPaste size={14} />
        <span>粘贴</span>
      </button>
      <button type="button" className="terminal-context-menu__item" onClick={onSelectAll}>
        <span className="terminal-context-menu__symbol">Ctrl</span>
        <span>全选</span>
      </button>
      <button type="button" className={cn("terminal-context-menu__item")} onClick={onSearch}>
        <Search size={14} />
        <span>搜索</span>
      </button>
      <button type="button" className="terminal-context-menu__item is-danger" onClick={onClear}>
        <Trash2 size={14} />
        <span>清空</span>
      </button>
    </div>
  );
}
