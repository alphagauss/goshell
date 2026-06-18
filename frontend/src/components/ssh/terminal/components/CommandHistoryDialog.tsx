import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CommandHistoryEntry } from "@/components/ssh/terminal/hooks/useCommandHistory";

export function CommandHistoryDialog({
  visible,
  history,
  onOpenChange,
  onSelect,
  onExecute,
}: {
  visible: boolean;
  history: CommandHistoryEntry[];
  onOpenChange: (open: boolean) => void;
  onSelect: (command: string) => void;
  onExecute: (command: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return history.slice().reverse();
    }

    return history
      .filter((entry) => entry.command.toLowerCase().includes(needle))
      .slice()
      .reverse();
  }, [history, query]);

  return (
    <Dialog open={visible} onOpenChange={onOpenChange}>
      <DialogContent title="命令历史">
        <div className="terminal-history-dialog">
          <label className="terminal-history-dialog__search">
            <Search size={14} />
            <input
              className="input-base"
              value={query}
              placeholder="搜索历史命令"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="terminal-history-dialog__list">
            {filtered.length === 0 ? <div className="empty-state">没有匹配的命令</div> : null}
            {filtered.map((entry) => (
              <div key={entry.id} className="terminal-history-dialog__item">
                <code>{entry.command}</code>
                <div className="terminal-history-dialog__actions">
                  <Button size="sm" variant="secondary" onClick={() => onSelect(entry.command)}>
                    使用
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => onExecute(entry.command)}>
                    执行
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
