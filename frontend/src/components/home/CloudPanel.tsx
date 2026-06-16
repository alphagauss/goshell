import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { cloudApi, configApi, type AppConfig, type ConnectionInfo } from "@/lib/wails";

export function CloudPanel({
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
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setServerUrl(config?.cloud?.serverUrl ?? "");
    setToken(config?.cloud?.token ?? "");
    void cloudApi.isConnected().then((value) => setConnected(Boolean(value))).catch(() => setConnected(false));
  }, [config]);

  async function saveConfig() {
    await configApi.set("cloud", "serverUrl", serverUrl);
    await configApi.set("cloud", "token", token);
    await onChanged();
  }

  async function connect() {
    setStatus("");
    try {
      await saveConfig();
      const addr = serverUrl.replace(/^https?:\/\//, "");
      const ok = await cloudApi.connect(addr, token);
      setConnected(Boolean(ok));
      setStatus(ok ? "已连接" : "连接失败");
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  async function disconnect() {
    setStatus("");
    try {
      await cloudApi.disconnect();
      setConnected(false);
      setStatus("已断开");
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  async function push() {
    setStatus("");
    try {
      await cloudApi.pushSync(connections);
      setStatus("已上传");
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  async function pull() {
    setStatus("");
    try {
      await cloudApi.pullSync();
      setStatus("已拉取");
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  return (
    <section className="tool-panel">
      <div className="panel-heading">
        <h2>云端</h2>
        <span className={`status-pill status-pill--${connected ? "connected" : "idle"}`}>
          {connected ? "在线" : "离线"}
        </span>
      </div>

      <div className="settings-form">
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
      </div>

      <StatusLine tone={status.includes("已") ? "success" : "danger"}>{status}</StatusLine>

      <div className="panel-actions">
        {connected ? (
          <Button variant="secondary" onClick={() => void disconnect()}>
            断开
          </Button>
        ) : (
          <Button variant="primary" onClick={() => void connect()}>
            连接
          </Button>
        )}
        <Button variant="secondary" onClick={() => void pull()}>
          拉取
        </Button>
        <Button variant="secondary" onClick={() => void push()}>
          上传
        </Button>
      </div>
    </section>
  );
}
