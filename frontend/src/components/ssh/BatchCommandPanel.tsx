import { useEffect, useRef, useState } from "react";
import { CheckSquare, Play, RefreshCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { sshApi, type CommandResult, type ConnectionInfo } from "@/lib/wails";
import { useSSHConnectionsStore } from "@/stores/sshConnectionsStore";

type BatchCommandStatus = "running" | "success" | "error";

interface BatchCommandResult {
  connID: string;
  name: string;
  summary: string;
  status: BatchCommandStatus;
  output: string;
}

function getConnectionTitle(connection: ConnectionInfo) {
  return connection.name || connection.host || connection.id;
}

function getConnectionSummary(connection: ConnectionInfo) {
  return `${connection.username}@${connection.host}:${connection.port}`;
}

function formatCommandResult(result: CommandResult | string | null) {
  if (typeof result === "string") {
    return result.trim();
  }

  if (!result) {
    return "";
  }

  const parts = [result.stdout?.trim(), result.stderr?.trim()].filter(Boolean);
  if (parts.length > 0) {
    return parts.join("\n").trim();
  }

  if (typeof result.exitCode === "number" && result.success === false) {
    return `exit code: ${result.exitCode}`;
  }

  return "";
}

export function BatchCommandPanel({ connID }: { connID: string }) {
  const { connections, loading } = useSSHConnectionsStore();
  const [command, setCommand] = useState("uname -a");
  const [selectedConnIDs, setSelectedConnIDs] = useState<string[]>([]);
  const [results, setResults] = useState<BatchCommandResult[]>([]);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"muted" | "success" | "danger" | "warning">("muted");
  const [running, setRunning] = useState(false);
  const initializedSelectionRef = useRef(false);
  const batchLog = logger.scope("ssh.batch-command");

  const selectedConnections = connections.filter((connection) => selectedConnIDs.includes(connection.id));

  useEffect(() => {
    if (loading) {
      return;
    }

    const knownIDs = new Set(connections.map((connection) => connection.id));

    setSelectedConnIDs((current) => {
      if (!initializedSelectionRef.current && connID && knownIDs.has(connID)) {
        initializedSelectionRef.current = true;
        return [connID];
      }

      const next = current.filter((id) => knownIDs.has(id));
      return next.length === current.length ? current : next;
    });

    setResults((current) => {
      const next = current.filter((item) => knownIDs.has(item.connID));
      return next.length === current.length ? current : next;
    });
  }, [connID, connections, loading]);

  function updateResult(connID: string, nextStatus: BatchCommandStatus, output: string) {
    setResults((current) =>
      current.map((item) => (item.connID === connID ? { ...item, status: nextStatus, output } : item)),
    );
  }

  function selectAll() {
    setSelectedConnIDs(connections.map((connection) => connection.id));
  }

  function clearSelection() {
    setSelectedConnIDs([]);
  }

  async function run() {
    const commandText = command.trim();
    if (!commandText) {
      setStatusTone("danger");
      setStatus("请先输入命令");
      batchLog.warn("批量命令校验失败", { connID, reason: "empty-command" });
      return;
    }

    if (selectedConnections.length === 0) {
      setStatusTone("danger");
      setStatus("请先选择至少一个连接");
      batchLog.warn("批量命令校验失败", { connID, reason: "no-selection" });
      return;
    }

    setRunning(true);
    setStatusTone("warning");
    setStatus(`正在执行 ${selectedConnections.length} 个连接`);
    batchLog.info("批量命令开始执行", {
      connID,
      command: commandText,
      count: selectedConnections.length,
      targets: selectedConnections.map((connection) => connection.id),
    });
    setResults(
      selectedConnections.map((connection) => ({
        connID: connection.id,
        name: getConnectionTitle(connection),
        summary: getConnectionSummary(connection),
        status: "running",
        output: "",
      })),
    );

    try {
      const settled = await Promise.all(
        selectedConnections.map(async (connection) => {
          try {
            const result = await sshApi.executeCommand(connection.id, commandText);
            const output = formatCommandResult(result) || "无输出";
            updateResult(connection.id, "success", output);
            return { connID: connection.id, success: true };
          } catch (error) {
            const output = extractErrorMessage(error);
            updateResult(connection.id, "error", output);
            return { connID: connection.id, success: false };
          }
        }),
      );

      const failureCount = settled.filter((item) => !item.success).length;
      setStatusTone(failureCount > 0 ? "warning" : "success");
      setStatus(
        failureCount > 0
          ? `已完成 ${selectedConnections.length} 个连接，${failureCount} 个失败`
          : `已完成 ${selectedConnections.length} 个连接`,
      );
      batchLog[failureCount > 0 ? "warn" : "info"]("批量命令执行完成", {
        connID,
        command: commandText,
        count: selectedConnections.length,
        failures: failureCount,
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="tool-panel ssh-panel batch-command-panel">
      <div className="panel-heading">
        <h2>批量命令</h2>
        <span className="status-pill">
          {selectedConnections.length}/{connections.length}
        </span>
      </div>

      <textarea
        className="input-base command-input batch-command-panel__command"
        value={command}
        onChange={(event) => setCommand(event.target.value)}
        placeholder="输入命令，批量发送到所选连接"
      />

      <div className="batch-command-panel__toolbar">
        <div className="batch-command-panel__toolbar-group">
          <Button variant="secondary" size="sm" onClick={selectAll} disabled={connections.length === 0}>
            <CheckSquare size={14} />
            全选
          </Button>
          <Button variant="secondary" size="sm" onClick={clearSelection} disabled={selectedConnIDs.length === 0}>
            <Square size={14} />
            清空
          </Button>
        </div>

        <Button
          variant="primary"
          onClick={() => void run()}
          disabled={running || selectedConnections.length === 0 || !command.trim()}
        >
          {running ? <RefreshCcw size={15} className="is-spinning" /> : <Play size={15} />}
          执行
        </Button>
      </div>

      <StatusLine tone={statusTone}>{status}</StatusLine>

      <div className="batch-command-panel__selection">
        <div className="batch-command-panel__selection-heading">
          <h3>选择连接</h3>
          <span>{selectedConnIDs.length} 个已选</span>
        </div>

        <div className="batch-command-panel__connection-list">
          {loading && connections.length === 0 ? (
            <div className="empty-state empty-state--compact">正在加载连接</div>
          ) : connections.length === 0 ? (
            <div className="empty-state empty-state--compact">暂无连接</div>
          ) : (
            connections.map((connection) => {
              const selected = selectedConnIDs.includes(connection.id);

              return (
                <label
                  className={`batch-command-panel__connection ${selected ? "is-selected" : ""}`}
                  key={connection.id}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(event) => {
                      setSelectedConnIDs((current) =>
                        event.target.checked
                          ? current.includes(connection.id)
                            ? current
                            : [...current, connection.id]
                          : current.filter((id) => id !== connection.id),
                      );
                    }}
                  />

                  <div className="batch-command-panel__connection-info">
                    <strong>{getConnectionTitle(connection)}</strong>
                    <span>{getConnectionSummary(connection)}</span>
                  </div>

                  <span className={`status-pill status-pill--${connection.status || "idle"}`}>
                    {connection.status === "connected" ? "在线" : connection.status || "离线"}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div className="batch-command-panel__results">
        <div className="batch-command-panel__results-heading">
          <h3>执行结果</h3>
          <span>{results.length} 条</span>
        </div>

        {results.length === 0 ? (
          <div className="empty-state empty-state--compact">执行结果会显示在这里</div>
        ) : (
          results.map((result) => (
            <article className={`batch-command-panel__result is-${result.status}`} key={result.connID}>
              <div className="batch-command-panel__result-header">
                <div className="batch-command-panel__result-info">
                  <strong>{result.name}</strong>
                  <span>{result.summary}</span>
                </div>
                <span className={`status-pill status-pill--${result.status}`}>{result.status}</span>
              </div>
              <pre className="batch-command-panel__output">{result.output}</pre>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
