import { useEffect, useState } from "react";
import { Activity, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { sshApi, type ProcessInfo, type SystemStats } from "@/lib/wails";

function formatPercent(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "-";
  }
  return `${number.toFixed(1)}%`;
}

function formatBytes(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return "-";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = number;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  const precision = index === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[index]}`;
}

function formatLoad(stats: SystemStats | null) {
  const load1 = stats?.loadAvg?.load1 ?? stats?.load?.load1;
  const load5 = stats?.loadAvg?.load5 ?? stats?.load?.load5;
  const load15 = stats?.loadAvg?.load15 ?? stats?.load?.load15;
  const values = [load1, load5, load15]
    .map((value) => (typeof value === "number" ? value.toFixed(2) : "-"))
    .join(" / ");
  return values;
}

export function MonitorPanel({ connID }: { connID: string }) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!connID) return;
    setLoading(true);
    setStatus("");
    try {
      const [nextStats, nextProcesses] = await Promise.all([
        sshApi.getSystemStats(connID),
        sshApi.getProcessList(connID),
      ]);
      setStats(nextStats ?? null);
      setProcesses(Array.isArray(nextProcesses) ? nextProcesses.slice(0, 20) : []);
    } catch (err) {
      setStatus(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [connID]);

  const diskPartitions = stats?.disk?.partitions ?? [];
  const networkInterfaces = stats?.network?.interfaces ?? [];

  return (
    <section className="tool-panel ssh-panel monitor-panel">
      <div className="panel-heading">
        <h2>监控</h2>
        <div className="monitor-panel__actions">
          <span className="status-pill">{stats?.uptime ?? "暂无数据"}</span>
          <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="刷新" disabled={loading}>
            <RefreshCcw size={15} className={loading ? "is-spinning" : ""} />
          </Button>
        </div>
      </div>

      <StatusLine tone="danger">{status}</StatusLine>

      <div className="metric-grid monitor-panel__metrics">
        <Metric label="CPU 使用率" value={formatPercent(stats?.cpu?.usagePercent ?? stats?.cpu?.usage)} />
        <Metric
          label="内存使用"
          value={`${formatPercent(stats?.memory?.usedPercent ?? stats?.memory?.percent)} · ${formatBytes(stats?.memory?.used)} / ${formatBytes(stats?.memory?.total)}`}
        />
        <Metric label="平均负载" value={formatLoad(stats)} />
        <Metric label="CPU 核心" value={stats?.cpu?.cores ?? "-"} />
        <Metric label="磁盘分区" value={diskPartitions.length} />
        <Metric label="网络接口" value={networkInterfaces.length} />
      </div>

      <div className="monitor-grid">
        <section className="monitor-section">
          <div className="monitor-section__heading">
            <h3>磁盘</h3>
            <span>{diskPartitions.length} 个分区</span>
          </div>

          {diskPartitions.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <Activity size={24} />
            </div>
          ) : (
            <div className="monitor-list">
              {diskPartitions.map((partition) => (
                <div className="monitor-row" key={`${partition.mountpoint || partition.device}-${partition.fstype}`}>
                  <div className="monitor-row__meta">
                    <strong>{partition.mountpoint || partition.device || "unknown"}</strong>
                    <span>{partition.fstype || "-"}</span>
                  </div>
                  <span>{formatBytes(partition.used)} / {formatBytes(partition.total)}</span>
                  <span>{formatPercent(partition.usedPercent)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="monitor-section">
          <div className="monitor-section__heading">
            <h3>网络</h3>
            <span>{networkInterfaces.length} 个接口</span>
          </div>

          {networkInterfaces.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <Activity size={24} />
            </div>
          ) : (
            <div className="monitor-list">
              {networkInterfaces.map((network, index) => (
                <div className="monitor-row" key={network.name || network.address || `network-${index}`}>
                  <div className="monitor-row__meta">
                    <strong>{network.name || "unknown"}</strong>
                    <span>{network.address || (network.addresses || []).join(", ") || "-"}</span>
                  </div>
                  <span>{formatBytes(network.rxBytes)}</span>
                  <span>{formatBytes(network.txBytes)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="monitor-section monitor-section--wide">
          <div className="monitor-section__heading">
            <h3>进程</h3>
            <span>{processes.length} 条</span>
          </div>

          {processes.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <Activity size={24} />
            </div>
          ) : (
            <div className="monitor-process-list">
              {processes.map((process) => (
                <div className="monitor-process-row" key={`${process.pid}-${process.name}`}>
                  <div className="monitor-process-row__meta">
                    <strong>{process.name || process.cmdline}</strong>
                    <span>{process.cmdline}</span>
                  </div>
                  <span>{process.pid}</span>
                  <span>{formatPercent(process.cpuPercent ?? process.cpu)}</span>
                  <span>{formatPercent(process.memPercent ?? process.mem)}</span>
                  <span>{process.status || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{String(value)}</strong>
    </div>
  );
}
