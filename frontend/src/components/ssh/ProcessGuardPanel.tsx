import { useEffect, useRef, useState } from "react";
import { Eye, Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { processGuardianApi, type GuardianProcess } from "@/lib/wails";

interface GuardianFormState {
  name: string;
  command: string;
  workDir: string;
  autoRestart: boolean;
}

function createDefaultGuardianForm(): GuardianFormState {
  return {
    name: "",
    command: "",
    workDir: "/tmp",
    autoRestart: true,
  };
}

export function ProcessGuardPanel({ connID }: { connID: string }) {
  const [items, setItems] = useState<GuardianProcess[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [guardianStats, setGuardianStats] = useState<Record<string, unknown> | null>(null);
  const [guardianLogs, setGuardianLogs] = useState("");
  const [form, setForm] = useState<GuardianFormState>(() => createDefaultGuardianForm());
  const confirm = useConfirm();
  const toast = useToast();
  const selectedNameRef = useRef("");

  async function load() {
    if (!connID) return;
    setLoading(true);
    try {
      const result = await processGuardianApi.GetGuardians(connID);
      const nextItems = Array.isArray(result) ? result : [];
      setItems(nextItems);
      setStatus("");
      if (selectedNameRef.current && !nextItems.some((item) => item.name === selectedNameRef.current)) {
        setSelectedName("");
        setGuardianStats(null);
        setGuardianLogs("");
      }
    } catch (err) {
      setStatus(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(name: string) {
    setSelectedName(name);
    setDetailLoading(true);
    setStatus("");
    try {
      const [stats, logs] = await Promise.all([
        processGuardianApi.GetGuardianStats(connID, name),
        processGuardianApi.GetGuardianLogs(connID, name, 80),
      ]);
      setGuardianStats(stats ?? null);
      setGuardianLogs(logs || "");
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("加载守护进程详情", message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function createGuardian() {
    const name = form.name.trim();
    const command = form.command.trim();
    const workDir = form.workDir.trim() || "/tmp";

    if (!name || !command) {
      setStatus("请输入守护进程名称和命令");
      return;
    }

    setStatus("");
    try {
      await processGuardianApi.CreateGuardian(connID, name, command, workDir, form.autoRestart);
      toast.success("守护进程已创建", name);
      setForm(createDefaultGuardianForm());
      await load();
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("创建守护进程", message);
    }
  }

  async function action(name: string, kind: "start" | "stop" | "restart") {
    setStatus("");
    try {
      if (kind === "start") await processGuardianApi.StartGuardian(connID, name);
      if (kind === "stop") await processGuardianApi.StopGuardian(connID, name);
      if (kind === "restart") await processGuardianApi.RestartGuardian(connID, name);
      toast.success(`守护进程已${kind === "start" ? "启动" : kind === "stop" ? "停止" : "重启"}`, name);
      await load();
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error(`守护进程${kind === "start" ? "启动" : kind === "stop" ? "停止" : "重启"}失败`, message);
    }
  }

  async function remove(name: string) {
    const confirmed = await confirm({
      title: "删除守护进程",
      description: `确定删除 ${name} 吗？`,
      confirmText: "删除",
      cancelText: "取消",
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    setStatus("");
    try {
      await processGuardianApi.DeleteGuardian(connID, name);
      if (selectedName === name) {
        setSelectedName("");
        setGuardianStats(null);
        setGuardianLogs("");
      }
      toast.info("守护进程已删除", name);
      await load();
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("删除守护进程", message);
    }
  }

  useEffect(() => {
    selectedNameRef.current = selectedName;
  }, [selectedName]);

  useEffect(() => {
    setSelectedName("");
    setGuardianStats(null);
    setGuardianLogs("");
    setForm(createDefaultGuardianForm());
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [connID]);

  return (
    <section className="tool-panel ssh-panel guard-panel">
      <div className="panel-heading">
        <h2>进程守护</h2>
        <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="刷新" disabled={loading}>
          <RefreshCcw size={15} className={loading ? "is-spinning" : ""} />
        </Button>
      </div>

      <div className="guard-create-form">
        <div className="guard-create-form__heading">
          <h3>创建守护进程</h3>
          <span>systemd service</span>
        </div>
        <div className="guardian-form">
          <input
            className="input-base"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="名称"
          />
          <input
            className="input-base"
            value={form.command}
            onChange={(event) => setForm((current) => ({ ...current, command: event.target.value }))}
            placeholder="命令"
          />
          <input
            className="input-base"
            value={form.workDir}
            onChange={(event) => setForm((current) => ({ ...current, workDir: event.target.value }))}
            placeholder="工作目录"
          />
          <label className="guard-create-form__check">
            <input
              type="checkbox"
              checked={form.autoRestart}
              onChange={(event) => setForm((current) => ({ ...current, autoRestart: event.target.checked }))}
            />
            自动重启
          </label>
          <Button variant="primary" size="sm" onClick={() => void createGuardian()} disabled={loading}>
            <Plus size={14} />
            创建
          </Button>
        </div>
      </div>

      <StatusLine tone="danger">{status}</StatusLine>

      <div className="guardian-list">
        {items.length === 0 ? (
          <div className="empty-state">暂无守护进程</div>
        ) : (
          items.map((item) => (
            <div className={`guardian-row ${selectedName === item.name ? "is-selected" : ""}`} key={item.name}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.command}</span>
                <span>
                  PID {item.pid || "-"} · 重启 {item.restarts ?? 0} · {item.autoRestart ? "自动重启" : "不自动重启"}
                </span>
              </div>
              <span className={`status-pill status-pill--${item.status}`}>{item.status}</span>
              <div className="row-actions guardian-row__actions">
                <Button size="sm" variant="secondary" onClick={() => void loadDetails(item.name)} disabled={detailLoading}>
                  <Eye size={14} />
                  详情
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void action(item.name, "start")}>
                  启动
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void action(item.name, "stop")}>
                  停止
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void action(item.name, "restart")}>
                  重启
                </Button>
                <Button size="sm" variant="danger" onClick={() => void remove(item.name)}>
                  删除
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="guardian-detail">
        <div className="guardian-detail__heading">
          <h3>详情</h3>
          <span>{selectedName || "未选择"}</span>
        </div>

        {selectedName ? (
          <>
            <div className="metric-grid">
              <Metric label="状态" value={String(guardianStats?.status ?? "-")} />
              <Metric label="PID" value={String(guardianStats?.pid ?? "-")} />
              <Metric label="重启次数" value={String(guardianStats?.restarts ?? "-")} />
              <Metric label="运行时长" value={String(guardianStats?.uptime ?? "-")} />
              <Metric label="内存" value={String(guardianStats?.memory ?? "-")} />
            </div>
            <pre className="guardian-detail__logs">{detailLoading ? "正在加载..." : guardianLogs || "暂无日志"}</pre>
          </>
        ) : (
          <div className="empty-state empty-state--compact">点击“详情”查看统计和日志</div>
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
