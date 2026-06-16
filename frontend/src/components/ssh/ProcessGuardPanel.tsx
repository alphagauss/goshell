import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { processGuardianApi } from "@/lib/wails";

interface Guardian {
  name: string;
  command: string;
  status: string;
  pid?: number;
  restarts?: number;
}

export function ProcessGuardPanel({ connID }: { connID: string }) {
  const [items, setItems] = useState<Guardian[]>([]);
  const [status, setStatus] = useState("");

  async function load() {
    setStatus("");
    try {
      const result = await processGuardianApi.GetGuardians(connID);
      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  async function action(name: string, kind: "start" | "stop" | "restart") {
    setStatus("");
    try {
      if (kind === "start") await processGuardianApi.StartGuardian(connID, name);
      if (kind === "stop") await processGuardianApi.StopGuardian(connID, name);
      if (kind === "restart") await processGuardianApi.RestartGuardian(connID, name);
      await load();
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, [connID]);

  return (
    <section className="tool-panel ssh-panel">
      <div className="panel-heading">
        <h2>守护进程</h2>
        <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="刷新">
          <RefreshCcw size={15} />
        </Button>
      </div>
      <StatusLine tone="danger">{status}</StatusLine>
      <div className="file-list">
        {items.length === 0 ? (
          <div className="empty-state">暂无进程</div>
        ) : (
          items.map((item) => (
            <div className="guardian-row" key={item.name}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.command}</span>
              </div>
              <span className={`status-pill status-pill--${item.status}`}>{item.status}</span>
              <div className="row-actions">
                <Button size="sm" variant="secondary" onClick={() => void action(item.name, "start")}>
                  启动
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void action(item.name, "stop")}>
                  停止
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void action(item.name, "restart")}>
                  重启
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
