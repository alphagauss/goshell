import { useEffect, useState } from "react";
import { HomeWorkspace } from "@/components/home/HomeWorkspace";
import { SSHWorkspace } from "@/components/ssh/SSHWorkspace";
import { useAppData } from "@/hooks/useAppData";
import { parseRoute, type AppRoute } from "@/lib/routes";

type HomeView = "connect" | "connections" | "settings" | "cloud";

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());
  const [homeView, setHomeView] = useState<HomeView>("connect");
  const appData = useAppData();

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route.name === "ssh") {
    return <SSHWorkspace groupID={route.groupID} activeConnID={route.activeConnID} />;
  }

  return (
    <HomeWorkspace
      version={appData.version}
      config={appData.config}
      connections={appData.connections}
      savedCount={appData.savedCount}
      onlineCount={appData.onlineCount}
      activeView={homeView}
      onViewChange={setHomeView}
      onReload={appData.reload}
    />
  );
}
