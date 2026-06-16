import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { firewallApi } from "@/lib/wails";

export function FirewallPanel({ connID }: { connID: string }) {
  const [info, setInfo] = useState<Record<string, any> | null>(null);
  const [command, setCommand] = useState("sudo ufw status numbered");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    setStatus("");
    try {
      setInfo(await firewallApi.GetFirewallInfo(connID));
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  async function run() {
    setStatus("");
    try {
      setOutput(String(await firewallApi.RunCustomCommand(connID, command)));
      await load();
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, [connID]);

  return (
    <section className="tool-panel ssh-panel command-panel">
      <div className="panel-heading">
        <h2>防火墙</h2>
        <span className="status-pill">{info?.type || "unknown"}</span>
      </div>
      <textarea className="input-base command-input" value={command} onChange={(event) => setCommand(event.target.value)} />
      <StatusLine tone="danger">{status}</StatusLine>
      <div className="panel-actions">
        <Button variant="primary" onClick={() => void run()}>
          <Shield size={15} />
          执行
        </Button>
      </div>
      <pre className="command-output">{output || JSON.stringify(info, null, 2)}</pre>
    </section>
  );
}
