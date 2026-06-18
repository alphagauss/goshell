import { cn } from "@/lib/utils";

export function TerminalStatusBar({
  statusLabel,
  statusTone,
  commandCount,
  recordingLabel,
  searchLabel,
}: {
  statusLabel: string;
  statusTone: "muted" | "success" | "warning" | "danger";
  commandCount: number;
  recordingLabel?: string;
  searchLabel?: string;
}) {
  return (
    <div className="terminal-status-bar">
      <span className={cn("terminal-status-bar__tone", `is-${statusTone}`)}>
        {statusLabel}
      </span>
      <span>{commandCount} 条命令</span>
      {recordingLabel ? <span>{recordingLabel}</span> : null}
      {searchLabel ? <span>{searchLabel}</span> : null}
    </div>
  );
}
