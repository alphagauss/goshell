export interface ConnectResult {
  connID?: string;
  groupID?: string;
}

export interface CommandResult {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  success?: boolean;
}
