export interface TerminalSession {
  connID: string;
  sessionID: string;
  title?: string;
  mode?: string;
  status?: string;
  isAI?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface CommandHistoryEntry {
  id: string;
  connID: string;
  command: string;
  output?: string;
  exitCode?: number;
  favorite?: boolean;
  createdAt: number;
}
