import { useMemo, useState } from "react";
import { KeyRound, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { configApi, eventsApi, sshApi, type AppConfig, type SSHConfig, type SSHGroup } from "@/lib/wails";

const emptyForm: SSHConfig & { authType: "password" | "key"; target: "default" | "new" } = {
  name: "",
  host: "",
  port: 22,
  username: "",
  password: "",
  privateKey: "",
  timeout: 30,
  authType: "password",
  target: "default",
};

export function ConnectionForm({
  config,
  onChanged,
}: {
  config: AppConfig | null;
  onChanged: () => Promise<void> | void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<{ tone: "muted" | "success" | "danger"; text: string }>({
    tone: "muted",
    text: "",
  });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const connectionLog = logger.scope("home.connection-form");

  const connectConfig = useMemo<SSHConfig>(
    () => ({
      name: form.name.trim() || `${form.username}@${form.host}`,
      host: form.host.trim(),
      port: Number(form.port) || 22,
      username: form.username.trim(),
      password: form.authType === "password" ? form.password : undefined,
      privateKey: form.authType === "key" ? form.privateKey : undefined,
      timeout: Number(form.timeout) || 30,
    }),
    [form],
  );

  async function pickGroup(groups: SSHGroup[]) {
    if (form.target === "new") {
      return sshApi.createGroup(connectConfig.name);
    }

    const hasActiveGroup = groups.some((group) => (group?.conn_ids?.length ?? 0) > 0);
    if (!hasActiveGroup) {
      return sshApi.getDefaultGroupID();
    }

    if (config?.advanced?.groupBehavior === "new_window") {
      return sshApi.createGroup(connectConfig.name);
    }

    return sshApi.getDefaultGroupID();
  }

  function validate() {
    if (!connectConfig.host) return "请输入主机";
    if (!connectConfig.username) return "请输入用户";
    if (connectConfig.port < 1 || connectConfig.port > 65535) return "端口必须在 1-65535 之间";
    if (form.authType === "password" && !connectConfig.password) return "请输入密码";
    if (form.authType === "key" && !connectConfig.privateKey) return "请输入私钥";
    return "";
  }

  async function testConnection() {
    const error = validate();
    if (error) {
      setStatus({ tone: "danger", text: error });
      toast.warning("连接测试未通过", error);
      connectionLog.warn("连接测试校验失败", {
        host: connectConfig.host,
        username: connectConfig.username,
        error,
      });
      return;
    }

    setBusy(true);
    try {
      await sshApi.testConnection(connectConfig);
      setStatus({ tone: "success", text: "连接测试成功" });
      toast.success("连接测试成功");
      connectionLog.info("连接测试成功", {
        host: connectConfig.host,
        port: connectConfig.port,
        username: connectConfig.username,
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus({ tone: "danger", text: message });
      toast.error("连接测试失败", message);
      connectionLog.error("连接测试失败", {
        host: connectConfig.host,
        port: connectConfig.port,
        username: connectConfig.username,
        error: message,
      });
    } finally {
      setBusy(false);
    }
  }

  async function connect() {
    const error = validate();
    if (error) {
      setStatus({ tone: "danger", text: error });
      toast.warning("连接未发起", error);
      connectionLog.warn("连接校验失败", {
        host: connectConfig.host,
        username: connectConfig.username,
        error,
      });
      return;
    }

    setBusy(true);
    try {
      const groups = (await sshApi.getAllGroups()) as SSHGroup[];
      const groupID = await pickGroup(groups);
      const result = (await sshApi.createAndConnectWithGroup(connectConfig, groupID)) as {
        connID?: string;
        groupID?: string;
      };

      await onChanged();
      await sshApi.openSSHWindow(result.groupID ?? groupID, connectConfig.name, result.connID ?? "");

      if (config?.ui?.autoTray) {
        eventsApi.emit("ssh:tray-hide");
      }

      setForm(emptyForm);
      setStatus({ tone: "success", text: "已连接" });
      toast.success("连接成功", connectConfig.name);
      connectionLog.info("连接成功", {
        name: connectConfig.name,
        groupID: result.groupID ?? groupID,
        connID: result.connID ?? "",
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus({ tone: "danger", text: message });
      toast.error("连接失败", message);
      connectionLog.error("连接失败", {
        name: connectConfig.name,
        host: connectConfig.host,
        error: message,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tool-panel connect-panel">
      <div className="panel-heading">
        <h2>连接信息</h2>
      </div>

      <div className="form-grid">
        <label>
          名称
          <input
            className="input-base"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="production"
          />
        </label>
        <label>
          主机
          <input
            className="input-base"
            value={form.host}
            onChange={(event) => setForm((current) => ({ ...current, host: event.target.value }))}
            placeholder="192.168.1.10"
          />
        </label>
        <label>
          端口
          <input
            className="input-base"
            value={form.port}
            inputMode="numeric"
            onChange={(event) => setForm((current) => ({ ...current, port: Number(event.target.value) }))}
          />
        </label>
        <label>
          用户
          <input
            className="input-base"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="root"
          />
        </label>
      </div>

      <Tabs
        value={form.authType}
        onValueChange={(value) => setForm((current) => ({ ...current, authType: value as "password" | "key" }))}
        className="auth-tabs"
      >
        <TabsList aria-label="认证方式" className="segmented-list">
          <TabsTrigger value="password">
            <PlugZap size={15} />
            <span>密码</span>
          </TabsTrigger>
          <TabsTrigger value="key">
            <KeyRound size={15} />
            <span>私钥</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="password">
          <label className="field-block">
            密码
            <input
              className="input-base"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
        </TabsContent>
        <TabsContent value="key">
          <label className="field-block">
            私钥
            <textarea
              className="input-base"
              value={form.privateKey}
              onChange={(event) => setForm((current) => ({ ...current, privateKey: event.target.value }))}
            />
          </label>
        </TabsContent>
      </Tabs>

      <div className="form-grid form-grid--compact">
        <label>
          超时
          <input
            className="input-base"
            value={form.timeout}
            inputMode="numeric"
            onChange={(event) => setForm((current) => ({ ...current, timeout: Number(event.target.value) }))}
          />
        </label>
        <label>
          打开方式
          <select
            className="input-base"
            value={form.target}
            onChange={(event) => setForm((current) => ({ ...current, target: event.target.value as "default" | "new" }))}
          >
            <option value="default">默认分组</option>
            <option value="new">新窗口</option>
          </select>
        </label>
      </div>

      <StatusLine tone={status.tone}>{status.text}</StatusLine>

      <div className="panel-actions">
        <Button disabled={busy} variant="secondary" onClick={() => void testConnection()}>
          测试
        </Button>
        <Button disabled={busy} variant="primary" onClick={() => void connect()}>
          连接
        </Button>
      </div>
    </section>
  );
}
