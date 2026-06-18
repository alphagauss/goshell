import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { configApi, sshApi, type AppConfig } from "@/lib/wails";

export function SettingsPanel({
  config,
  onChanged,
}: {
  config: AppConfig | null;
  onChanged: () => Promise<void> | void;
}) {
  const [status, setStatus] = useState("");
  const confirm = useConfirm();
  const toast = useToast();
  const settingsLog = logger.scope("home.settings");

  async function setUI(key: string, value: unknown) {
    setStatus("");
    try {
      await configApi.set("ui", key, value);
      if (key === "theme") {
        document.documentElement.dataset.theme = String(value);
      }
      await onChanged();
      settingsLog.info("UI 设置已更新", { key, value });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("保存设置失败", message);
      settingsLog.error("UI 设置保存失败", { key, value, error: message });
    }
  }

  async function clearPositions() {
    setStatus("");
    try {
      const confirmed = await confirm({
        title: "清除窗口位置",
        description: "确定清除所有窗口位置记录吗？下次打开窗口时将重新计算位置。",
        confirmText: "清除",
        cancelText: "取消",
        danger: true,
      });
      if (!confirmed) {
        return;
      }

      await sshApi.clearWindowPositions();
      setStatus("窗口位置已清除");
      toast.success("窗口位置已清除");
      settingsLog.warn("窗口位置已清除");
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("清除窗口位置失败", message);
      settingsLog.error("清除窗口位置失败", { error: message });
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
