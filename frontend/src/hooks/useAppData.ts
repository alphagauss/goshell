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

export function useAppData() {
  const [version, setVersion] = useState("");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
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
      document.documentElement.dataset.theme = nextConfig.ui?.theme ?? "dark";
    }
    if (connectionsResult.status === "fulfilled") {
      setConnections(Array.isArray(connectionsResult.value) ? connectionsResult.value : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();

    const unsubscribe = eventsApi.on<ConnectionsUpdatedEvent>("ssh:connections-updated", (event) => {
      const payload = eventPayload(event);
      setConnections(Array.isArray(payload?.connections) ? payload.connections : []);
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
