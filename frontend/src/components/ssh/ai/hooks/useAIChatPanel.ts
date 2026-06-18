import { useCallback, useEffect, useMemo, useState } from "react";
import { type AIConfig, type AIModelInfo, type ChatMessage } from "@/types";
import { eventPayload, eventsApi, aiApi, type AIChatClearedEvent, type AIMessageEvent, type AIStatusEvent, type AIToolApprovalEvent } from "@/lib/wails";
import { extractErrorMessage } from "@/lib/errors";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import {
  clearAIToolLogEntriesForConn,
  upsertAIToolLogEntry,
  useAIToolLogStore,
} from "@/stores/aiToolLogStore";
import { normalizeAIConfig } from "@/components/ssh/ai/utils";
import { useAIToolExecution } from "@/components/ssh/ai/hooks/useAIToolExecution";

type AIStatusTone = "muted" | "success" | "warning" | "danger";

interface ApprovalRequest extends AIToolApprovalEvent {
  createdAt: number;
}

function createMessageID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function mapStatusTone(status?: string, text?: string): AIStatusTone {
  const next = (status ?? "").toLowerCase();
  const message = (text ?? "").toLowerCase();
  if (next.includes("error") || message.startsWith("❌")) {
    return "danger";
  }
  if (next.includes("success") || message.includes("完成")) {
    return "success";
  }
  if (next.includes("step") || next.includes("pending") || message.includes("中")) {
    return "warning";
  }
  return "muted";
}

