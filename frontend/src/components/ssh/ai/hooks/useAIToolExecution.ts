import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  aiApi,
  eventPayload,
  eventsApi,
  type AIToolExecuteEvent,
  type AIToolResultEvent,
  type TerminalSessionReadyEvent,
} from "@/lib/wails";
import { logger } from "@/lib/logger";
import { useToast } from "@/components/ui/toast";
import { executeAITool, type AIToolExecutionHelpers } from "@/lib/aiToolExecutor";
import { getTerminalSessionsSnapshot } from "@/stores/terminalSessionsStore";
import { upsertAIToolLogEntry } from "@/stores/aiToolLogStore";

interface PendingOpenTerminalRequest {
  resolve?: (sessionID: string | null) => void;
  settled: boolean;
  timer?: number;
}

function isErrorResult(result: string) {
  const normalized = result.trim().toLowerCase();
  return normalized.startsWith("error") || normalized.includes("\nerror") || normalized.includes("failed") || normalized.includes("失败");
}

export function useAIToolExecution(connID: string) {
  const pendingOpenRequestsRef = useRef<PendingOpenTerminalRequest[]>([]);
  const toast = useToast();
  const toolLog = logger.scope("ai.executor");

  const scheduleOpenTerminal = useCallback(
    (resolve?: (sessionID: string | null) => void) => {
      const request: PendingOpenTerminalRequest = { resolve, settled: false };

      if (resolve) {
        request.timer = window.setTimeout(() => {
          if (request.settled) {
            return;
          }

          request.settled = true;
          pendingOpenRequestsRef.current = pendingOpenRequestsRef.current.filter((item) => item !== request);
          resolve(null);
        }, 12000);
      }

      pendingOpenRequestsRef.current = [...pendingOpenRequestsRef.current, request];
      eventsApi.emit("dockview:open-terminal", {
        connID,
        isAI: true,
      });
    },
    [connID],
  );

  const ensureTerminal = useCallback(() => {
    const hasOpenSession = getTerminalSessionsSnapshot().some((session) => session.connID === connID && session.isAI);
    if (hasOpenSession || pendingOpenRequestsRef.current.length > 0) {
      return;
    }

    scheduleOpenTerminal();
  }, [connID, scheduleOpenTerminal]);

  const openTerminal = useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        scheduleOpenTerminal(resolve);
      }),
    [scheduleOpenTerminal],
  );

  const closeTerminal = useCallback(() => {
    const session = getTerminalSessionsSnapshot().find((item) => item.connID === connID && item.isAI);
    if (!session) {
      return null;
    }

    eventsApi.emit("dockview:close-terminal", {
      connID,
      sessionID: session.sessionID,
      isAI: true,
    });

    return session.sessionID;
  }, [connID]);

  const helpers = useMemo<AIToolExecutionHelpers>(
    () => ({
      ensureTerminal,
      openTerminal,
      closeTerminal,
    }),
    [closeTerminal, ensureTerminal, openTerminal],
  );

  useEffect(() => {
    const sessionUnsubscribe = eventsApi.on<TerminalSessionReadyEvent>("terminal:session-ready", (event) => {
      const payload = eventPayload(event);
      if (!payload || payload.connID !== connID || !payload.isAI) {
        return;
      }

      const request = pendingOpenRequestsRef.current.shift();
      if (!request) {
        return;
      }

      request.settled = true;
      if (request.timer) {
        window.clearTimeout(request.timer);
      }
      request.resolve?.(payload.sessionID);
    });

    return () => {
      sessionUnsubscribe();
      for (const request of pendingOpenRequestsRef.current) {
        if (request.timer) {
          window.clearTimeout(request.timer);
        }
        request.resolve?.(null);
      }
      pendingOpenRequestsRef.current = [];
    };
  }, [connID]);

  useEffect(() => {
    const executeUnsubscribe = eventsApi.on<AIToolExecuteEvent>("ai:execute-tool", (event) => {
      const payload = eventPayload(event);
      if (!payload || payload.connId !== connID) {
        return;
      }

      const callId = payload.callId;
      upsertAIToolLogEntry({
        id: callId,
        connId: connID,
        callId,
        tool: payload.tool,
        command: payload.command,
        status: "running",
        createdAt: Date.now(),
      });

      void (async () => {
        try {
          const result = await executeAITool(connID, payload, helpers);
          upsertAIToolLogEntry({
            id: callId,
            connId: connID,
            callId,
            tool: payload.tool,
            command: payload.command,
            result,
            status: isErrorResult(result) ? "error" : "success",
            createdAt: Date.now(),
          });

          await aiApi.SubmitToolResult(callId, result);
        } catch (error) {
          const result = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
          upsertAIToolLogEntry({
            id: callId,
            connId: connID,
            callId,
            tool: payload.tool,
            command: payload.command,
            result,
            status: "error",
            createdAt: Date.now(),
          });
          toast.error("AI tool execution failed", result);

          try {
            await aiApi.SubmitToolResult(callId, result);
          } catch {
            toolLog.error("Failed to submit AI tool result", { connID, callId, tool: payload.tool });
          }
        }
      })();
    });

    const resultUnsubscribe = eventsApi.on<AIToolResultEvent>("ai:tool-result", (event) => {
      const payload = eventPayload(event);
      if (!payload || payload.connId !== connID) {
        return;
      }

      upsertAIToolLogEntry({
        id: payload.callId,
        connId: connID,
        callId: payload.callId,
        tool: payload.tool,
        command: payload.command,
        result: payload.result,
        status: isErrorResult(payload.result) ? "error" : "success",
        createdAt: Date.now(),
      });
    });

    return () => {
      executeUnsubscribe();
      resultUnsubscribe();
    };
  }, [connID, helpers, toast, toolLog]);

  return {
    ensureTerminal,
    openTerminal,
    closeTerminal,
  };
}
