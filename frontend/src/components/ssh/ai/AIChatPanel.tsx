import { useEffect, useRef } from "react";
import { StatusLine } from "@/components/StatusLine";
import { Button } from "@/components/ui/button";
import { AIApprovalQueue } from "@/components/ssh/ai/components/AIApprovalQueue";
import { AIConfigSection } from "@/components/ssh/ai/components/AIConfigSection";
import { AIMessageList } from "@/components/ssh/ai/components/AIMessageList";
import { AIToolLogList } from "@/components/ssh/ai/components/AIToolLogList";
import { useAIChatPanel } from "@/components/ssh/ai/hooks/useAIChatPanel";

export function AIChatWorkspacePanel({ connID }: { connID: string }) {
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const ai = useAIChatPanel(connID);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [ai.messages.length]);

  return (
    <section className="tool-panel ssh-panel ai-chat-panel">
      <div className="ai-chat-panel__header">
        <div className="ai-chat-panel__title">
          <h2>AI 助手</h2>
          <span>
            {ai.modelCount} 个模型 · {ai.toolLogCount} 条工具日志
          </span>
        </div>
        <div className="ai-chat-panel__actions">
          <Button size="sm" variant="secondary" onClick={() => void ai.openTerminal()}>
            打开终端
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void ai.closeTerminal()}>
            关闭终端
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void ai.cancelProcessing()}>
            取消处理
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void ai.clearChat()}>
            清空历史
          </Button>
        </div>
      </div>

      <StatusLine tone={ai.statusTone}>{ai.statusText}</StatusLine>

      <div className="ai-chat-panel__grid">
        <div className="ai-chat-panel__sidebar">
          <AIConfigSection
            connID={connID}
            config={ai.config}
            models={ai.models}
            saving={ai.savingConfig}
            loadingModels={ai.loadingModels}
            onChange={ai.updateConfig}
            onSave={() => void ai.saveConfig()}
            onFetchModels={() => void ai.fetchModels()}
          />

          <AIApprovalQueue approvals={ai.approvals} onApprove={ai.approveTool} onDeny={ai.denyTool} />

          <AIToolLogList entries={ai.filteredToolLogEntries} onClear={() => void ai.clearToolLogs()} />
        </div>

        <section className="ai-section ai-chat-panel__main">
          <div className="ai-section__heading">
            <div>
              <h3>聊天</h3>
              <p>{ai.historyLoading ? "正在加载历史记录" : "Markdown 渲染和代码高亮已启用"}</p>
            </div>
            <span className="status-pill">{ai.messages.length}</span>
          </div>

          <div className="ai-chat-panel__transcript">
            <AIMessageList messages={ai.messages} loading={ai.historyLoading} />
            <div ref={transcriptEndRef} />
          </div>

          <div className="ai-chat-panel__composer">
            <textarea
              className="input-base ai-chat-panel__composer-input"
              value={ai.draft}
              onChange={(event) => ai.setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void ai.sendMessage();
                }
              }}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            />
            <Button
              variant="primary"
              onClick={() => void ai.sendMessage()}
              disabled={ai.sendingMessage || !ai.draft.trim()}
            >
              {ai.sendingMessage ? "发送中" : "发送"}
            </Button>
          </div>
        </section>
      </div>
    </section>
  );
}
