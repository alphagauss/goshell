import { useEffect, useMemo, useState } from "react";
import { Files, Monitor, PlaySquare, Terminal as TerminalIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Titlebar } from "@/components/Titlebar";
import { CommandPanel } from "@/components/ssh/CommandPanel";
import { FilePanel } from "@/components/ssh/FilePanel";
import { MonitorPanel } from "@/components/ssh/MonitorPanel";
import { TerminalPanel } from "@/components/ssh/TerminalPanel";
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
        setConnections(payload.connections);
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
          <Tabs defaultValue="terminal" className="ssh-tabs">
            <TabsList aria-label="SSH 面板" className="ssh-tabs-list">
              <TabsTrigger value="terminal">
                <TerminalIcon size={15} />
                <span>终端</span>
              </TabsTrigger>
              <TabsTrigger value="files">
                <Files size={15} />
                <span>文件</span>
              </TabsTrigger>
              <TabsTrigger value="monitor">
                <Monitor size={15} />
                <span>监控</span>
              </TabsTrigger>
              <TabsTrigger value="commands">
                <PlaySquare size={15} />
                <span>命令</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="terminal">
              <TerminalPanel connID={activeConnection.id} />
            </TabsContent>
            <TabsContent value="files">
              <FilePanel connID={activeConnection.id} />
            </TabsContent>
            <TabsContent value="monitor">
              <MonitorPanel connID={activeConnection.id} />
            </TabsContent>
            <TabsContent value="commands">
              <CommandPanel connID={activeConnection.id} />
            </TabsContent>
          </Tabs>
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
