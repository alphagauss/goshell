import { Cloud, Monitor, Plus, Settings } from "lucide-react";
import type * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectionForm } from "@/components/home/ConnectionForm";
import { ConnectionsPanel } from "@/components/home/ConnectionsPanel";
import { SettingsPanel } from "@/components/home/SettingsPanel";
import { CloudPanel } from "@/components/home/CloudPanel";
import { Titlebar } from "@/components/Titlebar";
import logo from "@/零启.svg";
import background from "@/background.jpg";
import type { AppConfig, ConnectionInfo } from "@/lib/wails";

type HomeView = "connect" | "connections" | "settings" | "cloud";

const views: Array<{ id: HomeView; label: string; icon: typeof Plus }> = [
  { id: "connect", label: "新连接", icon: Plus },
  { id: "connections", label: "连接", icon: Monitor },
  { id: "settings", label: "设置", icon: Settings },
  { id: "cloud", label: "云端", icon: Cloud },
];

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
  const title = views.find((item) => item.id === activeView)?.label ?? "goshell";

  return (
    <div className="app-shell" style={{ "--app-bg-image": `url(${background})` } as React.CSSProperties}>
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="" className="brand-logo" />
          <div className="brand-copy">
            <strong>goshell</strong>
            <span>{version ? `v${version}` : "desktop"}</span>
          </div>
        </div>

        <Tabs value={activeView} onValueChange={(value) => onViewChange(value as HomeView)} className="nav-tabs">
          <TabsList aria-label="主导航">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <TabsTrigger key={view.id} value={view.id}>
                  <Icon size={16} />
                  <span>{view.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="sidebar-summary">
          <div>
            <span>已保存</span>
            <strong>{savedCount}</strong>
          </div>
          <div>
            <span>在线</span>
            <strong>{onlineCount}</strong>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <Titlebar title={title} />
        <section className="content-surface">
          <Tabs value={activeView}>
            <TabsContent value="connect">
              <div className="panel-grid">
                <ConnectionForm config={config} onChanged={onReload} />
                <ConnectionsPanel connections={connections.slice(0, 5)} onChanged={onReload} />
              </div>
            </TabsContent>
            <TabsContent value="connections">
              <ConnectionsPanel connections={connections} onChanged={onReload} />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsPanel config={config} connections={connections} onChanged={onReload} />
            </TabsContent>
            <TabsContent value="cloud">
              <CloudPanel config={config} connections={connections} onChanged={onReload} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
