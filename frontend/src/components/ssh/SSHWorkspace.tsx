import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { DockviewWorkspace } from "@/components/ssh/layout/DockviewWorkspace";
import { StatusLine } from "@/components/StatusLine";
import { eventPayload, eventsApi, sshApi, windowApi, type ConnectionInfo, type GroupUpdatedEvent } from "@/lib/wails";
import { extractErrorMessage } from "@/lib/errors";

export function SSHWorkspace({
  groupID,
  activeConnID,
}: {
  groupID: string;
  activeConnID?: string;
}) {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [activeID, setActiveID] = useState(activeConnID ?? "");
  const [status, setStatus] = useState("");
  const confirm = useConfirm();
  const toast = useToast();

  async function load() {
    if (!groupID) return;
    try {
      const groupConnections = await sshApi.getGroupConnectionInfos(groupID);
      setConnections(Array.isArray(groupConnections) ? groupConnections : []);
      if (!activeID && groupConnections?.length) {
        setActiveID(groupConnections[0].id);
      }
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  useEffect(() => {
    void load();
    const unsubscribe = eventsApi.on<GroupUpdatedEvent>("ssh:group-updated", (event) => {
      const payload = eventPayload(event);
      if (payload?.groupID !== groupID) return;
      if (Array.isArray(payload.connections)) {
        if (payload.connections.length === 0 || typeof payload.connections[0] === "string") {
          void load();
          return;
        }
        setConnections(payload.connections as ConnectionInfo[]);
      } else {
        void load();
      }
    });

    return unsubscribe;
  }, [groupID]);

  useEffect(() => {
    if (activeConnID) setActiveID(activeConnID);
  }, [activeConnID]);

  const activeConnection = useMemo(
    () => connections.find((connection) => connection.id === activeID) ?? connections[0],
    [connections, activeID],
  );
  const title = activeConnection?.name || activeConnection?.host || "SSH";

  async function closeConnection(connection: ConnectionInfo) {
    const ok = await confirm({
      title: "关闭连接",
      description: `确定要关闭 "${connection.name || connection.host}" 吗？`,
      confirmText: "关闭",
      cancelText: "取消",
      danger: true,
    });
    if (!ok) return;

    try {
      await sshApi.disconnect(connection.id);
      await load();
      const remaining = connections.filter((item) => item.id !== connection.id);
      if (activeID === connection.id) {
        setActiveID(remaining[0]?.id ?? "");
      }
    } catch (error) {
      toast.error("关闭连接失败", extractErrorMessage(error));
    }
  }

  async function reconnect(connection: ConnectionInfo) {
    try {
      await sshApi.reconnect(connection.id);
      await load();
      toast.success("重连请求已发送", connection.name || connection.host);
    } catch (error) {
      toast.error("重连失败", extractErrorMessage(error));
    }
  }

  async function closeWindow() {
    const ok = await confirm({
      title: "关闭窗口",
      description: "确定关闭当前窗口？所有标签页将被关闭。",
      confirmText: "关闭窗口",
      cancelText: "取消",
      danger: true,
    });
    if (ok) {
      await windowApi.close();
    }
  }

  return (
    <div className="ssh-layout">
      <header className="top-bar">
        <div className="tab-container">
          {connections.map((connection) => (
            <div
              className={`tab-item ${connection.id === activeConnection?.id ? "active" : ""} ${connection.status === "disconnected" ? "disconnected" : ""}`}
              key={connection.id}
              onClick={() => setActiveID(connection.id)}
            >
              <span className={`tab-status ${connection.status || "idle"}`} />
              <span className="tab-name" title={`ID: ${connection.id}`}>{connection.name || connection.host}</span>
              {connection.status === "disconnected" ? (
                <button className="tab-reconnect" type="button" title="重新连接" onClick={(event) => {
                  event.stopPropagation();
                  void reconnect(connection);
                }}>
                  <RefreshCcw size={12} />
                </button>
              ) : null}
              <button className="tab-close" type="button" title="关闭连接" onClick={(event) => {
                event.stopPropagation();
                void closeConnection(connection);
              }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="window-controls">
          <button className="control-btn minimize" title="最小化" onClick={() => void windowApi.minimise()} />
          <button className="control-btn maximize" title="最大化" onClick={() => void windowApi.maximise()} />
          <button className="control-btn close" title="关闭本组" onClick={() => void closeWindow()} />
        </div>
      </header>

      <main className="content-container">
        <StatusLine tone="danger">{status}</StatusLine>

        {activeConnection ? (
          <DockviewWorkspace connID={activeConnection.id} />
        ) : (
          <div className="empty-state">
            <Button variant="secondary" onClick={() => void load()}>
              重新加载
            </Button>
          </div>
        )}
      </main>
      <span className="sr-only">{title}</span>
    </div>
  );
}
