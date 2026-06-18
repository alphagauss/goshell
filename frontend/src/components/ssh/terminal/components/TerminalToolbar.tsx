import { History, LayoutGrid, Play, Search, Square, Terminal as TerminalIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TerminalToolbar({
  view,
  statusLabel,
  statusTone,
  isRecording,
  commandCount,
  onSwitchView,
  onToggleRecording,
  onOpenHistory,
  onOpenSearch,
  onClear,
}: {
  view: "structured" | "classic";
  statusLabel: string;
  statusTone: "muted" | "success" | "warning" | "danger";
  isRecording: boolean;
  commandCount: number;
  onSwitchView: () => void;
  onToggleRecording: () => void;
  onOpenHistory: () => void;
  onOpenSearch: () => void;
  onClear: () => void;
}) {
  return (
    <div className="terminal-toolbar">
      <div className="terminal-toolbar__status">
        <span className={cn("terminal-toolbar__dot", `is-${statusTone}`)} />
        <span>{statusLabel}</span>
        <span className="terminal-toolbar__meta">{commandCount} 条命令</span>
      </div>

      <div className="terminal-toolbar__actions">
        <Button size="sm" variant={view === "structured" ? "primary" : "secondary"} onClick={onSwitchView}>
          {view === "structured" ? <LayoutGrid size={14} /> : <TerminalIcon size={14} />}
          <span>{view === "structured" ? "结构化" : "经典"}</span>
        </Button>
        <Button size="sm" variant={isRecording ? "danger" : "secondary"} onClick={onToggleRecording}>
          {isRecording ? <Square size={14} /> : <Play size={14} />}
          <span>{isRecording ? "停止录制" : "录制"}</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={onOpenHistory}>
          <History size={14} />
          <span>历史</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={onOpenSearch}>
          <Search size={14} />
          <span>搜索</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={onClear}>
          <Trash2 size={14} />
          <span>清空</span>
        </Button>
      </div>
    </div>
  );
}
