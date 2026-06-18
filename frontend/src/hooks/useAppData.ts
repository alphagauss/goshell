import { useCallback, useEffect, useMemo, useState } from "react";
import {
  configApi,
  eventPayload,
  eventsApi,
  greetApi,
  sshApi,
  type AppConfig,
  type ConnectionsUpdatedEvent,
  type ConnectionInfo,
} from "@/lib/wails";
import { setConfigLoading, setConfigSnapshot } from "@/stores/configStore";
import { setConnectionsLoading, setConnectionsSnapshot } from "@/stores/sshConnectionsStore";

export function useAppData() {
  const [version, setVersion] = useState("");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setConfigLoading(true);
    setConnectionsLoading(true);
    const [versionResult, configResult, connectionsResult] = await Promise.allSettled([
      greetApi.GetVersion(),
      configApi.getConfig(),
      sshApi.getAllConnections(),
    ]);

    if (versionResult.status === "fulfilled") {
      setVersion(String(versionResult.value ?? ""));
    }
    if (configResult.status === "fulfilled") {
      const nextConfig = configResult.value;
      setConfig(nextConfig);
      setConfigSnapshot(nextConfig);
      document.documentElement.dataset.theme = nextConfig.ui?.theme ?? "dark";
    }
    if (connectionsResult.status === "fulfilled") {
      const nextConnections = Array.isArray(connectionsResult.value) ? connectionsResult.value : [];
      setConnections(nextConnections);
      setConnectionsSnapshot(nextConnections);
    }
    setConfigLoading(false);
    setConnectionsLoading(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();

    const unsubscribe = eventsApi.on<ConnectionsUpdatedEvent>("ssh:connections-updated", (event) => {
      const payload = eventPayload(event);
      const nextConnections = Array.isArray(payload?.connections) ? payload.connections : [];
      setConnections(nextConnections);
      setConnectionsSnapshot(nextConnections);
    });

    return unsubscribe;
  }, [reload]);

  const savedCount = useMemo(() => connections.filter((item) => item.saved).length, [connections]);
  const onlineCount = useMemo(() => connections.filter((item) => item.status === "connected").length, [connections]);

  return {
    version,
    config,
    connections,
    loading,
    savedCount,
    onlineCount,
    reload,
    setConfig,
  };
}
