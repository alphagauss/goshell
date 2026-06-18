import { useEffect, useState } from "react";
import { Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { portForwardApi, type PortForward } from "@/lib/wails";

type ForwardType = "local" | "remote";

interface ForwardFormState {
  type: ForwardType;
  bindAddr: string;
  bindPort: string;
  remoteHost: string;
  remotePort: string;
}

function createDefaultForm(type: ForwardType = "local"): ForwardFormState {
  return {
    type,
    bindAddr: type === "local" ? "127.0.0.1" : "0.0.0.0",
    bindPort: "8080",
    remoteHost: "127.0.0.1",
    remotePort: "80",
  };
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function parsePort(value: string, allowZero = false, label = "端口") {
  const port = Number(value);
  const min = allowZero ? 0 : 1;

  if (!Number.isInteger(port) || port < min || port > 65535) {
    throw new Error(`${label}无效`);
  }

  return port;
}

function getForwardTitle(item: PortForward) {
  return `${item.type === "remote" ? "远程" : "本地"} ${item.bindAddr}:${item.bindPort} -> ${item.remoteHost}:${item.remotePort}`;
}

function getForwardStatusText(item: PortForward) {
  if (item.status === "running") return "运行中";
  if (item.status === "error") return "错误";
  if (item.status === "stopped") return "已停止";
  return item.status || "未知";
}

export function PortForwardPanel({ connID }: { connID: string }) {
  const [items, setItems] = useState<PortForward[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [form, setForm] = useState<ForwardFormState>(() => createDefaultForm());
  const confirm = useConfirm();
  const toast = useToast();
  const portForwardLog = logger.scope("ssh.port-forward");

  async function load() {
    setLoading(true);
    try {
      const result = await portForwardApi.GetForwards(connID);
      setItems(Array.isArray(result) ? result : []);
      setStatus("");
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      portForwardLog.error("加载端口转发失败", { connID, error: message });
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(title: string, action: () => Promise<void>) {
    setStatus("");
    try {
      await action();
      await load();
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error(title, message);
      portForwardLog.error(title, { connID, error: message });
    }
  }

  async function save() {
    const editingForwardID = editingID;
    const actionLabel = editingForwardID ? "更新端口转发" : "添加端口转发";

    try {
      const bindAddr = form.bindAddr.trim();
      const remoteHost = form.remoteHost.trim();
      if (!bindAddr) {
        setStatus("请输入绑定地址");
        portForwardLog.warn("端口转发校验失败", { connID, reason: "empty-bind-addr" });
        return;
      }
      if (!remoteHost) {
        setStatus("请输入远程地址");
        portForwardLog.warn("端口转发校验失败", { connID, reason: "empty-remote-host" });
        return;
      }

      const bindPort = parsePort(form.bindPort, form.type === "local", "本地端口");
      const remotePort = parsePort(form.remotePort, false, "远程端口");

      await handleAction(actionLabel, async () => {
        if (editingForwardID) {
          await portForwardApi.RemoveForward(editingForwardID);
        }

        const result =
          form.type === "local"
            ? await portForwardApi.AddLocalForward(connID, bindAddr, bindPort, remoteHost, remotePort)
            : await portForwardApi.AddRemoteForward(connID, bindAddr, bindPort, remoteHost, remotePort);

        setEditingID(null);
        setForm(createDefaultForm());
        toast.success(actionLabel, result ? getForwardTitle(result) : `${bindAddr}:${bindPort} -> ${remoteHost}:${remotePort}`);
        portForwardLog.info("端口转发已保存", {
          connID,
          action: editingForwardID ? "update" : "create",
          type: form.type,
          bindAddr,
          bindPort,
          remoteHost,
          remotePort,
        });
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error(actionLabel, message);
      portForwardLog.error(actionLabel, { connID, error: message });
    }
  }

  function editForward(item: PortForward) {
    setEditingID(item.id);
    setForm({
      type: item.type === "remote" ? "remote" : "local",
      bindAddr: item.bindAddr,
      bindPort: String(item.bindPort),
      remoteHost: item.remoteHost,
      remotePort: String(item.remotePort),
    });
  }

  async function deleteForward(item: PortForward) {
    const confirmed = await confirm({
      title: "删除端口转发",
      description: `确定删除 ${getForwardTitle(item)} 吗？`,
      confirmText: "删除",
      cancelText: "取消",
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    await handleAction("删除端口转发", async () => {
      await portForwardApi.RemoveForward(item.id);
      if (editingID === item.id) {
        setEditingID(null);
        setForm(createDefaultForm());
      }
      toast.info("端口转发已删除", getForwardTitle(item));
      portForwardLog.warn("端口转发已删除", { connID, id: item.id, type: item.type, bindAddr: item.bindAddr });
    });
  }

  async function toggleForward(item: PortForward) {
    const nextAction = item.status === "running" ? "停止" : "启动";
    await handleAction(`${nextAction}端口转发`, async () => {
      if (item.status === "running") {
        await portForwardApi.StopForward(item.id);
      } else {
        await portForwardApi.StartForward(item.id);
      }
      toast.success(`端口转发已${nextAction}`, getForwardTitle(item));
      portForwardLog.info("端口转发状态已变更", {
        connID,
        id: item.id,
        action: item.status === "running" ? "stop" : "start",
        bindAddr: item.bindAddr,
        bindPort: item.bindPort,
      });
    });
  }

  useEffect(() => {
    setEditingID(null);
    setForm(createDefaultForm());
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [connID]);

  return (
    <section className="tool-panel ssh-panel port-forward-panel">
      <div className="panel-heading">
        <h2>端口转发</h2>
        <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="刷新" disabled={loading}>
          <RefreshCcw size={15} className={loading ? "is-spinning" : ""} />
        </Button>
      </div>

      <div className="forward-form">
        <select
          className="input-base"
          value={form.type}
          onChange={(event) => {
            const nextType = event.target.value === "remote" ? "remote" : "local";
            setForm((current) => ({
              ...current,
              type: nextType,
              bindAddr:
                current.bindAddr === "127.0.0.1" || current.bindAddr === "0.0.0.0"
                  ? nextType === "local"
                    ? "127.0.0.1"
                    : "0.0.0.0"
                  : current.bindAddr,
            }));
          }}
        >
          <option value="local">本地转发</option>
          <option value="remote">远程转发</option>
        </select>
        <input
          className="input-base"
          value={form.bindAddr}
          onChange={(event) => setForm((current) => ({ ...current, bindAddr: event.target.value }))}
          placeholder="绑定地址"
        />
        <input
          className="input-base"
          value={form.bindPort}
          inputMode="numeric"
          onChange={(event) => setForm((current) => ({ ...current, bindPort: event.target.value }))}
          placeholder="绑定端口"
        />
        <input
          className="input-base"
          value={form.remoteHost}
          onChange={(event) => setForm((current) => ({ ...current, remoteHost: event.target.value }))}
          placeholder="远程地址"
        />
        <input
          className="input-base"
          value={form.remotePort}
          inputMode="numeric"
          onChange={(event) => setForm((current) => ({ ...current, remotePort: event.target.value }))}
          placeholder="远程端口"
        />
        <Button variant="primary" size="sm" onClick={() => void save()} disabled={loading}>
          <Plus size={14} />
          {editingID ? "更新" : "添加"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditingID(null);
            setForm(createDefaultForm());
          }}
          disabled={loading && !editingID}
        >
          取消
        </Button>
      </div>

      <StatusLine tone="danger">{status}</StatusLine>

      <div className="forward-list">
        {items.length === 0 ? (
          <div className="empty-state">暂无端口转发</div>
        ) : (
          items.map((item) => (
            <article className={`forward-row ${item.status === "running" ? "is-running" : ""}`} key={item.id}>
              <div className="forward-row__meta">
                <div className="forward-row__title">
                  <strong>{getForwardTitle(item)}</strong>
                  <span>{item.id}</span>
                </div>
                {item.error ? <span className="forward-row__error">{item.error}</span> : null}
              </div>

              <div className="forward-row__stats">
                <span>
                  连接 {item.activeConns}/{item.totalConns}
                </span>
                <span>
                  流量 {formatBytes(item.bytesSent)} / {formatBytes(item.bytesRecv)}
                </span>
              </div>

              <div className="forward-row__actions">
                <span className={`status-pill status-pill--${item.status || "idle"}`}>{getForwardStatusText(item)}</span>
                <Button size="sm" variant="secondary" onClick={() => void toggleForward(item)}>
                  {item.status === "running" ? "停止" : "启动"}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => editForward(item)}>
                  <Pencil size={14} />
                  编辑
                </Button>
                <Button size="sm" variant="danger" onClick={() => void deleteForward(item)}>
                  <Trash2 size={14} />
                  删除
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
