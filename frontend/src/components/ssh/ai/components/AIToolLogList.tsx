import { Button } from "@/components/ui/button";
import type { AIToolLogEntry } from "@/types";
import { formatAITimestamp } from "@/components/ssh/ai/utils";

export function AIToolLogList({
  entries,
  onClear,
}: {
  entries: AIToolLogEntry[];
  onClear: () => void;
}) {
  return (
    <section className="ai-section">
      <div className="ai-section__heading">
        <div>
          <h3>工具日志</h3>
          <p>记录 AI 的审核、执行和结果回传。</p>
        </div>
        <Button size="sm" variant="secondary" onClick={onClear} disabled={entries.length === 0}>
          清空日志
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state empty-state--compact">暂无工具日志</div>
      ) : (
        <div className="ai-tool-log-list">
          {entries.map((entry) => (
            <article className={`ai-tool-log-item ai-tool-log-item--${entry.status || "idle"}`} key={entry.id}>
              <div className="ai-tool-log-item__header">
                <div className="ai-tool-log-item__title">
                  <strong>{entry.tool}</strong>
                  <span>{entry.status || "idle"}</span>
                </div>
                <span className="ai-tool-log-item__time">{formatAITimestamp(entry.createdAt)}</span>
              </div>
              <pre className="ai-tool-log-item__command">{entry.command}</pre>
              {entry.result ? <pre className="ai-tool-log-item__result">{entry.result}</pre> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
