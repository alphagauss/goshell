import type { ChatMessage } from "@/types/ai";
import type { ConnectionInfo } from "@/types/ssh";
import type { LogEntry } from "@/types/log";

export interface TerminalOutputEvent {
  connID: string;
  sessionID?: string;
  data: string;
}

export interface ConnectionsUpdatedEvent {
  connections: ConnectionInfo[];
  timestamp: number;
}

export interface GroupUpdatedEvent {
  groupID: string;
  action: string;
  connections?: ConnectionInfo[] | string[];
}

export interface DockviewTerminalsChangedEvent {
  connID: string;
  terminalPanelIDs: string[];
  terminalSessionIDs?: string[];
  activePanelID?: string;
  timestamp: number;
}

export interface TerminalSessionReadyEvent {
  connID: string;
  sessionID: string;
  isAI: boolean;
  timestamp: number;
}

export interface AIStatusEvent {
  connId: string;
  status: string;
  text: string;
}

export interface AIMessageEvent {
  connId: string;
  message: ChatMessage;
}

export interface AIToolApprovalEvent {
  connId: string;
  callId: string;
  tool: string;
  command: string;
}

export interface AIToolExecuteEvent {
  connId: string;
  callId: string;
  tool: string;
  command: string;
  args?: string;
}

export interface AIToolResultEvent {
  connId: string;
  callId: string;
  tool: string;
  command: string;
  result: string;
}

export interface AIChatClearedEvent {
  connId: string;
}

export interface DockviewOpenTerminalEvent {
  connID: string;
  isAI?: boolean;
}

export interface DockviewCloseTerminalEvent {
  connID: string;
  sessionID?: string;
  isAI?: boolean;
}

export interface LogEntryEvent {
  entry: LogEntry;
}
