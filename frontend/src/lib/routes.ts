import type { HomeView } from "@/stores/sshLayoutStore";

export type AppRoute =
  | { name: "home"; view: HomeView }
  | { name: "ssh"; groupID: string; activeConnID?: string };

export function parseRoute(hash = window.location.hash): AppRoute {
  const normalized = hash.replace(/^#/, "");
  if (!normalized.startsWith("/ssh")) {
    if (normalized.startsWith("/home/settings")) return { name: "home", view: "settings" };
    if (normalized.startsWith("/home/cloud")) return { name: "home", view: "cloud" };
    if (normalized.startsWith("/home/connections")) return { name: "home", view: "connections" };
    return { name: "home", view: "connect" };
  }

  const queryStart = normalized.indexOf("?");
  const query = queryStart >= 0 ? normalized.slice(queryStart + 1) : "";
  const params = new URLSearchParams(query);

  return {
    name: "ssh",
    groupID: params.get("group") ?? "",
    activeConnID: params.get("activeConn") ?? undefined,
  };
}
