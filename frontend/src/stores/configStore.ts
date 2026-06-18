import { createStore } from "@/stores/createStore";
import type { AppConfig } from "@/types";

interface ConfigStoreState {
  config: AppConfig | null;
  loading: boolean;
  lastUpdatedAt: number | null;
}

const store = createStore<ConfigStoreState>({
  config: null,
  loading: false,
  lastUpdatedAt: null,
});

export function useConfigStore() {
  return store.useStore();
}

export function setConfigSnapshot(config: AppConfig | null) {
  store.setState((current) => ({
    ...current,
    config,
    loading: false,
    lastUpdatedAt: Date.now(),
  }));
}

export function setConfigLoading(loading: boolean) {
  store.setState((current) => ({
    ...current,
    loading,
  }));
}

export function resetConfigStore() {
  store.setState({
    config: null,
    loading: false,
    lastUpdatedAt: null,
  });
}
