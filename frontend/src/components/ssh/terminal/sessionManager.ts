import type { TerminalSession } from "@/types";
import {
  clearTerminalSessionsForConn,
  getTerminalSessionSnapshot,
  removeTerminalSession,
  upsertTerminalSession,
} from "@/stores/terminalSessionsStore";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createTerminalSessionID(connID: string, isAI = false) {
  return createId(`${isAI ? "ai" : "term"}-${connID}`);
}

export function registerTerminalSession(session: TerminalSession) {
  upsertTerminalSession(session);
}

export function updateTerminalSession(
  connID: string,
  sessionID: string,
  patch: Partial<TerminalSession>,
) {
  const current = getTerminalSessionSnapshot(connID, sessionID);
  upsertTerminalSession({
    connID,
    sessionID,
    createdAt: current?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    title: current?.title ?? patch.title,
    mode: current?.mode ?? patch.mode,
    status: patch.status ?? current?.status,
    isAI: patch.isAI ?? current?.isAI,
  });
}

export function markTerminalSessionReady(connID: string, sessionID: string, isAI = false) {
  updateTerminalSession(connID, sessionID, {
    mode: isAI ? "ai" : "shell",
    status: "ready",
    isAI,
  });
}

export function markTerminalSessionError(connID: string, sessionID: string, error: string, isAI = false) {
  updateTerminalSession(connID, sessionID, {
    mode: isAI ? "ai" : "shell",
    status: error,
    isAI,
  });
}

export function startTerminalSession(connID: string, sessionID: string, isAI = false) {
  registerTerminalSession({
    connID,
    sessionID,
    isAI,
    mode: isAI ? "ai" : "shell",
    status: "starting",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: isAI ? "AI 终端" : "终端",
  });
}

export function endTerminalSession(connID: string, sessionID: string) {
  removeTerminalSession(connID, sessionID);
}

export function clearTerminalSessions(connID: string) {
  clearTerminalSessionsForConn(connID);
}
