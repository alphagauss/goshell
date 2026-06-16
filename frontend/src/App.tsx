import { useEffect, useMemo, useState } from "react";
import { Cloud, Maximize2, Minimize2, Monitor, Plus, Power, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import logo from "@/零启.svg";
import background from "@/background.jpg";
import { configApi, greetApi, sshApi, windowApi, type AppConfig, type ConnectionInfo } from "@/lib/wails";

type View = "connect" | "connections" | "settings" | "cloud";

const views: Array<{ id: View; label: string; icon: typeof Plus }> = [
  { id: "connect", label: "新连接", icon: Plus },
  { id: "connections", label: "连接", icon: Monitor },
  { id: "settings", label: "设置", icon: Settings },
  { id: "cloud", label: "云端", icon: Cloud },
];

export default function App() {
  const [activeView, setActiveView] = useState<View>("connect");
  const [version, setVersion] = useState("");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([greetApi.GetVersion(), configApi.getConfig(), sshApi.getAllConnections()]).then(
      ([versionResult, configResult, connectionsResult]) => {
        if (!mounted) return;

        if (versionResult.status === "fulfilled") {
          setVersion(String(versionResult.value ?? ""));
        }
        if (configResult.status === "fulfilled") {
          const nextConfig = configResult.value;
          setConfig(nextConfig);
          document.documentElement.dataset.theme = nextConfig.ui?.theme ?? "dark";
        }
        if (connectionsResult.status === "fulfilled") {
          setConnections(Array.isArray(connectionsResult.value) ? connectionsResult.value : []);
        }
      },
    );

    return () => {
      mounted = false;
    };
  }, []);

  const savedCount = useMemo(() => connections.filter((item) => item.saved).length, [connections]);
  const onlineCount = useMemo(() => connections.filter((item) => item.status === "connected").length, [connections]);

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

        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as View)} className="nav-tabs">
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
        <header className="titlebar">
          <div>
            <h1>{views.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className="window-controls">
            <IconButton label="最小化" onClick={() => void windowApi.minimise()}>
              <Minimize2 size={15} />
            </IconButton>
            <IconButton label="最大化" onClick={() => void windowApi.maximise()}>
              <Maximize2 size={15} />
            </IconButton>
            <IconButton label="关闭" onClick={() => void windowApi.close()}>
              <X size={15} />
            </IconButton>
          </div>
        </header>

        <section className="content-surface">
          <Tabs value={activeView}>
            <TabsContent value="connect">
              <ConnectPanel />
            </TabsContent>
            <TabsContent value="connections">
              <ConnectionsPanel connections={connections} />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsPanel config={config} />
            </TabsContent>
            <TabsContent value="cloud">
              <CloudPanel config={config} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={label} size="icon" variant="ghost" onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ConnectPanel() {
  return (
    <div className="panel-grid">
      <section className="tool-panel">
        <div className="panel-heading">
          <h2>连接信息</h2>
        </div>
        <div className="form-grid">
          <label>
            名称
            <input className="input-base" placeholder="production" />
          </label>
          <label>
            主机
            <input className="input-base" placeholder="192.168.1.10" />
          </label>
          <label>
            端口
            <input className="input-base" defaultValue="22" inputMode="numeric" />
          </label>
          <label>
            用户
            <input className="input-base" placeholder="root" />
          </label>
        </div>
        <div className="panel-actions">
          <Button variant="secondary">测试</Button>
          <Button variant="primary">连接</Button>
        </div>
      </section>
      <section className="tool-panel panel-compact">
        <Power size={20} />
        <h2>会话</h2>
        <p>等待连接</p>
      </section>
    </div>
  );
}

function ConnectionsPanel({ connections }: { connections: ConnectionInfo[] }) {
  return (
    <div className="table-panel">
      <div className="table-row table-head">
        <span>名称</span>
        <span>主机</span>
        <span>用户</span>
        <span>状态</span>
      </div>
      {connections.length === 0 ? (
        <div className="empty-state">暂无连接</div>
      ) : (
        connections.map((item) => (
          <div className="table-row" key={item.id}>
            <span>{item.name || item.id}</span>
            <span>{item.host}:{item.port}</span>
            <span>{item.username}</span>
            <span>{item.status || "idle"}</span>
          </div>
        ))
      )}
    </div>
  );
}

function SettingsPanel({ config }: { config: AppConfig | null }) {
  return (
    <div className="panel-grid">
      <section className="tool-panel">
        <div className="panel-heading">
          <h2>界面</h2>
        </div>
        <dl className="settings-list">
          <div>
            <dt>主题</dt>
            <dd>{config?.ui?.theme ?? "dark"}</dd>
          </div>
          <div>
            <dt>记住窗口</dt>
            <dd>{config?.ui?.rememberPosition ? "开启" : "关闭"}</dd>
          </div>
          <div>
            <dt>自动回首页</dt>
            <dd>{config?.ui?.autoShowHome ? "开启" : "关闭"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function CloudPanel({ config }: { config: AppConfig | null }) {
  return (
    <div className="panel-grid">
      <section className="tool-panel">
        <div className="panel-heading">
          <h2>云端</h2>
        </div>
        <dl className="settings-list">
          <div>
            <dt>状态</dt>
            <dd>{config?.cloud?.enabled ? "开启" : "关闭"}</dd>
          </div>
          <div>
            <dt>地址</dt>
            <dd>{config?.cloud?.serverUrl || "-"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
