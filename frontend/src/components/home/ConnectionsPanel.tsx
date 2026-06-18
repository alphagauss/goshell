import { useMemo, useState } from "react";
import { Plug, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { sshApi, type ConnectionInfo, type SSHConfig } from "@/lib/wails";

export function ConnectionsPanel({
  connections,
  onChanged,
}: {
  connections: ConnectionInfo[];
  onChanged: () => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const confirm = useConfirm();
  const toast = useToast();
  const connectionsLog = logger.scope("home.connections");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return connections
      .filter((item) =>
        value ? `${item.name} ${item.host} ${item.username}`.toLowerCase().includes(value) : true,
      )
      .sort((a, b) => {
        if (a.status === "connected" && b.status !== "connected") return -1;
        if (a.status !== "connected" && b.status === "connected") return 1;
        return (a.name || a.host).localeCompare(b.name || b.host);
      });
  }, [connections, query]);

  async function connect(connection: ConnectionInfo) {
    setStatus("");
    try {
      const groupID = connection.group_id || (await sshApi.getDefaultGroupID());
      const config: SSHConfig = {
        name: connection.name,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        keyPath: connection.keyPath,
        privateKey: connection.privateKey,
        timeout: 30,
      };
      const result = (await sshApi.createAndConnectWithGroup(config, groupID)) as {
        connID?: string;
        groupID?: string;
      };
      await onChanged();
      await sshApi.openSSHWindow(result.groupID ?? groupID, connection.name, result.connID ?? connection.id);
      toast.success("连接已打开", connection.name || connection.host);
      connectionsLog.info("保存连接已打开", {
        id: connection.id,
        name: connection.name,
        host: connection.host,
        groupID: result.groupID ?? groupID,
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("连接失败", message);
      connectionsLog.error("打开保存连接失败", {
        id: connection.id,
        name: connection.name,
        host: connection.host,
        error: message,
      });
    }
  }

  async function disconnect(connection: ConnectionInfo) {
    setStatus("");
    try {
      await sshApi.disconnect(connection.id);
      await onChanged();
      toast.info("连接已断开", connection.name || connection.host);
      connectionsLog.info("连接已断开", {
        id: connection.id,
        name: connection.name,
        host: connection.host,
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("断开连接失败", message);
      connectionsLog.error("断开连接失败", {
        id: connection.id,
        name: connection.name,
        host: connection.host,
        error: message,
      });
    }
  }

  async function remove(connection: ConnectionInfo) {
    setStatus("");
    try {
      const confirmed = await confirm({
        title: "删除连接",
        description: `确定删除 ${connection.name || connection.host} 吗？此操作不可恢复。`,
        confirmText: "删除",
        cancelText: "取消",
        danger: true,
      });
      if (!confirmed) {
        return;
      }

      await sshApi.deleteConnection(connection.id);
      await onChanged();
      toast.success("连接已删除", connection.name || connection.host);
      connectionsLog.warn("连接已删除", {
        id: connection.id,
        name: connection.name,
        host: connection.host,
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("删除连接失败", message);
      connectionsLog.error("删除连接失败", {
        id: connection.id,
        name: connection.name,
        host: connection.host,
        error: message,
      });
    }
  }

  return (
    <section className="tool-panel connections-panel">
      <div className="panel-heading">
        <h2>连接</h2>
        <Button variant="ghost" size="icon" onClick={() => void onChanged()} aria-label="刷新">
          <RefreshCcw size={15} />
        </Button>
      </div>
      <input
        className="input-base search-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="搜索"
      />
      <StatusLine tone="danger">{status}</StatusLine>
      <div className="connection-list-react">
        {filtered.length === 0 ? (
          <div className="empty-state">暂无连接</div>
        ) : (
          filtered.map((connection) => (
            <article className="connection-card" key={connection.id}>
              <div>
                <strong>{connection.name || connection.host}</strong>
                <span>
                  {connection.username}@{connection.host}:{connection.port}
                </span>
              </div>
              <span className={`status-pill status-pill--${connection.status || "idle"}`}>
                {connection.status === "connected" ? "在线" : "离线"}
              </span>
              <div className="row-actions">
                {connection.status === "connected" ? (
                  <Button variant="secondary" size="sm" onClick={() => void disconnect(connection)}>
                    断开
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => void connect(connection)}>
                    <Plug size={14} />
                    连接
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => void remove(connection)} aria-label="删除">
                  <Trash2 size={15} />
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
