import { useEffect, useRef, useState } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { eventPayload, eventsApi, sshApi, type TerminalOutputEvent } from "@/lib/wails";
import { endTerminalSession, markTerminalSessionError, markTerminalSessionReady, startTerminalSession } from "@/components/ssh/terminal/sessionManager";
import type { TerminalSessionReadyEvent } from "@/types";

export function TerminalPanel({
  connID,
  sessionID,
  isAI = false,
}: {
  connID: string;
  sessionID: string;
  isAI?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!connID || !sessionID || !hostRef.current) return undefined;

    startTerminalSession(connID, sessionID, isAI);
    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
      fontSize: 13,
      theme: {
        background: "#121212",
        foreground: "#e2e8f0",
        cursor: "#63b3ed",
        selectionBackground: "#2f4f67",
      },
    });
    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());
    terminal.open(hostRef.current);
    fitAddon.fit();
    terminal.focus();

    const outputUnsubscribe = eventsApi.on<TerminalOutputEvent>("ssh:terminal-output", (event) => {
      const payload = eventPayload<TerminalOutputEvent>(event);
      if (payload?.connID !== connID) return;
      if (payload.sessionID && payload.sessionID !== sessionID) return;
      terminal.write(payload.data ?? "");
    });

    const dataSubscription = terminal.onData((data) => {
      void sshApi.writeToTerminal(connID, sessionID, data).catch((err) => {
        setStatus(extractErrorMessage(err));
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      void sshApi.resizeTerminal(connID, sessionID, terminal.cols, terminal.rows).catch(() => undefined);
    });
    resizeObserver.observe(hostRef.current);

    void sshApi
      .startShellSession(connID, sessionID)
      .then(() => sshApi.resizeTerminal(connID, sessionID, terminal.cols, terminal.rows))
      .then(() => {
        const payload: TerminalSessionReadyEvent = {
          connID,
          sessionID,
          isAI,
          timestamp: Date.now(),
        };
        markTerminalSessionReady(connID, sessionID, isAI);
        eventsApi.emit("terminal:session-ready", payload);
        setStatus("");
      })
      .catch((err) => {
        const message = extractErrorMessage(err);
        setStatus(message);
        markTerminalSessionError(connID, sessionID, message, isAI);
      });

    return () => {
      outputUnsubscribe();
      dataSubscription.dispose();
      resizeObserver.disconnect();
      void sshApi.closeShellSession(connID, sessionID).catch(() => undefined);
      endTerminalSession(connID, sessionID);
      terminal.dispose();
    };
  }, [connID, sessionID, isAI]);

  return (
    <div className="terminal-panel">
      <StatusLine tone="danger">{status}</StatusLine>
      <div ref={hostRef} className="terminal-host" />
    </div>
  );
}
