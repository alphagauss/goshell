import { Cloud, Monitor, MoreHorizontal, Play, Plus, Save, Search, Settings, SlidersHorizontal, Trash2, XCircle } from "lucide-react";
import type * as React from "react";
import { ConnectionForm } from "@/components/home/ConnectionForm";
import { ConnectionsPanel } from "@/components/home/ConnectionsPanel";
import { SettingsPanel } from "@/components/home/SettingsPanel";
import { CloudPanel } from "@/components/home/CloudPanel";
import { Titlebar } from "@/components/Titlebar";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/errors";
import { eventsApi, sshApi, type SSHConfig } from "@/lib/wails";
import logo from "@/零启.svg";
import type { AppConfig, ConnectionInfo } from "@/lib/wails";
import { useMemo, useState } from "react";

type HomeView = "connect" | "connections" | "settings" | "cloud";

export function HomeWorkspace({
  version,
  config,
  connections,
  savedCount,
  onlineCount,
  activeView,
  onViewChange,
  onReload,
}: {
  version: string;
  config: AppConfig | null;
  connections: ConnectionInfo[];
  savedCount: number;
  onlineCount: number;
  activeView: HomeView;
  onViewChange: (view: HomeView) => void;
  onReload: () => Promise<void> | void;
}) {
  const title = activeView === "settings" ? "设置" : activeView === "cloud" ? "私有云端" : "启SSH";

  return (
    <div className="home-layout">
      <Titlebar
        title="启SSH"
        leading={
          <div className="logo-container">
            <img src={logo} alt="启SSH Logo" className="logo" />
            <span className="app-name">启SSH</span>
            <span className="version">{version ? `v${version}` : "v0.3.1"}</span>
          </div>
        }
      />
      <div className="app-body">
        <HomeSidebar
          connections={connections}
          activeView={activeView}
          savedCount={savedCount}
          onlineCount={onlineCount}
          config={config}
          onViewChange={onViewChange}
          onReload={onReload}
        />
        <main className="content-area">
          <div className="home-page-surface">
            {activeView === "connect" ? <ConnectionForm config={config} onChanged={onReload} /> : null}
            {activeView === "connections" ? <ConnectionsPanel connections={connections} onChanged={onReload} /> : null}
            {activeView === "settings" ? <SettingsPanel config={config} connections={connections} onChanged={onReload} /> : null}
            {activeView === "cloud" ? <CloudPanel config={config} connections={connections} onChanged={onReload} /> : null}
            <span className="sr-only">{title}</span>
          </div>
        </main>
      </div>
    </div>
  );
}

