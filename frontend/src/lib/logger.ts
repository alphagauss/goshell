import { appendLogEntry } from "@/stores/logStore";
import type { LogEntry } from "@/types";

export type LogLevel = LogEntry["level"];

export interface LoggerPayload {
  scope: string;
  level: LogLevel;
  message: string;
  details?: Record<string, unknown>;
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `log_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function write(level: LogLevel, scope: string, message: string, details?: Record<string, unknown>) {
  const entry: LogEntry = {
    id: createId(),
    scope,
    level,
    message,
    timestamp: Date.now(),
    details,
  };

  appendLogEntry(entry);

  const output = `[${scope}] ${message}`;
  if (level === "error") {
    console.error(output, details ?? "");
  } else if (level === "warn") {
    console.warn(output, details ?? "");
  } else if (level === "debug") {
    console.debug(output, details ?? "");
  } else {
    console.info(output, details ?? "");
  }

  return entry;
}

function scoped(scope: string) {
  return {
    debug(message: string, details?: Record<string, unknown>) {
      return write("debug", scope, message, details);
    },
    info(message: string, details?: Record<string, unknown>) {
      return write("info", scope, message, details);
    },
    warn(message: string, details?: Record<string, unknown>) {
      return write("warn", scope, message, details);
    },
    error(message: string, details?: Record<string, unknown>) {
      return write("error", scope, message, details);
    },
  };
}

export const logger = {
  debug(scope: string, message: string, details?: Record<string, unknown>) {
    return write("debug", scope, message, details);
  },
  info(scope: string, message: string, details?: Record<string, unknown>) {
    return write("info", scope, message, details);
  },
  warn(scope: string, message: string, details?: Record<string, unknown>) {
    return write("warn", scope, message, details);
  },
  error(scope: string, message: string, details?: Record<string, unknown>) {
    return write("error", scope, message, details);
  },
  scope: scoped,
};
