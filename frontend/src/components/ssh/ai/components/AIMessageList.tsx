import type { ChatMessage } from "@/types";
import { MarkdownMessage } from "@/components/ssh/ai/components/MarkdownMessage";

export function AIMessageList({
  messages,
  loading,
}: {
  messages: ChatMessage[];
  loading: boolean;
}) {
  if (loading) {
    return <div className="empty-state ai-message-list__empty">正在加载聊天记录...</div>;
  }

  if (messages.length === 0) {
    return <div className="empty-state ai-message-list__empty">暂无消息，先输入一条提示词。</div>;
  }

  return (
    <div className="ai-message-list">
      {messages.map((message, index) => (
        <MarkdownMessage key={message.id || `${index}`} message={message} />
      ))}
    </div>
  );
}
