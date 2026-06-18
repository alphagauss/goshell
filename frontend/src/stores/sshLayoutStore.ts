import { createStore } from "@/stores/createStore";

export type HomeView = "connect" | "connections" | "settings" | "cloud";

interface SSHLayoutStoreState {
  homeView: HomeView;
  activeGroupID: string | null;
}

const store = createStore<SSHLayoutStoreState>({
  homeView: "connect",
  activeGroupID: null,
});

export function useSSHLayoutStore() {
  return store.useStore();
}

export function setHomeView(homeView: HomeView) {
  store.setState((current) => ({
    ...current,
    homeView,
  }));
}

export function setActiveGroupID(activeGroupID: string | null) {
  store.setState((current) => ({
    ...current,
    activeGroupID,
  }));
}
