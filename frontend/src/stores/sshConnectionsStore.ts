import { createStore } from "@/stores/createStore";
import type { ConnectionInfo } from "@/types";

interface SSHConnectionsStoreState {
  connections: ConnectionInfo[];
  loading: boolean;
  lastUpdatedAt: number | null;
}

const store = createStore<SSHConnectionsStoreState>({
  connections: [],
  loading: false,
  lastUpdatedAt: null,
});

export function useSSHConnectionsStore() {
  return store.useStore();
}

export function setConnectionsSnapshot(connections: ConnectionInfo[]) {
  store.setState({
    connections,
    loading: false,
    lastUpdatedAt: Date.now(),
  });
}

export function setConnectionsLoading(loading: boolean) {
  store.setState((current) => ({
    ...current,
    loading,
  }));
}

export function resetConnectionsStore() {
  store.setState({
    connections: [],
    loading: false,
    lastUpdatedAt: null,
  });
}

export function upsertConnectionSnapshot(connection: ConnectionInfo) {
  store.setState((current) => {
    const index = current.connections.findIndex((item) => item.id === connection.id);
    const connections =
      index < 0
        ? [connection, ...current.connections]
        : current.connections.map((item) => (item.id === connection.id ? connection : item));

    return {
      ...current,
      connections,
      lastUpdatedAt: Date.now(),
    };
  });
}

export function removeConnectionSnapshot(connectionID: string) {
  store.setState((current) => ({
    ...current,
    connections: current.connections.filter((item) => item.id !== connectionID),
    lastUpdatedAt: Date.now(),
  }));
}
