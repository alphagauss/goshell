import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { cloudApi, configApi, type AppConfig, type ConnectionInfo } from "@/lib/wails";
import { useToast } from "@/components/ui/toast";

export function CloudSettingsSection({
  config,
  connections,
  onChanged,
}: {
  config: AppConfig | null;
  connections: ConnectionInfo[];
  onChanged: () => Promise<void> | void;
}) {
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(60);
  const [autoSyncTo, setAutoSyncTo] = useState(false);
  const [autoSyncFrom, setAutoSyncFrom] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const cloudLog = logger.scope("home.cloud-settings");

  useEffect(() => {
    setServerUrl(config?.cloud?.serverUrl ?? "");
    setToken(config?.cloud?.token ?? "");
    setEnabled(Boolean(config?.cloud?.enabled));
    setSyncInterval(config?.cloud?.syncInterval ?? 60);
    setAutoSyncTo(Boolean(config?.cloud?.autoSyncTo));
    setAutoSyncFrom(Boolean(config?.cloud?.autoSyncFrom));
    void cloudApi.isConnected().then((value) => setConnected(Boolean(value))).catch(() => setConnected(false));
  }, [config]);

  async function saveCloudConfig() {
    await configApi.set("cloud", "enabled", enabled);
    await configApi.set("cloud", "serverUrl", serverUrl);
    await configApi.set("cloud", "token", token);
    await configApi.set("cloud", "syncInterval", Number(syncInterval) || 0);
    await configApi.set("cloud", "autoSyncTo", autoSyncTo);
    await configApi.set("cloud", "autoSyncFrom", autoSyncFrom);
    await onChanged();
  }

  async function connect() {
    setStatus("");
    setBusy(true);
    try {
      await saveCloudConfig();
      const addr = serverUrl.replace(/^https?:\/\//, "");
      const ok = await cloudApi.connect(addr, token);
      setConnected(Boolean(ok));
      setStatus(ok ? "已连接" : "连接失败");
      if (ok) {
        toast.success("云端已连接");
        cloudLog.info("云端已连接", { serverUrl, enabled, syncInterval });
      } else {
        toast.error("云端连接失败");
        cloudLog.warn("云端连接失败", { serverUrl, enabled, syncInterval });
      }
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("云端连接失败", message);
      cloudLog.error("云端连接失败", { serverUrl, enabled, syncInterval, error: message });
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setStatus("");
    setBusy(true);
    try {
      await cloudApi.disconnect();
      setConnected(false);
      setStatus("已断开");
      toast.info("云端已断开");
      cloudLog.info("云端已断开", { serverUrl, enabled, syncInterval });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("断开云端失败", message);
      cloudLog.error("断开云端失败", { serverUrl, enabled, syncInterval, error: message });
    } finally {
      setBusy(false);
    }
  }

  async function push() {
    setStatus("");
    setBusy(true);
    try {
      await saveCloudConfig();
      await cloudApi.pushSync(connections);
      setStatus("已上传");
      toast.success("已上传到云端");
      cloudLog.info("上传到云端", { connectionCount: connections.length, enabled, syncInterval });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("上传云端失败", message);
      cloudLog.error("上传云端失败", { connectionCount: connections.length, enabled, syncInterval, error: message });
    } finally {
      setBusy(false);
    }
  }

  async function pull() {
    setStatus("");
    setBusy(true);
    try {
      await saveCloudConfig();
      await cloudApi.pullSync();
      setStatus("已拉取");
      toast.success("已从云端拉取");
      cloudLog.info("从云端拉取", { enabled, syncInterval });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("拉取云端失败", message);
      cloudLog.error("拉取云端失败", { enabled, syncInterval, error: message });
    } finally {
      setBusy(false);
    }
  }

  const statusTone = !status ? "muted" : status.includes("已") ? "success" : "danger";

  return (
    <section className="settings-section">
      <div className="settings-section__heading">
        <h3>私有云端</h3>
        <span className={`status-pill status-pill--${connected ? "connected" : "idle"}`}>
          {connected ? "在线" : "离线"}
        </span>
      </div>
      <div className="settings-form">
        <label className="check-row">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          <span>启用私有云端同步</span>
        </label>
        <label>
          服务地址
          <input
            className="input-base"
            value={serverUrl}
            onChange={(event) => setServerUrl(event.target.value)}
            placeholder="https://example.com"
          />
        </label>
        <label>
          Token
          <input
            className="input-base"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            type="password"
          />
        </label>
        <label>
          同步间隔（秒）
          <input
            className="input-base"
            type="number"
            min={0}
            value={syncInterval}
            onChange={(event) => setSyncInterval(Number(event.target.value) || 0)}
          />
        </label>
        <label className="check-row">
          <input type="checkbox" checked={autoSyncTo} onChange={(event) => setAutoSyncTo(event.target.checked)} />
          <span>自动上传到云端</span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={autoSyncFrom} onChange={(event) => setAutoSyncFrom(event.target.checked)} />
          <span>自动从云端下载</span>
        </label>
      </div>
      <StatusLine tone={statusTone}>{status}</StatusLine>
      <div className="panel-actions">
        <Button disabled={busy} variant="secondary" onClick={() => void saveCloudConfig()}>
          保存
        </Button>
        {connected ? (
          <Button disabled={busy} variant="secondary" onClick={() => void disconnect()}>
            断开
          </Button>
        ) : (
          <Button disabled={busy} variant="primary" onClick={() => void connect()}>
            连接
          </Button>
        )}
        <Button disabled={busy} variant="secondary" onClick={() => void pull()}>
          拉取
        </Button>
        <Button disabled={busy} variant="secondary" onClick={() => void push()}>
          上传
        </Button>
      </div>
    </section>
  );
}
