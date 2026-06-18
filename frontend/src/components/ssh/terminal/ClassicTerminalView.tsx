import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type MouseEventHandler } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { eventPayload, eventsApi, sshApi, type TerminalOutputEvent } from "@/lib/wails";
import { useConfigStore } from "@/stores/configStore";
import {
  endTerminalSession,
  markTerminalSessionError,
  markTerminalSessionReady,
  startTerminalSession,
} from "@/components/ssh/terminal/sessionManager";
import type { TerminalSessionReadyEvent } from "@/types";

export interface ClassicTerminalHandle {
  sendInput: (data: string) => Promise<void>;
  focus: () => void;
  search: (query: string) => void;
  searchNext: () => void;
  searchPrevious: () => void;
  clearSearch: () => void;
  selectAll: () => void;
  copySelection: () => Promise<void>;
}

export interface ClassicTerminalViewProps {
  connID: string;
  sessionID: string;
  isAI?: boolean;
  className?: string;
  onCommand?: (command: string) => void;
  onOutput?: (data: string) => void;
  onReady?: () => void;
  onContextMenu?: MouseEventHandler<HTMLDivElement>;
  onStatusChange?: (status: string, tone: "muted" | "success" | "warning" | "danger") => void;
}

export const ClassicTerminalView = forwardRef<ClassicTerminalHandle, ClassicTerminalViewProps>(
  function ClassicTerminalView(
    {
      connID,
      sessionID,
      isAI = false,
      className,
      onCommand,
      onOutput,
      onReady,
      onContextMenu,
      onStatusChange,
    },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const searchAddonRef = useRef<SearchAddon | null>(null);
    const commandBufferRef = useRef("");
    const lastSearchRef = useRef("");
    const onCommandRef = useRef(onCommand);
    const onOutputRef = useRef(onOutput);
    const onReadyRef = useRef(onReady);
    const onStatusChangeRef = useRef(onStatusChange);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusTone, setStatusTone] = useState<"muted" | "success" | "warning" | "danger">("muted");
    const config = useConfigStore().config;
    const fontSize = config?.terminal?.fontSize ?? 13;

    useEffect(() => {
      onCommandRef.current = onCommand;
    }, [onCommand]);

    useEffect(() => {
      onOutputRef.current = onOutput;
    }, [onOutput]);

    useEffect(() => {
      onReadyRef.current = onReady;
    }, [onReady]);

    useEffect(() => {
      onStatusChangeRef.current = onStatusChange;
    }, [onStatusChange]);

    useImperativeHandle(
      ref,
      () => ({
        async sendInput(data: string) {
          await sshApi.writeToTerminal(connID, sessionID, data);
        },
        focus() {
          terminalRef.current?.focus();
        },
        search(query: string) {
          const searchAddon = searchAddonRef.current;
          if (!searchAddon || !query) {
            return;
          }

          lastSearchRef.current = query;
          searchAddon.findNext(query);
        },
        searchNext() {
          const searchAddon = searchAddonRef.current;
          if (!searchAddon || !lastSearchRef.current) {
            return;
          }
          searchAddon.findNext(lastSearchRef.current);
        },
        searchPrevious() {
          const searchAddon = searchAddonRef.current;
          if (!searchAddon || !lastSearchRef.current) {
            return;
          }
          searchAddon.findPrevious(lastSearchRef.current);
        },
        clearSearch() {
          searchAddonRef.current?.clearDecorations();
          terminalRef.current?.clearSelection();
          lastSearchRef.current = "";
        },
        selectAll() {
          terminalRef.current?.selectAll();
        },
        async copySelection() {
          const terminal = terminalRef.current;
          if (!terminal?.hasSelection()) {
            return;
          }
          await navigator.clipboard.writeText(terminal.getSelection());
        },
      }),
      [connID, sessionID],
    );

    useEffect(() => {
      if (!connID || !sessionID || !hostRef.current) {
        return undefined;
      }

      let disposed = false;
      startTerminalSession(connID, sessionID, isAI);
      setStatusMessage("Connecting...");
      setStatusTone("warning");
      onStatusChangeRef.current?.("Connecting...", "warning");

      const terminal = new Terminal({
        cursorBlink: true,
        convertEol: true,
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        fontSize,
        theme: {
          background: "#121212",
          foreground: "#e2e8f0",
          cursor: "#63b3ed",
          selectionBackground: "#2f4f67",
        },
      });
      terminalRef.current = terminal;

      const fitAddon = new FitAddon();
      const searchAddon = new SearchAddon();
      searchAddonRef.current = searchAddon;

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(searchAddon);
      terminal.loadAddon(new WebLinksAddon());
      terminal.open(hostRef.current);
      fitAddon.fit();
      terminal.focus();

      const outputUnsubscribe = eventsApi.on<TerminalOutputEvent>("ssh:terminal-output", (event) => {
        const payload = eventPayload<TerminalOutputEvent>(event);
        if (!payload || payload.connID !== connID) {
          return;
        }
        if (payload.sessionID && payload.sessionID !== sessionID) {
          return;
        }

        const data = payload.data ?? "";
        onOutputRef.current?.(data);
        terminal.write(data);
      });

      const dataSubscription = terminal.onData((data) => {
        if (data.includes("\u001b")) {
          void sshApi.writeToTerminal(connID, sessionID, data).catch((err) => {
            const message = extractErrorMessage(err);
            setStatusMessage(message);
            setStatusTone("danger");
            onStatusChangeRef.current?.(message, "danger");
          });
          return;
        }

        for (const char of data) {
          if (char === "\r" || char === "\n") {
            const command = commandBufferRef.current.trim();
            commandBufferRef.current = "";
            if (command) {
              onCommandRef.current?.(command);
            }
          } else if (char === "\u007F") {
            commandBufferRef.current = commandBufferRef.current.slice(0, -1);
          } else {
            commandBufferRef.current += char;
          }
        }

        void sshApi.writeToTerminal(connID, sessionID, data).catch((err) => {
          const message = extractErrorMessage(err);
          setStatusMessage(message);
          setStatusTone("danger");
          onStatusChangeRef.current?.(message, "danger");
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
          if (disposed) {
            return;
          }

          const payload: TerminalSessionReadyEvent = {
            connID,
            sessionID,
            isAI,
            timestamp: Date.now(),
          };

          markTerminalSessionReady(connID, sessionID, isAI);
          eventsApi.emit("terminal:session-ready", payload);
          onReadyRef.current?.();
          setStatusMessage("Connected");
          setStatusTone("success");
          onStatusChangeRef.current?.("Connected", "success");
        })
        .catch((err) => {
          const message = extractErrorMessage(err);
          setStatusMessage(message);
          setStatusTone("danger");
          markTerminalSessionError(connID, sessionID, message, isAI);
          onStatusChangeRef.current?.(message, "danger");
        });

      return () => {
        disposed = true;
        outputUnsubscribe();
        dataSubscription.dispose();
        resizeObserver.disconnect();
        void sshApi.closeShellSession(connID, sessionID).catch(() => undefined);
        endTerminalSession(connID, sessionID);
        searchAddonRef.current = null;
        terminal.dispose();
        terminalRef.current = null;
      };
    }, [connID, sessionID, isAI, fontSize]);

    return (
      <div className={cn("terminal-panel", className)} onContextMenu={onContextMenu}>
        <StatusLine tone={statusTone}>{statusMessage}</StatusLine>
        <div ref={hostRef} className="terminal-host" />
      </div>
    );
  },
);