export function useAIChatPanel(connID: string) {
  const toolExecution = useAIToolExecution(connID);

  const toast = useToast();
  const confirm = useConfirm();
  const toolLogEntries = useAIToolLogStore().entries;

  const [config, setConfig] = useState<AIConfig>(() => normalizeAIConfig());
  const [models, setModels] = useState<AIModelInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [draft, setDraft] = useState("");
  const [statusText, setStatusText] = useState("正在加载 AI 配置...");
  const [statusTone, setStatusTone] = useState<AIStatusTone>("warning");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const filteredToolLogEntries = useMemo(
    () => toolLogEntries.filter((entry) => entry.connId === connID).sort((left, right) => right.createdAt - left.createdAt),
    [connID, toolLogEntries],
  );

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const history = await aiApi.GetChatHistory(connID);
      setMessages(Array.isArray(history) ? history.filter((item): item is ChatMessage => Boolean(item)) : []);
    } catch (error) {
      toast.error("加载 AI 历史失败", extractErrorMessage(error));
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [connID, toast]);

  const loadConfig = useCallback(async () => {
    try {
      const next = normalizeAIConfig(await aiApi.GetConfig());
      setConfig(next);
      return next;
    } catch (error) {
      toast.error("加载 AI 配置失败", extractErrorMessage(error));
      const fallback = normalizeAIConfig();
      setConfig(fallback);
      return fallback;
    }
  }, [toast]);

  const fetchModels = useCallback(
    async (overrideConfig?: AIConfig, notify = true) => {
      const source = overrideConfig ?? config;
      if (!source.api_endpoint.trim() || !source.api_key.trim()) {
        setModels([]);
        return [];
      }

      setLoadingModels(true);
      try {
        const list = await aiApi.FetchModelsWithParams(source.api_endpoint.trim(), source.api_key.trim());
        const nextModels = Array.isArray(list) ? list.filter((item): item is AIModelInfo => Boolean(item?.id)) : [];
        setModels(nextModels);
        if (notify) {
          toast.success("模型列表已更新", `${nextModels.length} 个可用模型`);
        }
        return nextModels;
      } catch (error) {
        toast.error("获取模型列表失败", extractErrorMessage(error));
        setModels([]);
        return [];
      } finally {
        setLoadingModels(false);
      }
    },
    [config, toast],
  );

  const saveConfig = useCallback(async () => {
    setSavingConfig(true);
    try {
      await aiApi.SaveConfig(config);
      toast.success("AI 配置已保存");
      setStatusText("AI 配置已保存");
      setStatusTone("success");
      await fetchModels(config);
    } catch (error) {
      toast.error("保存 AI 配置失败", extractErrorMessage(error));
      setStatusText(extractErrorMessage(error));
      setStatusTone("danger");
    } finally {
      setSavingConfig(false);
    }
  }, [config, fetchModels, toast]);

  const sendMessage = useCallback(async () => {
    const message = draft.trim();
    if (!message) {
      return;
    }

    const tempMessageID = createMessageID();
    const optimisticMessage: ChatMessage = {
      id: tempMessageID,
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setDraft("");
    setSendingMessage(true);
    setStatusText("正在发送消息...");
    setStatusTone("warning");

    try {
      const response = await aiApi.SendMessage({ connId: connID, message });
      if (!response?.success) {
        throw new Error(response?.error || "发送失败");
      }
      toast.info("AI 请求已提交");
    } catch (error) {
      setMessages((current) => current.filter((item) => item.id !== tempMessageID));
      setDraft(message);
      const text = extractErrorMessage(error);
      setStatusText(text);
      setStatusTone("danger");
      toast.error("发送 AI 消息失败", text);
    } finally {
      setSendingMessage(false);
    }
  }, [connID, draft, toast]);

  const cancelProcessing = useCallback(async () => {
    try {
      await aiApi.CancelProcessing(connID);
      setStatusText("AI 处理已取消");
      setStatusTone("muted");
      setApprovals([]);
      toast.info("AI 处理已取消");
    } catch (error) {
      toast.error("取消 AI 处理失败", extractErrorMessage(error));
    }
  }, [connID, toast]);

  const clearChat = useCallback(async () => {
    const confirmed = await confirm({
      title: "清空 AI 聊天历史",
      description: "这会删除当前连接的 AI 聊天记录，不影响工具日志和终端。",
      confirmText: "清空",
      cancelText: "取消",
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    try {
      await aiApi.ClearChatHistory(connID);
      setMessages([]);
      setStatusText("聊天历史已清空");
      setStatusTone("success");
      toast.success("AI 聊天历史已清空");
    } catch (error) {
      toast.error("清空 AI 聊天历史失败", extractErrorMessage(error));
    }
  }, [confirm, connID, toast]);

  const clearToolLogs = useCallback(async () => {
    const confirmed = await confirm({
      title: "清空 AI 工具日志",
      description: "这会清空当前连接的 AI 工具执行日志。",
      confirmText: "清空",
      cancelText: "取消",
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    clearAIToolLogEntriesForConn(connID);
    toast.success("AI 工具日志已清空");
  }, [confirm, connID, toast]);

  const updateConfig = useCallback((patch: Partial<AIConfig>) => {
    setConfig((current) => normalizeAIConfig({ ...current, ...patch }));
  }, []);

  const approveTool = useCallback(
    async (request: ApprovalRequest) => {
      setApprovals((current) => current.filter((item) => item.callId !== request.callId));
      upsertAIToolLogEntry({
        id: request.callId,
        connId: connID,
        callId: request.callId,
        tool: request.tool,
        command: request.command,
        status: "approved",
        createdAt: Date.now(),
      });

      try {
        await aiApi.ApproveTool(request.callId);
        setStatusText(`已批准 ${request.tool}`);
        setStatusTone("success");
      } catch (error) {
        toast.error("批准 AI 工具失败", extractErrorMessage(error));
      }
    },
    [connID, toast],
  );

  const denyTool = useCallback(
    async (request: ApprovalRequest) => {
      setApprovals((current) => current.filter((item) => item.callId !== request.callId));
      upsertAIToolLogEntry({
        id: request.callId,
        connId: connID,
        callId: request.callId,
        tool: request.tool,
        command: request.command,
        status: "denied",
        createdAt: Date.now(),
      });

      try {
        await aiApi.DenyTool(request.callId);
        setStatusText(`已拒绝 ${request.tool}`);
        setStatusTone("muted");
      } catch (error) {
        toast.error("拒绝 AI 工具失败", extractErrorMessage(error));
      }
    },
    [connID, toast],
  );

  useEffect(() => {
    let cancelled = false;

    setApprovals([]);
    setMessages([]);
    setDraft("");
    setModels([]);
    setStatusText("正在加载 AI 配置...");
    setStatusTone("warning");

    void (async () => {
      const nextConfig = await loadConfig();
      if (cancelled) {
        return;
      }

      await Promise.allSettled([loadHistory(), fetchModels(nextConfig, false)]);
      if (!cancelled) {
        setStatusText("AI 已就绪");
        setStatusTone("muted");
      }
    })();

    return () => {
      cancelled = true;
      void aiApi.CancelProcessing(connID).catch(() => undefined);
    };
  }, [connID, fetchModels, loadConfig, loadHistory]);

  useEffect(() => {
    const statusUnsubscribe = eventsApi.on<AIStatusEvent>("ai:status", (event) => {
      const payload = eventPayload(event);
      if (!payload || payload.connId !== connID) {
        return;
      }

      setStatusText(payload.text || payload.status || "AI 正在处理...");
      setStatusTone(mapStatusTone(payload.status, payload.text));
    });

    const messageUnsubscribe = eventsApi.on<AIMessageEvent>("ai:message", (event) => {
      const payload = eventPayload(event);
      if (!payload || payload.connId !== connID || !payload.message) {
        return;
      }

      setMessages((current) => {
        const exists = current.some((item) => item.id === payload.message.id);
        if (exists) {
          return current.map((item) => (item.id === payload.message.id ? payload.message : item));
        }
        return [...current, payload.message];
      });
    });

    const approvalUnsubscribe = eventsApi.on<AIToolApprovalEvent>("ai:tool-approval", (event) => {
      const payload = eventPayload(event);
      if (!payload || payload.connId !== connID) {
        return;
      }

      const request: ApprovalRequest = {
        ...payload,
        createdAt: Date.now(),
      };

      setApprovals((current) => {
        if (current.some((item) => item.callId === request.callId)) {
          return current;
        }
        return [...current, request];
      });

      upsertAIToolLogEntry({
        id: request.callId,
        connId: connID,
        callId: request.callId,
        tool: request.tool,
        command: request.command,
        status: "awaiting-approval",
        createdAt: request.createdAt,
      });
      setStatusText(`等待 ${request.tool} 审核`);
      setStatusTone("warning");
    });

    const clearedUnsubscribe = eventsApi.on<AIChatClearedEvent>("ai:chat-cleared", (event) => {
      const payload = eventPayload(event);
      if (!payload || payload.connId !== connID) {
        return;
      }
      setMessages([]);
      setStatusText("聊天历史已清空");
      setStatusTone("success");
    });

    return () => {
      statusUnsubscribe();
      messageUnsubscribe();
      approvalUnsubscribe();
      clearedUnsubscribe();
    };
  }, [connID]);

  const hasPendingApprovals = approvals.length > 0;
  const modelCount = models.length;
  const toolLogCount = filteredToolLogEntries.length;

  return {
    config,
    models,
    messages,
    approvals,
    draft,
    setDraft,
    updateConfig,
    saveConfig,
    fetchModels,
    sendMessage,
    cancelProcessing,
    clearChat,
    clearToolLogs,
    approveTool,
    denyTool,
    statusText,
    statusTone,
    historyLoading,
    savingConfig,
    loadingModels,
    sendingMessage,
    hasPendingApprovals,
    modelCount,
    toolLogCount,
    filteredToolLogEntries,
    ...toolExecution,
  };
}
