import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { StatusLine } from "@/components/StatusLine";
import { clearLogEntries, useLogStore } from "@/stores/logStore";
import type { LogEntry } from "@/types";

type LogLevelFilter = "all" | "debug" | "info" | "warn" | "error";

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function formatLogTime(timestamp: number) {
  return timeFormatter.format(new Date(timestamp));
}

function getLogLevelLabel(level: LogEntry["level"]) {
  switch (level) {
    case "debug":
      return "调试";
    case "info":
      return "信息";
    case "warn":
      return "警告";
    case "error":
      return "错误";
    default:
      return String(level);
  }
}

function getLogLevelClass(level: LogEntry["level"]) {
  switch (level) {
    case "info":
      return "status-pill--success";
    case "warn":
      return "status-pill--warning";
    case "error":
      return "status-pill--error";
    default:
      return "";
  }
}

function stringifyDetails(details?: Record<string, unknown>) {
  if (!details) {
    return "";
  }

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

function matchEntry(entry: LogEntry, query: string, levelFilter: LogLevelFilter, scopeFilter: string) {
  if (levelFilter !== "all" && entry.level !== levelFilter) {
    return false;
  }

  if (scopeFilter !== "all" && entry.scope !== scopeFilter) {
    return false;
  }

  if (!query) {
    return true;
  }

  const haystack = [entry.scope, entry.source ?? "", entry.message, stringifyDetails(entry.details)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function LogsPanel({ connID }: { connID: string }) {
  const entries = useLogStore();
  const confirm = useConfirm();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevelFilter>("all");
  const [scopeFilter, setScopeFilter] = useState("all");

  const scopes = useMemo(() => {
    return Array.from(new Set(entries.map((entry) => entry.scope))).sort((left, right) => left.localeCompare(right));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const search = query.trim().toLowerCase();
    return entries.filter((entry) => matchEntry(entry, search, levelFilter, scopeFilter));
  }, [entries, levelFilter, query, scopeFilter]);

  const summaryText =
    entries.length === 0
      ? "暂无应用日志"
      : filteredEntries.length === entries.length
        ? `共 ${entries.length} 条日志`
        : `显示 ${filteredEntries.length} / ${entries.length} 条日志`;

  async function clearLogs() {
    const confirmed = await confirm({
      title: "清空日志",
      description: "确定清空本地应用日志吗？",
      confirmText: "清空",
      cancelText: "取消",
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    clearLogEntries();
  }

  return (
    <section className="tool-panel ssh-panel logs-panel">
      <div className="panel-heading">
        <div>
          <h2>日志</h2>
          <span className="logs-panel__subtitle">本地应用日志，支持按作用域和级别筛选</span>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void clearLogs()} disabled={entries.length === 0}>
          <Trash2 size={14} />
          清空日志
        </Button>
      </div>

      <div className="logs-panel__filters">
        <label className="logs-panel__filter logs-panel__filter--search">
          <span>搜索</span>
          <input
            className="input-base"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索作用域、消息或详情"
          />
        </label>

        <label className="logs-panel__filter">
          <span>级别</span>
          <select className="input-base" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as LogLevelFilter)}>
            <option value="all">全部</option>
            <option value="debug">调试</option>
            <option value="info">信息</option>
            <option value="warn">警告</option>
            <option value="error">错误</option>
          </select>
        </label>

        <label className="logs-panel__filter">
          <span>作用域</span>
          <select className="input-base" value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value)}>
            <option value="all">全部</option>
            {scopes.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="logs-panel__summary">
        <span className="status-pill">{entries.length} 条总计</span>
        <span className="status-pill">{filteredEntries.length} 条显示</span>
        {levelFilter !== "all" ? <span className="status-pill status-pill--warning">{levelFilter}</span> : null}
        {scopeFilter !== "all" ? <span className="status-pill">{scopeFilter}</span> : null}
      </div>

      <StatusLine tone={entries.length === 0 ? "warning" : "muted"}>{summaryText}</StatusLine>

      <div className="logs-panel__list">
        {filteredEntries.length === 0 ? (
          <div className="empty-state empty-state--compact">
            {entries.length === 0 ? "暂无应用日志" : "未找到匹配日志"}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <article className="logs-panel__entry" key={entry.id}>
              <div className="logs-panel__entry-header">
                <div className="logs-panel__entry-meta">
                  <span className={`status-pill ${getLogLevelClass(entry.level)}`}>{getLogLevelLabel(entry.level)}</span>
                  <strong>{entry.scope}</strong>
                  {entry.source ? <span>{entry.source}</span> : null}
                </div>
                <span className="logs-panel__entry-time">{formatLogTime(entry.timestamp)}</span>
              </div>

              <p className="logs-panel__entry-message">{entry.message}</p>
              {entry.details ? <pre className="logs-panel__entry-details">{stringifyDetails(entry.details)}</pre> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
