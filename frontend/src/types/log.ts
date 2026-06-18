export interface LogEntry {
  id: string;
  scope: string;
  level: "debug" | "info" | "warn" | "error" | string;
  message: string;
  timestamp: number;
  source?: string;
  details?: Record<string, unknown>;
}
