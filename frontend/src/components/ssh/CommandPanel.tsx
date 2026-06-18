import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { sshApi } from "@/lib/wails";
import type { CommandResult } from "@/types";

export function CommandPanel({ connID }: { connID: string }) {
  const [command, setCommand] = useState("uname -a");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");

  async function run() {
    if (!command.trim()) return;
    setStatus("");
    try {
      const result = await sshApi.executeCommand(connID, command);
      const text =
        typeof result === "string"
          ? result
          : `${(result as CommandResult | null)?.stdout ?? ""}${(result as CommandResult | null)?.stderr ? `\n${(result as CommandResult | null)?.stderr}` : ""}`;
      setOutput(text.trim() || JSON.stringify(result, null, 2));
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  return (
    <section className="tool-panel ssh-panel command-panel">
      <div className="panel-heading">
        <h2>命令</h2>
        <Button variant="primary" onClick={() => void run()}>
          <Play size={15} />
          运行
        </Button>
      </div>
      <textarea
        className="input-base command-input"
        value={command}
        onChange={(event) => setCommand(event.target.value)}
      />
      <StatusLine tone="danger">{status}</StatusLine>
      <pre className="command-output">{output}</pre>
    </section>
  );
}
