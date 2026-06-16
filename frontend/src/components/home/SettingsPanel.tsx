import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { configApi, sshApi, type AppConfig } from "@/lib/wails";

export function SettingsPanel({
  config,
  onChanged,
}: {
  config: AppConfig | null;
  onChanged: () => Promise<void> | void;
}) {
  const [status, setStatus] = useState("");

  async function setUI(key: string, value: unknown) {
    setStatus("");
    try {
      await configApi.set("ui", key, value);
      if (key === "theme") {
        document.documentElement.dataset.theme = String(value);
      }
      await onChanged();
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  async function clearPositions() {
    setStatus("");
    try {
      await sshApi.clearWindowPositions();
      setStatus("窗口位置已清除");
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  return (
    <section className="tool-panel">
      <div className="panel-heading">
        <h2>设置</h2>
      </div>

      <div className="settings-form">
        <label>
          主题
          <select
            className="input-base"
            value={config?.ui?.theme ?? "dark"}
            onChange={(event) => void setUI("theme", event.target.value)}
          >
            <option value="dark">深色</option>
            <option value="light">浅色</option>
          </select>
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={Boolean(config?.ui?.autoTray)}
            onChange={(event) => void setUI("autoTray", event.target.checked)}
          />
          <span>连接后隐藏主窗口</span>
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={config?.ui?.rememberPosition ?? true}
            onChange={(event) => void setUI("rememberPosition", event.target.checked)}
          />
          <span>记住窗口位置</span>
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={config?.ui?.autoShowHome ?? true}
            onChange={(event) => void setUI("autoShowHome", event.target.checked)}
          />
          <span>SSH 窗口关闭后显示主页</span>
        </label>
      </div>

      <StatusLine tone={status.includes("已") ? "success" : "danger"}>{status}</StatusLine>

      <div className="panel-actions">
        <Button variant="secondary" onClick={() => void clearPositions()}>
          清除窗口位置
        </Button>
      </div>
    </section>
  );
}
