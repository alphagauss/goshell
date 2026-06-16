import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { sshApi } from "@/lib/wails";

export function LogsPanel({ connID }: { connID: string }) {
  const [command, setCommand] = useState("journalctl -n 100 --no-pager");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    setStatus("");
    try {
      setOutput(String(await sshApi.runCommand(connID, command)));
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  return (
    <section className="tool-panel ssh-panel command-panel">
      <div className="panel-heading">
        <h2>日志</h2>
        <Button variant="primary" onClick={() => void load()}>
          读取
        </Button>
      </div>
      <textarea className="input-base command-input" value={command} onChange={(event) => setCommand(event.target.value)} />
      <StatusLine tone="danger">{status}</StatusLine>
      <pre className="command-output">{output}</pre>
    </section>
  );
}
