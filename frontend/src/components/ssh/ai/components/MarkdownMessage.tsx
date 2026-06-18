import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { formatAITimestamp, renderMarkdown } from "@/components/ssh/ai/utils";

function roleLabel(role: string) {
  if (role === "user") return "用户";
  if (role === "assistant") return "AI";
  if (role === "tool") return "工具";
  if (role === "system") return "系统";
  return role || "消息";
}

export function MarkdownMessage({ message }: { message: ChatMessage }) {
  const html = useMemo(() => renderMarkdown(message.content || ""), [message.content]);
  const role = message.role || "assistant";

  return (
    <article className={cn("ai-message", `ai-message--${role}`)}>
      <div className="ai-message__meta">
        <strong>{roleLabel(role)}</strong>
        {message.timestamp ? <span>{formatAITimestamp(message.timestamp)}</span> : null}
      </div>
      <div className="ai-message__content ai-markdown" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
