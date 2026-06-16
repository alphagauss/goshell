import { useEffect, useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { portForwardApi } from "@/lib/wails";

interface ForwardItem {
  id: string;
  type: string;
  bindAddr: string;
  bindPort: number;
  remoteHost: string;
  remotePort: number;
  status: string;
}

export function PortForwardPanel({ connID }: { connID: string }) {
  const [items, setItems] = useState<ForwardItem[]>([]);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    bindAddr: "127.0.0.1",
    bindPort: 8080,
    remoteHost: "127.0.0.1",
    remotePort: 80,
  });

  async function load() {
    setStatus("");
    try {
      const result = await portForwardApi.GetForwards(connID);
      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  async function add() {
    setStatus("");
    try {
      await portForwardApi.AddLocalForward(
        connID,
        form.bindAddr,
        Number(form.bindPort),
        form.remoteHost,
        Number(form.remotePort),
      );
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
        <h2>端口转发</h2>
        <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="刷新">
          <RefreshCcw size={15} />
        </Button>
      </div>
      <div className="forward-form">
        <input className="input-base" value={form.bindAddr} onChange={(e) => setForm({ ...form, bindAddr: e.target.value })} />
        <input
          className="input-base"
          value={form.bindPort}
          inputMode="numeric"
          onChange={(e) => setForm({ ...form, bindPort: Number(e.target.value) })}
        />
        <input
          className="input-base"
          value={form.remoteHost}
          onChange={(e) => setForm({ ...form, remoteHost: e.target.value })}
        />
        <input
          className="input-base"
          value={form.remotePort}
          inputMode="numeric"
          onChange={(e) => setForm({ ...form, remotePort: Number(e.target.value) })}
        />
        <Button variant="primary" size="icon" onClick={() => void add()} aria-label="添加">
          <Plus size={15} />
        </Button>
      </div>
      <StatusLine tone="danger">{status}</StatusLine>
      <div className="file-list">
        {items.map((item) => (
          <div className="file-row" key={item.id}>
            <span>{item.type}</span>
            <strong>
              {item.bindAddr}:{item.bindPort} {" -> "} {item.remoteHost}:{item.remotePort}
            </strong>
            <span>{item.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
