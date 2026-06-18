import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type RefObject } from "react";
import { ClassicTerminalView, type ClassicTerminalHandle } from "@/components/ssh/terminal/ClassicTerminalView";
import { CommandHistoryDialog } from "@/components/ssh/terminal/components/CommandHistoryDialog";
import { CompletionPopup } from "@/components/ssh/terminal/components/CompletionPopup";
import { TerminalBlock } from "@/components/ssh/terminal/components/TerminalBlock";
import { TerminalContextMenu } from "@/components/ssh/terminal/components/TerminalContextMenu";
import { TerminalSearchBar } from "@/components/ssh/terminal/components/TerminalSearchBar";
import { TerminalStatusBar } from "@/components/ssh/terminal/components/TerminalStatusBar";
import { TerminalToolbar } from "@/components/ssh/terminal/components/TerminalToolbar";
import { useBlockManager } from "@/components/ssh/terminal/hooks/useBlockManager";
import { useCommandCompletion } from "@/components/ssh/terminal/hooks/useCommandCompletion";
import { useCommandHistory } from "@/components/ssh/terminal/hooks/useCommandHistory";
import { useRecording } from "@/components/ssh/terminal/hooks/useRecording";
import { useTerminalSearch } from "@/components/ssh/terminal/hooks/useTerminalSearch";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useConfigStore } from "@/stores/configStore";
import { highlightOutput } from "@/components/ssh/terminal/utils/highlightAddon";

type TerminalView = "structured" | "classic";
type StatusTone = "muted" | "success" | "warning" | "danger";

