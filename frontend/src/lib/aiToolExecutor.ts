import { sshApi, type AIToolExecuteEvent } from "@/lib/wails";
import { extractErrorMessage } from "@/lib/errors";

export interface AIToolExecutionHelpers {
  ensureTerminal: () => void;
  openTerminal: () => Promise<string | null>;
  closeTerminal: () => string | null;
}

export interface ParsedAIToolCommand {
  label: string;
  command: string;
}

const SERVER_INFO_COMMAND = "hostname && uname -a && uptime && cat /proc/version";
const SYSTEM_STATUS_COMMAND = "top -bn1 | head -5 && free -h && df -h && cat /proc/loadavg";

export function parseToolArgs(argsJSON?: string) {
  if (!argsJSON) {
    return {} as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(argsJSON);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {} as Record<string, unknown>;
  }

  return {} as Record<string, unknown>;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseMultiExecuteCommands(args: Record<string, unknown>) {
  const commands = Array.isArray(args.commands) ? args.commands : [];
  const parsed: ParsedAIToolCommand[] = [];

  for (const item of commands) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const value = item as Record<string, unknown>;
    const command = stringValue(value.command);
    if (!command) {
      continue;
    }

    parsed.push({
      label: stringValue(value.label) || `任务 ${parsed.length + 1}`,
      command,
    });
  }

  return parsed;
}

async function runRemoteCommand(connID: string, command: string) {
  try {
    return (await sshApi.runCommand(connID, command)).trim();
  } catch (error) {
    return `❌ ${extractErrorMessage(error)}`;
  }
}

function formatMultiExecuteResult(items: Array<{ label: string; command: string; result: string }>) {
  return items
    .map((item, index) => {
      const header = `${index + 1}. ${item.label}`;
      const command = `$ ${item.command}`;
      const result = item.result || "(empty)";
      return [header, command, result].join("\n");
    })
    .join("\n\n");
}

export async function executeAITool(
  connID: string,
  payload: AIToolExecuteEvent,
  helpers: AIToolExecutionHelpers,
) {
  const args = parseToolArgs(payload.args);

  if (payload.tool === "open_terminal") {
    const sessionID = await helpers.openTerminal();
    return sessionID ? `已打开 AI 终端: ${sessionID}` : "已请求打开 AI 终端";
  }

  if (payload.tool === "close_terminal") {
    const sessionID = helpers.closeTerminal();
    return sessionID ? `已关闭 AI 终端: ${sessionID}` : "没有可关闭的 AI 终端";
  }

  helpers.ensureTerminal();

  if (payload.tool === "execute_command") {
    const command = stringValue(args.command) || payload.command;
    if (!command) {
      return "❌ 未提供命令";
    }
    return await runRemoteCommand(connID, command);
  }

  if (payload.tool === "get_server_info") {
    return await runRemoteCommand(connID, SERVER_INFO_COMMAND);
  }

  if (payload.tool === "get_system_status") {
    return await runRemoteCommand(connID, SYSTEM_STATUS_COMMAND);
  }

  if (payload.tool === "multi_execute") {
    const commands = parseMultiExecuteCommands(args);
    if (commands.length === 0) {
      return "❌ 未提供可执行命令";
    }

    const results = await Promise.all(
      commands.map(async (item) => ({
        ...item,
        result: await runRemoteCommand(connID, item.command),
      })),
    );

    return formatMultiExecuteResult(results);
  }

  return `❌ 未支持的工具: ${payload.tool}`;
}
