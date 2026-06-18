import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { StatusLine } from "@/components/StatusLine";
import { CloudSettingsSection } from "@/components/home/CloudSettingsSection";
import { ImportExportSection } from "@/components/home/ImportExportSection";
import { extractErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { configApi, sshApi, type AppConfig, type ConnectionInfo } from "@/lib/wails";
import { useToast } from "@/components/ui/toast";

const terminalTypeOptions = [
  { value: "structured", label: "结构化终端" },
  { value: "classic", label: "经典终端" },
];

const terminalSwitchModeOptions = [
  { value: "prompt", label: "弹窗询问" },
  { value: "auto", label: "自动切换" },
  { value: "inline", label: "内联切换" },
];

const commandSendModeOptions = [
  { value: "enter", label: "回车发送" },
  { value: "button", label: "按钮发送" },
];

const groupBehaviorOptions = [
  { value: "prompt", label: "先询问" },
  { value: "join_default", label: "加入默认分组" },
  { value: "new_window", label: "新窗口" },
];

export function SettingsPanel({
  config,
  connections,
  onChanged,
}: {
  config: AppConfig | null;
  connections: ConnectionInfo[];
  onChanged: () => Promise<void> | void;
}) {
  const [status, setStatus] = useState("");
  const confirm = useConfirm();
  const toast = useToast();
  const settingsLog = logger.scope("home.settings");

  async function saveSetting(category: string, key: string, value: unknown) {
    try {
      await configApi.set(category, key, value);
      if (category === "ui" && key === "theme") {
        document.documentElement.dataset.theme = String(value);
      }
      await onChanged();
      settingsLog.info("配置已更新", { category, key, value });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("保存设置失败", message);
      settingsLog.error("配置保存失败", { category, key, value, error: message });
    }
  }

  async function setUI(key: string, value: unknown) {
    await saveSetting("ui", key, value);
  }

  async function clearPositions() {
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

    setStatus("");
    try {
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

  const statusTone = !status ? "muted" : status.includes("已") ? "success" : "danger";

  return (
    <section className="tool-panel settings-panel">
      <div className="panel-heading">
        <h2>设置</h2>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <div className="settings-section__heading">
            <h3>终端</h3>
            <p>控制新建终端的默认类型、字体和命令发送方式。</p>
          </div>
          <div className="settings-form">
            <label>
              默认终端类型
              <select
                className="input-base"
                value={config?.terminal?.defaultType ?? "structured"}
                onChange={(event) => void saveSetting("terminal", "defaultType", event.target.value)}
              >
                {terminalTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              交互式操作模式
              <select
                className="input-base"
                value={config?.terminal?.switchMode ?? "prompt"}
                onChange={(event) => void saveSetting("terminal", "switchMode", event.target.value)}
              >
                {terminalSwitchModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(config?.terminal?.autoSwitchClassic)}
                onChange={(event) => void saveSetting("terminal", "autoSwitchClassic", event.target.checked)}
              />
              <span>交互式操作自动切换到经典终端</span>
            </label>
            <label>
              终端字体大小
              <input
                className="input-base"
                type="number"
                min={10}
                max={32}
                value={config?.terminal?.fontSize ?? 13}
                onChange={(event) => void saveSetting("terminal", "fontSize", Number(event.target.value) || 13)}
              />
            </label>
            <label>
              命令发送方式
              <select
                className="input-base"
                value={config?.terminal?.commandSendMode ?? "enter"}
                onChange={(event) => void saveSetting("terminal", "commandSendMode", event.target.value)}
              >
                {commandSendModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(config?.terminal?.codeHighlight)}
                onChange={(event) => void saveSetting("terminal", "codeHighlight", event.target.checked)}
              />
              <span>经典终端代码高亮</span>
            </label>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__heading">
            <h3>快捷键</h3>
            <p>恢复源项目的全局快捷键开关和云同步快捷键。</p>
          </div>
          <div className="settings-form">
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(config?.shortcuts?.enabled)}
                onChange={(event) => void saveSetting("shortcuts", "enabled", event.target.checked)}
              />
              <span>启用快捷键</span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(config?.shortcuts?.switchTab)}
                onChange={(event) => void saveSetting("shortcuts", "switchTab", event.target.checked)}
              />
              <span>切换 SSH 标签</span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(config?.shortcuts?.saveGroup)}
                onChange={(event) => void saveSetting("shortcuts", "saveGroup", event.target.checked)}
              />
              <span>保存分组</span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(config?.shortcuts?.cloudUpload)}
                onChange={(event) => void saveSetting("shortcuts", "cloudUpload", event.target.checked)}
              />
              <span>云端上传</span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(config?.shortcuts?.cloudDownload)}
                onChange={(event) => void saveSetting("shortcuts", "cloudDownload", event.target.checked)}
              />
              <span>云端下载</span>
            </label>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__heading">
            <h3>高级</h3>
            <p>控制多个连接窗口时的默认分组行为。</p>
          </div>
          <div className="settings-form">
            <label>
              多连接分组行为
              <select
                className="input-base"
                value={config?.advanced?.groupBehavior ?? "prompt"}
                onChange={(event) => void saveSetting("advanced", "groupBehavior", event.target.value)}
              >
                {groupBehaviorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__heading">
            <h3>窗口</h3>
            <p>主题、托盘和窗口位置管理。</p>
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
          <div className="panel-actions">
            <Button variant="secondary" onClick={() => void clearPositions()}>
              清除窗口位置
            </Button>
          </div>
        </section>

        <CloudSettingsSection config={config} connections={connections} onChanged={onChanged} />
        <ImportExportSection config={config} onChanged={onChanged} />
      </div>

      <StatusLine tone={statusTone}>{status}</StatusLine>
    </section>
  );
}
