import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { aiApi } from "@/lib/wails";
import type { ChatMessage } from "@/types";

export function AIChatPanel({ connID }: { connID: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    try {
      const history = await aiApi.GetChatHistory(connID);
      setMessages(Array.isArray(history) ? history.filter((item): item is ChatMessage => item !== null) : []);
    } catch {
      setMessages([]);
    }
  }

  useEffect(() => {
    void load();
  }, [connID]);

  async function send() {
    if (!input.trim()) return;
    setStatus("");
    try {
      const response = await aiApi.SendMessage({ connId: connID, message: input });
      setInput("");
      await load();
      if (response && response.success === false) {
        setStatus(response.error || "发送失败");
      }
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  return (
    <section className="tool-panel ssh-panel ai-panel">
      <div className="panel-heading">
        <h2>AI</h2>
      </div>
      <div className="chat-list">
        {messages.length === 0 ? (
          <div className="empty-state">暂无消息</div>
        ) : (
          messages.map((message, index) => (
            <article className={`chat-message chat-message--${message.role || "assistant"}`} key={message.id ?? index}>
              <span>{message.role || "assistant"}</span>
              <p>{message.content}</p>
            </article>
          ))
        )}
      </div>
      <StatusLine tone="danger">{status}</StatusLine>
      <div className="composer-row">
        <input
          className="input-base"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void send();
          }}
        />
        <Button variant="primary" size="icon" onClick={() => void send()} aria-label="发送">
          <Send size={15} />
        </Button>
      </div>
    </section>
  );
}
