import { createStore } from "@/stores/createStore";
import type { TerminalSession } from "@/types";

interface TerminalSessionsStoreState {
  sessions: TerminalSession[];
  lastUpdatedAt: number | null;
}

const store = createStore<TerminalSessionsStoreState>({
  sessions: [],
  lastUpdatedAt: null,
});

export function useTerminalSessionsStore() {
  return store.useStore();
}

export function getTerminalSessionsSnapshot() {
  return store.getState().sessions;
}

export function getTerminalSessionSnapshot(connID: string, sessionID: string) {
  return store.getState().sessions.find((item) => item.connID === connID && item.sessionID === sessionID);
}

export function setTerminalSessionsSnapshot(sessions: TerminalSession[]) {
  store.setState({
    sessions,
    lastUpdatedAt: Date.now(),
  });
}

export function upsertTerminalSession(session: TerminalSession) {
  store.setState((current) => {
    const exists = current.sessions.some(
      (item) => item.connID === session.connID && item.sessionID === session.sessionID,
    );
    const sessions = exists
      ? current.sessions.map((item) =>
          item.connID === session.connID && item.sessionID === session.sessionID ? session : item,
        )
      : [session, ...current.sessions];

    return {
      ...current,
      sessions,
      lastUpdatedAt: Date.now(),
    };
  });
}

export function removeTerminalSession(connID: string, sessionID: string) {
  store.setState((current) => ({
    ...current,
    sessions: current.sessions.filter((item) => item.connID !== connID || item.sessionID !== sessionID),
    lastUpdatedAt: Date.now(),
  }));
}

export function clearTerminalSessionsForConn(connID: string) {
  store.setState((current) => ({
    ...current,
    sessions: current.sessions.filter((item) => item.connID !== connID),
    lastUpdatedAt: Date.now(),
  }));
}