export function StructuredTerminalPanel({
  connID,
  sessionID,
  isAI = false,
}: {
  connID: string;
  sessionID: string;
  isAI?: boolean;
}) {
  const config = useConfigStore().config;
  const terminalRef = useRef<ClassicTerminalHandle | null>(null);
  const structuredInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const blocksEndRef = useRef<HTMLDivElement | null>(null);
  const initializedViewRef = useRef(false);
  const [view, setView] = useState<TerminalView>("structured");
  const [command, setCommand] = useState("");
  const [statusLabel, setStatusLabel] = useState("Connecting...");
  const [statusTone, setStatusTone] = useState<StatusTone>("warning");
  const [showHistory, setShowHistory] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const blockManager = useBlockManager();
  const history = useCommandHistory(`terminal-history-${connID}`);
  const completion = useCommandCompletion();
  const recording = useRecording(sessionID);
  const search = useTerminalSearch(blockManager.blocks);
  const toast = useToast();
  const confirm = useConfirm();
  const terminalLog = logger.scope("ssh.terminal");
  const commandSendMode = config?.terminal?.commandSendMode ?? "enter";
  const initialView = config?.terminal?.defaultType === "classic" ? "classic" : "structured";

  useEffect(() => {
    if (initializedViewRef.current || !config) {
      return;
    }

    initializedViewRef.current = true;
    setView(initialView);
  }, [config, initialView]);

  useEffect(() => {
    if (search.visible) {
      searchInputRef.current?.focus();
      return;
    }

    if (showHistory) {
      return;
    }

    if (view === "classic") {
      terminalRef.current?.focus();
      return;
    }

    structuredInputRef.current?.focus();
  }, [search.visible, showHistory, view]);

  useEffect(() => {
    if (view !== "structured") {
      return;
    }

    blocksEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [blockManager.blocks.length, view]);

  useEffect(() => {
    if (view !== "structured" || !search.activeResult) {
      return;
    }

    const element = document.querySelector<HTMLElement>(`[data-block-id="${search.activeResult.blockID}"]`);
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("is-search-hit");
    window.setTimeout(() => element.classList.remove("is-search-hit"), 1500);
  }, [search.activeResult, view]);

  function updateStatus(nextLabel: string, nextTone: StatusTone) {
    setStatusLabel(nextLabel);
    setStatusTone(nextTone);
  }

  function registerCommand(rawCommand: string) {
    const trimmed = rawCommand.trim();
    if (!trimmed) {
      return null;
    }

    history.addCommand(trimmed);
    blockManager.startCommand(trimmed);
    recording.recordCommand(trimmed);
    terminalLog.info("terminal command", { connID, sessionID, command: trimmed, isAI });
    return trimmed;
  }

  function appendStructuredOutput(data: string) {
    if (!data) {
      return;
    }

    const output = highlightOutput(data);
    blockManager.appendOutput(output);
    recording.recordOutput(output);
  }

  async function submitStructuredCommand(rawCommand: string) {
    const commandText = rawCommand.trim();
    if (!commandText) {
      return;
    }

    registerCommand(commandText);
    recording.recordInput(rawCommand);

    try {
      await terminalRef.current?.sendInput(`${rawCommand}\r`);
      setCommand("");
      history.resetNavigation();
      completion.reset();
      structuredInputRef.current?.focus();
    } catch (err) {
      const message = extractErrorMessage(err);
      updateStatus(message, "danger");
      blockManager.finishActiveBlock("failed");
      toast.error("Send failed", message);
    }
  }

  function handleClassicCommand(commandText: string) {
    registerCommand(commandText);
    recording.recordInput(commandText);
  }

  function handleTerminalOutput(data: string) {
    appendStructuredOutput(data);
  }

  function handleToggleView() {
    setView((current) => (current === "classic" ? "structured" : "classic"));
  }

  function handleOpenHistory() {
    setShowHistory(true);
  }

  function handleOpenSearch() {
    const initialQuery = search.query || command;
    search.open(initialQuery);
    if (view === "classic") {
      if (initialQuery) {
        terminalRef.current?.search(initialQuery);
      } else {
        terminalRef.current?.clearSearch();
      }
    }
  }

  function handleSearchChange(value: string) {
    search.setQuery(value);
    if (view === "classic") {
      if (value) {
        terminalRef.current?.search(value);
      } else {
        terminalRef.current?.clearSearch();
      }
    }
  }

  function handleSearchNext() {
    if (view === "classic") {
      terminalRef.current?.searchNext();
      return;
    }
    search.next();
  }

  function handleSearchPrev() {
    if (view === "classic") {
      terminalRef.current?.searchPrevious();
      return;
    }
    search.previous();
  }

  function handleSearchClose() {
    search.close();
    if (view === "classic") {
      terminalRef.current?.clearSearch();
    }
  }

  async function handleContextPaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        return;
      }

      if (view === "classic") {
        await terminalRef.current?.sendInput(text);
      } else {
        setCommand((current) => `${current}${text}`);
        structuredInputRef.current?.focus();
      }
    } finally {
      setContextMenuVisible(false);
    }
  }

  function handleContextCopy() {
    if (view === "classic") {
      void terminalRef.current?.copySelection();
      setContextMenuVisible(false);
      return;
    }

    const selectedText = window.getSelection()?.toString();
    if (selectedText) {
      void navigator.clipboard.writeText(selectedText);
      setContextMenuVisible(false);
      return;
    }

    const activeBlock = blockManager.blocks.length > 0 ? blockManager.blocks[blockManager.blocks.length - 1] : null;
    const text = activeBlock?.command ? `$ ${activeBlock.command}\n${activeBlock.output}` : activeBlock?.output ?? "";
    if (text) {
      void navigator.clipboard.writeText(text);
    }
    setContextMenuVisible(false);
  }

  function handleContextSelectAll() {
    if (view === "classic") {
      terminalRef.current?.selectAll();
      setContextMenuVisible(false);
      return;
    }

    const element = structuredInputRef.current;
    if (element && "select" in element) {
      element.select();
    }
    setContextMenuVisible(false);
  }

  function handleContextSearch() {
    handleOpenSearch();
    setContextMenuVisible(false);
  }

  async function handleClear() {
    const confirmed = await confirm({
      title: "Clear terminal",
      description: "Clear the current terminal output and structured command blocks?",
      confirmText: "Clear",
      cancelText: "Cancel",
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    blockManager.clearBlocks();
    completion.reset();
    history.resetNavigation();
    search.reset();
    terminalRef.current?.clearSearch();
    setCommand("");
    terminalLog.warn("terminal cleared", { connID, sessionID });
    toast.success("Terminal cleared");
  }

  function handleToggleRecording() {
    const wasRecording = recording.isRecording;
    const stopped = recording.toggleRecording();

    if (!wasRecording) {
      terminalLog.info("recording started", { connID, sessionID });
      return;
    }

    if (stopped.length > 0) {
      toast.success("Recording saved", `Exported ${stopped.length} entries`);
    }
    terminalLog.info("recording stopped", { connID, sessionID, entries: stopped.length });
  }

  function handleHistorySelect(commandText: string) {
    setCommand(commandText);
    history.updateCurrentInput(commandText);
    structuredInputRef.current?.focus();
    setShowHistory(false);
  }

  async function handleHistoryExecute(commandText: string) {
    setShowHistory(false);
    setCommand(commandText);
    history.updateCurrentInput(commandText);
    await submitStructuredCommand(commandText);
  }

  function handleOutputBlockCopy(blockID: string) {
    const content = blockManager.getBlockContent(blockID);
    const text = content
      ? [content.command ? `$ ${content.command}` : "", content.output].filter(Boolean).join("\n")
      : "";
    if (text) {
      void navigator.clipboard.writeText(text);
    }
  }

  function handleOutputBlockReExecute(blockID: string) {
    const content = blockManager.getBlockContent(blockID);
    if (!content?.command) {
      return;
    }

    setView("structured");
    setCommand(content.command);
    history.updateCurrentInput(content.command);
    structuredInputRef.current?.focus();
  }

  function handleOutputBlockRemove(blockID: string) {
    blockManager.removeBlock(blockID);
  }

  function handleInputChange(value: string) {
    setCommand(value);
    history.updateCurrentInput(value);

    if (commandSendMode === "button" && structuredInputRef.current instanceof HTMLTextAreaElement) {
      structuredInputRef.current.style.height = "auto";
      structuredInputRef.current.style.height = `${Math.min(structuredInputRef.current.scrollHeight, 120)}px`;
    }
  }

  async function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const modKey = event.ctrlKey || event.metaKey;

    if (completion.isVisible && completion.suggestions.length > 0) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        completion.selectPrevious();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        completion.selectNext();
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        const selected = completion.getSelected();
        if (selected) {
          handleInputChange(completion.applyCompletion(command, selected));
        }
        completion.reset();
        return;
      }
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const suggestions = completion.getSuggestions(command);
      if (suggestions.length === 1) {
        handleInputChange(completion.applyCompletion(command, suggestions[0]));
        completion.reset();
      } else if (suggestions.length > 1) {
        completion.show();
      }
      return;
    }

    if (event.key === "ArrowUp" && !completion.isVisible) {
      event.preventDefault();
      const previous = history.getPreviousCommand(command);
      if (previous !== null) {
        handleInputChange(previous);
      }
      return;
    }

    if (event.key === "ArrowDown" && !completion.isVisible) {
      event.preventDefault();
      const next = history.getNextCommand();
      if (next !== null) {
        handleInputChange(next);
      }
      return;
    }

    if (event.key === "Escape") {
      completion.reset();
      handleSearchClose();
      setShowHistory(false);
      return;
    }

    if (modKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      handleOpenSearch();
      return;
    }

    if (modKey && event.key.toLowerCase() === "r") {
      event.preventDefault();
      handleToggleRecording();
      return;
    }

    if (modKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      await handleClear();
      return;
    }

    if (modKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      blockManager.cancelCommand();
      setCommand("");
      history.resetNavigation();
      try {
        await terminalRef.current?.sendInput("\x03");
      } catch (err) {
        updateStatus(extractErrorMessage(err), "danger");
      }
      return;
    }

    if (commandSendMode !== "button" && event.key === "Enter" && !modKey) {
      event.preventDefault();
      await submitStructuredCommand(command);
      return;
    }

    if (commandSendMode === "button" && modKey && event.key === "Enter") {
      event.preventDefault();
      await submitStructuredCommand(command);
    }
  }

  function handleStructuredContextMenu(event: MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    setContextMenuPos({ x: event.clientX, y: event.clientY });
    setContextMenuVisible(true);
  }

  function handleClassicStatusChange(nextLabel: string, nextTone: StatusTone) {
    updateStatus(nextLabel, nextTone);
  }

  const searchSummary = search.visible && view === "structured" ? `${search.results.length} hits` : undefined;
  const recordingSummary = recording.isRecording ? `Recording ${recording.formattedDuration}` : undefined;

  return (
    <div className="structured-terminal-shell">
      <TerminalToolbar
        view={view}
        statusLabel={statusLabel}
        statusTone={statusTone}
        isRecording={recording.isRecording}
        commandCount={blockManager.stats.commands}
        onSwitchView={handleToggleView}
        onToggleRecording={handleToggleRecording}
        onOpenHistory={() => setShowHistory(true)}
        onOpenSearch={handleOpenSearch}
        onClear={() => void handleClear()}
      />

      <div className="structured-terminal-shell__body" onContextMenu={handleStructuredContextMenu}>
        <ClassicTerminalView
          ref={terminalRef}
          connID={connID}
          sessionID={sessionID}
          isAI={isAI}
          className={cn("structured-terminal-shell__classic", view === "classic" ? "is-visible" : "is-hidden")}
          onCommand={handleClassicCommand}
          onOutput={handleTerminalOutput}
          onContextMenu={handleStructuredContextMenu}
          onReady={() => {
            if (view === "classic") {
              terminalRef.current?.focus();
            }
          }}
          onStatusChange={handleClassicStatusChange}
        />

        <div className={cn("structured-terminal-shell__structured", view === "structured" ? "is-visible" : "is-hidden")}>
          <TerminalSearchBar
            visible={search.visible}
            query={search.query}
            resultCount={view === "structured" ? search.results.length : null}
            currentIndex={view === "structured" ? search.activeIndex : null}
            onQueryChange={handleSearchChange}
            onNext={handleSearchNext}
            onPrev={handleSearchPrev}
            onClose={handleSearchClose}
            inputRef={searchInputRef as RefObject<HTMLInputElement | HTMLTextAreaElement | null>}
          />

          <TerminalContextMenu
            visible={contextMenuVisible}
            position={contextMenuPos}
            onCopy={handleContextCopy}
            onPaste={() => void handleContextPaste()}
            onSelectAll={handleContextSelectAll}
            onClear={() => void handleClear()}
            onSearch={handleContextSearch}
            onClose={() => setContextMenuVisible(false)}
          />

          <div className="structured-terminal-shell__blocks">
            {blockManager.blocks.length === 0 ? (
              <div className="empty-state structured-terminal-shell__empty">Type a command to start</div>
            ) : null}
            {blockManager.blocks.map((block) => (
              <TerminalBlock
                key={block.id}
                block={block}
                active={blockManager.activeBlock?.id === block.id}
                highlighted={search.activeResult?.blockID === block.id}
                onToggleCollapse={blockManager.toggleCollapse}
                onCopy={handleOutputBlockCopy}
                onRemove={handleOutputBlockRemove}
                onReExecute={handleOutputBlockReExecute}
              />
            ))}
            <div ref={blocksEndRef} />
          </div>

          <div className="structured-terminal-shell__composer">
            <span className="structured-terminal-shell__prompt">$</span>
            {commandSendMode === "button" ? (
              <textarea
                ref={structuredInputRef as RefObject<HTMLTextAreaElement>}
                className="input-base structured-terminal-shell__input structured-terminal-shell__textarea"
                value={command}
                placeholder="Type a command. Enter inserts a newline. Ctrl+Enter or Send submits."
                rows={1}
                onChange={(event) => handleInputChange(event.target.value)}
                onKeyDown={(event) => {
                  void handleInputKeyDown(event);
                }}
              />
            ) : (
              <input
                ref={structuredInputRef as RefObject<HTMLInputElement>}
                className="input-base structured-terminal-shell__input"
                value={command}
                placeholder="Type a command and press Enter"
                onChange={(event) => handleInputChange(event.target.value)}
                onKeyDown={(event) => {
                  void handleInputKeyDown(event);
                }}
              />
            )}
            {commandSendMode === "button" ? (
              <button
                type="button"
                className="structured-terminal-shell__send"
                onClick={() => void submitStructuredCommand(command)}
                disabled={!command.trim()}
              >
                Send
              </button>
            ) : null}
          </div>

          <CompletionPopup
            visible={completion.isVisible}
            suggestions={completion.suggestions}
            selectedIndex={completion.selectedIndex}
            position={{ top: -220, left: 16 }}
            onSelect={(index) => {
              const suggestion = completion.suggestions[index];
              if (!suggestion) {
                return;
              }

              handleInputChange(completion.applyCompletion(command, suggestion));
              completion.reset();
              structuredInputRef.current?.focus();
            }}
          />

          <TerminalStatusBar
            statusLabel={statusLabel}
            statusTone={statusTone}
            commandCount={blockManager.stats.commands}
            recordingLabel={recordingSummary}
            searchLabel={searchSummary}
          />
        </div>
      </div>

      <CommandHistoryDialog
        visible={showHistory}
        history={history.history}
        onOpenChange={setShowHistory}
        onSelect={handleHistorySelect}
        onExecute={(value) => {
          void handleHistoryExecute(value);
        }}
      />
    </div>
  );
}