function HomeSidebar({
  connections,
  activeView,
  savedCount,
  onlineCount,
  config,
  onViewChange,
  onReload,
}: {
  connections: ConnectionInfo[];
  activeView: HomeView;
  savedCount: number;
  onlineCount: number;
  config: AppConfig | null;
  onViewChange: (view: HomeView) => void;
  onReload: () => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const confirm = useConfirm();
  const toast = useToast();

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return [...connections]
      .filter((connection) =>
        value ? `${connection.name} ${connection.host}`.toLowerCase().includes(value) : true,
      )
      .sort((a, b) => {
        const stateA = a.status === "connected" ? 0 : 1;
        const stateB = b.status === "connected" ? 0 : 1;
        if (stateA !== stateB) return stateA - stateB;
        return (a.name || a.host || a.id).localeCompare(b.name || b.host || b.id);
      });
  }, [connections, query]);
  const savedConnections = filtered.filter((connection) => connection.saved);
  const cachedConnections = filtered.filter((connection) => !connection.saved);

  function changeView(view: HomeView) {
    const path =
      view === "settings"
        ? "/home/settings"
        : view === "cloud"
          ? "/home/cloud"
          : view === "connections"
            ? "/home/connections"
            : "/home/new";
    if (window.location.hash !== `#${path}`) {
      window.location.hash = path;
    }
    onViewChange(view);
  }

  async function chooseGroup(name: string) {
    const groups = await sshApi.getAllGroups();
    const hasActiveGroup = groups.some((group) => (group?.conn_ids?.length ?? 0) > 0);
    if (!hasActiveGroup || config?.advanced?.groupBehavior === "join_default") {
      return sshApi.getDefaultGroupID();
    }
    if (config?.advanced?.groupBehavior === "new_window") {
      return sshApi.createGroup(name);
    }
    return sshApi.getDefaultGroupID();
  }

  async function quickConnect(connection: ConnectionInfo) {
    if (connection.status === "connected") return;
    try {
      const sshConfig: SSHConfig = {
        name: connection.name || `${connection.username}@${connection.host}`,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        privateKey: connection.privateKey,
        keyPath: connection.keyPath,
        timeout: 30,
      };
      const groupID = await chooseGroup(sshConfig.name);
      const result = await sshApi.createAndConnectWithGroup(sshConfig, groupID);
      await onReload();
      await sshApi.openSSHWindow(result.groupID || groupID, sshConfig.name, result.connID || connection.id);
      if (config?.ui?.autoTray) {
        eventsApi.emit("ssh:tray-hide");
      }
      toast.success("已连接", sshConfig.name);
    } catch (error) {
      toast.error("连接失败", extractErrorMessage(error));
    }
  }

  async function saveConnection(connection: ConnectionInfo) {
    try {
      await sshApi.saveConnection(connection.id);
      await onReload();
      toast.success("已保存到本地");
    } catch (error) {
      toast.error("保存失败", extractErrorMessage(error));
    }
  }

  async function deleteConnection(connection: ConnectionInfo) {
    const ok = await confirm({
      title: "删除本地存储",
      description: `确定要删除 "${connection.name || connection.host}" 的本地存储吗？`,
      confirmText: "删除",
      cancelText: "取消",
      danger: true,
    });
    if (!ok) return;

    try {
      await sshApi.deleteConnection(connection.id);
      await onReload();
      toast.success("已删除本地存储");
    } catch (error) {
      toast.error("删除失败", extractErrorMessage(error));
    }
  }

  async function disconnect(connection: ConnectionInfo) {
    const ok = await confirm({
      title: "关闭连接",
      description: `确定要关闭 "${connection.name || connection.host}" 的连接吗？`,
      confirmText: "关闭",
      cancelText: "取消",
      danger: true,
    });
    if (!ok) return;

    try {
      await sshApi.disconnect(connection.id);
      await onReload();
      toast.success("已关闭连接");
    } catch (error) {
      toast.error("断开连接失败", extractErrorMessage(error));
    }
  }

  const renderSection = (title: string, count: number, sectionConnections: ConnectionInfo[]) =>
    sectionConnections.length > 0 ? (
      <div className="connection-section">
        <div className="section-header">
          <span className="section-title">{title}</span>
          <span className="section-count">{count}</span>
        </div>
        <div className="connections">
          {sectionConnections.map((connection) => (
            <div
              className={`connection-item ${connection.saved ? "" : "cached"} ${connection.status === "connected" ? "connected" : ""}`}
              key={connection.id}
              onDoubleClick={() => void quickConnect(connection)}
            >
              <button className="connection-content" type="button" onClick={() => setActiveMenu(null)}>
                <span className="connection-top">
                  <span className="connection-name">{connection.name || connection.host}</span>
                </span>
                <span className="connection-bottom">
                  <span className="connection-info">
                    {connection.host}:{connection.port}
                  </span>
                  <span className={`status-badge ${connection.status}`}>
                    {connection.status === "connected" ? "已连接" : "未连接"}
                  </span>
                </span>
              </button>
              <button
                className="more-btn"
                type="button"
                aria-label="更多操作"
                onClick={() => setActiveMenu(activeMenu === connection.id ? null : connection.id)}
              >
                <MoreHorizontal size={16} />
              </button>
              {activeMenu === connection.id ? (
                <div className="connection-menu">
                  {connection.status !== "connected" ? (
                    <button type="button" onClick={() => void quickConnect(connection)}>
                      <Play size={14} />
                      快速连接
                    </button>
                  ) : (
                    <button type="button" onClick={() => void disconnect(connection)}>
                      <XCircle size={14} />
                      关闭连接
                    </button>
                  )}
                  {connection.saved ? (
                    <button type="button" onClick={() => void deleteConnection(connection)}>
                      <Trash2 size={14} />
                      删除本地存储
                    </button>
                  ) : (
                    <button type="button" onClick={() => void saveConnection(connection)}>
                      <Save size={14} />
                      保存到本地
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <aside className="sidebar-panel">
      <div className="search-box">
        <Search className="search-icon" size={14} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索..." className="search-input" />
      </div>
      <div className="sidebar-stats">
        <span>已保存 {savedCount}</span>
        <span>在线 {onlineCount}</span>
      </div>
      <div className="connection-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>暂无连接</p>
          </div>
        ) : (
          <>
            {renderSection("已保存", savedConnections.length, savedConnections)}
            {renderSection("缓存", cachedConnections.length, cachedConnections)}
          </>
        )}
      </div>
      <div className="bottom-toolbar">
        <Button variant={activeView === "connect" ? "primary" : "ghost"} size="icon" aria-label="新连接" onClick={() => changeView("connect")}>
          <Plus size={16} />
        </Button>
        <Button variant={activeView === "connections" ? "primary" : "ghost"} size="icon" aria-label="连接" onClick={() => changeView("connections")}>
          <Monitor size={16} />
        </Button>
        <Button variant={activeView === "cloud" ? "primary" : "ghost"} size="icon" aria-label="云端" onClick={() => changeView("cloud")}>
          <Cloud size={16} />
        </Button>
        <Button variant={activeView === "settings" ? "primary" : "ghost"} size="icon" aria-label="设置" onClick={() => changeView("settings")}>
          <Settings size={16} />
        </Button>
        <Button variant="ghost" size="icon" aria-label="刷新" onClick={() => void onReload()}>
          <SlidersHorizontal size={16} />
        </Button>
      </div>
    </aside>
  );
}
