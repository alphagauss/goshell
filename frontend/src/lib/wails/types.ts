export interface SSHConfig {
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  keyPath?: string;
  privateKey?: string;
  timeout?: number;
}

export interface ConnectionInfo extends SSHConfig {
  id: string;
  status: string;
  saved: boolean;
  group_id?: string;
}

export interface SSHGroup {
  id: string;
  name: string;
  conn_ids?: string[];
  is_default?: boolean;
}

export interface AppConfig {
  terminal?: Record<string, unknown>;
  ui?: {
    theme?: "dark" | "light";
    autoTray?: boolean;
    rememberPosition?: boolean;
    autoShowHome?: boolean;
  };
  cloud?: {
    enabled?: boolean;
    serverUrl?: string;
    token?: string;
    syncInterval?: number;
    autoSyncTo?: boolean;
    autoSyncFrom?: boolean;
  };
  shortcuts?: Record<string, unknown>;
  advanced?: {
    groupBehavior?: "join_default" | "new_window" | "prompt";
  };
  ssh?: Record<string, unknown>;
}

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
  connections?: ConnectionInfo[];
}
