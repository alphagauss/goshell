export interface TerminalConfig {
  defaultType: string;
  autoSwitchClassic: boolean;
  switchMode: string;
  fontSize: number;
  commandSendMode: string;
  codeHighlight: boolean;
}

export interface UIConfig {
  theme: "dark" | "light" | string;
  autoTray: boolean;
  rememberPosition: boolean;
  autoShowHome: boolean;
}

export interface CloudConfig {
  enabled: boolean;
  serverUrl: string;
  token: string;
  syncInterval: number;
  autoSyncTo: boolean;
  autoSyncFrom: boolean;
}

export interface ShortcutsConfig {
  enabled: boolean;
  switchTab: boolean;
  saveGroup: boolean;
  cloudUpload: boolean;
  cloudDownload: boolean;
}

export interface AdvancedConfig {
  groupBehavior: "join_default" | "new_window" | "prompt" | string;
}

export interface AppConfig {
  terminal: TerminalConfig;
  ui: UIConfig;
  cloud: CloudConfig;
  shortcuts: ShortcutsConfig;
  advanced: AdvancedConfig;
}
