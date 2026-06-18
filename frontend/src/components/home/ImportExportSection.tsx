import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { configApi, type AppConfig } from "@/lib/wails";
import { useToast } from "@/components/ui/toast";

function isAppConfig(value: unknown): value is AppConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.terminal === "object" &&
    typeof candidate.ui === "object" &&
    typeof candidate.cloud === "object" &&
    typeof candidate.shortcuts === "object" &&
    typeof candidate.advanced === "object"
  );
}

export function ImportExportSection({
  config,
  onChanged,
}: {
  config: AppConfig | null;
  onChanged: () => Promise<void> | void;
}) {
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const confirm = useConfirm();
  const toast = useToast();
  const settingsLog = logger.scope("home.settings.import-export");

  async function exportConfig() {
    setStatus("");
    try {
      const nextConfig = config ?? (await configApi.getConfig());
      const blob = new Blob([JSON.stringify(nextConfig, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "goshell-config.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("已导出");
      toast.success("配置已导出");
      settingsLog.info("配置已导出");
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("导出配置失败", message);
      settingsLog.error("导出配置失败", { error: message });
    }
  }

  async function importConfig(file: File) {
    const confirmed = await confirm({
      title: "导入配置",
      description: "导入会覆盖当前配置，确定继续吗？",
      confirmText: "导入",
      cancelText: "取消",
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    setStatus("");
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      if (!isAppConfig(parsed)) {
        throw new Error("配置文件结构不正确");
      }

      await configApi.setConfig(parsed);
      await onChanged();
      setStatus("已导入");
      toast.success("配置已导入");
      settingsLog.warn("配置已导入", { fileName: file.name });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("导入配置失败", message);
      settingsLog.error("导入配置失败", { fileName: file.name, error: message });
    }
  }

  const statusTone = !status ? "muted" : status.includes("已") ? "success" : "danger";

  return (
    <section className="settings-section">
      <div className="settings-section__heading">
        <h3>导入 / 导出</h3>
        <p>导出当前配置，或从 JSON 文件导入覆盖现有配置。</p>
      </div>
      <StatusLine tone={statusTone}>{status}</StatusLine>
      <div className="panel-actions">
        <Button variant="secondary" onClick={() => void exportConfig()}>
          导出配置
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          导入配置
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) {
            void importConfig(file);
          }
        }}
      />
    </section>
  );
}
