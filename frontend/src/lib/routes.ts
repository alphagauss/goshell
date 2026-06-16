export type AppRoute =
  | { name: "home" }
  | { name: "ssh"; groupID: string; activeConnID?: string };

export function parseRoute(hash = window.location.hash): AppRoute {
  const normalized = hash.replace(/^#/, "");
  if (!normalized.startsWith("/ssh")) {
    return { name: "home" };
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
