import { useEffect, useState } from "react";
import { Activity, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { sshApi } from "@/lib/wails";

export function MonitorPanel({ connID }: { connID: string }) {
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [processes, setProcesses] = useState<Array<Record<string, any>>>([]);
  const [status, setStatus] = useState("");

  async function load() {
    if (!connID) return;
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
    }
  }

  useEffect(() => {
    void load();
  }, [connID]);

  return (
    <section className="tool-panel ssh-panel">
      <div className="panel-heading">
        <h2>监控</h2>
        <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="刷新">
          <RefreshCcw size={15} />
        </Button>
      </div>
      <StatusLine tone="danger">{status}</StatusLine>
      <div className="metric-grid">
        <Metric label="CPU" value={stats?.cpu?.usagePercent ?? stats?.cpu?.usage ?? "-"} />
        <Metric label="内存" value={stats?.memory?.usedPercent ?? stats?.memory?.percent ?? "-"} />
        <Metric label="负载" value={stats?.loadAvg?.load1 ?? stats?.load?.load1 ?? "-"} />
      </div>
      <div className="process-list">
        {processes.length === 0 ? (
          <div className="empty-state">
            <Activity size={24} />
          </div>
        ) : (
          processes.map((process) => (
            <div className="process-row" key={`${process.pid}-${process.name}`}>
              <span>{process.pid}</span>
              <strong>{process.name || process.command || process.cmdline}</strong>
              <span>{process.cpuPercent ?? process.cpu ?? "-"}</span>
              <span>{process.memoryPercent ?? process.mem ?? "-"}</span>
            </div>
          ))
        )}
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
