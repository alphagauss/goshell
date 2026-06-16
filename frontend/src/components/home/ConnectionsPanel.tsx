import { useMemo, useState } from "react";
import { Plug, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
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
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  async function disconnect(connection: ConnectionInfo) {
    setStatus("");
    try {
      await sshApi.disconnect(connection.id);
      await onChanged();
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  async function remove(connection: ConnectionInfo) {
    setStatus("");
    try {
      await sshApi.deleteConnection(connection.id);
      await onChanged();
    } catch (err) {
      setStatus(extractErrorMessage(err));
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
