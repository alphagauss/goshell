import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Titlebar } from "@/components/Titlebar";
import { DockviewWorkspace } from "@/components/ssh/layout/DockviewWorkspace";
import { StatusLine } from "@/components/StatusLine";
import { eventPayload, eventsApi, sshApi, type ConnectionInfo, type GroupUpdatedEvent } from "@/lib/wails";

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

  async function load() {
    if (!groupID) return;
    try {
      const groupConnections = await sshApi.getGroupConnectionInfos(groupID);
      setConnections(Array.isArray(groupConnections) ? groupConnections : []);
      if (!activeID && groupConnections?.length) {
        setActiveID(groupConnections[0].id);
      }
    } catch (err) {
      setStatus(String(err));
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

  return (
    <div className="ssh-shell">
      <aside className="ssh-sidebar">
        <div className="ssh-sidebar-header">
          <strong>{title}</strong>
          <span>{connections.length} 个连接</span>
        </div>
        <div className="ssh-connection-list">
          {connections.map((connection) => (
            <button
              className={`ssh-connection-button ${connection.id === activeConnection?.id ? "is-active" : ""}`}
              key={connection.id}
              type="button"
              onClick={() => setActiveID(connection.id)}
            >
              <strong>{connection.name || connection.host}</strong>
              <span>
                {connection.username}@{connection.host}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="ssh-workspace">
        <Titlebar title={title}>
          <span className={`status-pill status-pill--${activeConnection?.status || "idle"}`}>
            {activeConnection?.status === "connected" ? "在线" : "离线"}
          </span>
        </Titlebar>

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
    </div>
  );
}
