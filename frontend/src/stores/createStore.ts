import { useSyncExternalStore } from "react";

type StoreListener = () => void;

export type StoreUpdater<T> = T | ((current: T) => T);

export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<StoreListener>();

  const getState = () => state;

  const setState = (next: StoreUpdater<T>) => {
    const value = typeof next === "function" ? (next as (current: T) => T)(state) : next;
    if (Object.is(value, state)) {
      return state;
    }

    state = value;
    for (const listener of listeners) {
      listener();
    }

    return state;
  };

  const subscribe = (listener: StoreListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const useStore = () => useSyncExternalStore(subscribe, getState, getState);

  return {
    getState,
    setState,
    subscribe,
    useStore,
  };
}
