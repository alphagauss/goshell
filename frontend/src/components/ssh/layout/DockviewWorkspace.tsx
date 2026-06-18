import { useEffect, useRef, useState } from "react";
import { DockviewReact } from "dockview-react";
import type { DockviewApi } from "dockview";
import "dockview-react/dist/styles/dockview.css";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/stores/configStore";
import { logger } from "@/lib/logger";
import { eventPayload, eventsApi } from "@/lib/wails";
import type {
  DockviewCloseTerminalEvent,
  DockviewOpenTerminalEvent,
  DockviewTerminalsChangedEvent,
} from "@/types";
import {
  createWorkspacePanelId,
  createWorkspacePanelTitle,
  dockviewPanelComponents,
  getWorkspacePanelDefinition,
  type WorkspacePanelParams,
  type WorkspacePanelType,
  workspacePanelDefinitions,
} from "@/components/ssh/layout/panelRegistry";
import { createWorkspaceContextMenu } from "@/components/ssh/layout/PanelContextMenu";
import { createTerminalSessionID } from "@/components/ssh/terminal/sessionManager";

export function DockviewWorkspace({ connID }: { connID: string }) {
  const [ready, setReady] = useState(false);
  const apiRef = useRef<DockviewApi | null>(null);
  const workspaceLog = logger.scope("ssh.dockview");
  const theme = useConfigStore().config?.ui?.theme === "light" ? "dockview-theme-light" : "dockview-theme-dark";

  function updateConnectionForPanels(nextConnID = connID) {
    const api = apiRef.current;
    if (!api) return;

    for (const panel of api.panels) {
      const params = panel.api.getParameters<WorkspacePanelParams>();
      panel.api.updateParameters({
        ...params,
        connID: nextConnID,
      });
    }
  }

  function emitTerminalsChanged(nextConnID = connID) {
    const api = apiRef.current;
    if (!api) return;

    const terminalPanelIDs = api.panels
      .filter((panel) => panel.api.getParameters<WorkspacePanelParams>().panelType === "terminal")
      .map((panel) => panel.id);
    const terminalSessionIDs = api.panels
      .filter((panel) => panel.api.getParameters<WorkspacePanelParams>().panelType === "terminal")
      .map((panel) => panel.api.getParameters<WorkspacePanelParams>().sessionID)
      .filter((sessionID): sessionID is string => Boolean(sessionID));

    const payload: DockviewTerminalsChangedEvent = {
      connID: nextConnID,
      terminalPanelIDs,
      terminalSessionIDs,
      activePanelID: api.activePanel?.id,
      timestamp: Date.now(),
    };

    eventsApi.emit("dockview:terminals-changed", payload);
  }

  function openTerminal(nextConnID = connID, isAI = false) {
    const api = apiRef.current;
    if (!api) return;

    const terminalPanels = api.panels.filter(
      (panel) => panel.api.getParameters<WorkspacePanelParams>().panelType === "terminal",
    );
    const terminalCount = terminalPanels.length;
    const aiTerminalCount = terminalPanels.filter((panel) => panel.api.getParameters<WorkspacePanelParams>().isAI).length;
    const sessionID = createTerminalSessionID(nextConnID, isAI);
    const panelID = createWorkspacePanelId("terminal");

    api.addPanel({
      id: panelID,
      component: "terminal",
      title: isAI ? `AI 终端 ${aiTerminalCount + 1}` : createWorkspacePanelTitle("terminal", terminalCount + 1),
      params: {
        connID: nextConnID,
        panelType: "terminal",
        sessionID,
        isAI,
      },
    });

    workspaceLog.info("打开终端面板", { connID: nextConnID, panelID, sessionID, isAI });
    emitTerminalsChanged(nextConnID);
  }

  function openPanel(panelType: WorkspacePanelType) {
    const api = apiRef.current;
    if (!api) return;

    const definition = getWorkspacePanelDefinition(panelType);
    if (!definition) return;

    if (definition.singleInstance) {
      const panelID = createWorkspacePanelId(panelType);
      const existing = api.getPanel(panelID);
      if (existing) {
        existing.api.setActive();
        return;
      }

      api.addPanel({
        id: panelID,
        component: definition.component,
        title: definition.label,
        params: {
          connID,
          panelType,
        },
      });
      workspaceLog.info("打开面板", { connID, panelType, panelID });
      emitTerminalsChanged(connID);
      return;
    }

    openTerminal(connID);
  }

  function closePanelsByType(panelType: WorkspacePanelType) {
    const api = apiRef.current;
    if (!api) return;

    const panels = api.panels.filter((panel) => panel.api.getParameters<WorkspacePanelParams>().panelType === panelType);
    for (const panel of panels) {
      panel.api.close();
    }
    workspaceLog.warn("关闭同类型面板", { connID, panelType, count: panels.length });
    emitTerminalsChanged(connID);
  }

  useEffect(() => {
    updateConnectionForPanels(connID);
    emitTerminalsChanged(connID);
  }, [connID]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !ready) return undefined;

    const openTerminalUnsubscribe = eventsApi.on<DockviewOpenTerminalEvent>("dockview:open-terminal", (event) => {
      const payload = eventPayload(event);
      if (!payload || payload.connID !== connID) {
        return;
      }

      openTerminal(payload.connID, Boolean(payload.isAI));
    });

    const closeTerminalUnsubscribe = eventsApi.on<DockviewCloseTerminalEvent>("dockview:close-terminal", (event) => {
      const payload = eventPayload(event);
      if (!payload || payload.connID !== connID) {
        return;
      }

      const terminalPanels = api.panels.filter(
        (panel) =>
          panel.api.getParameters<WorkspacePanelParams>().panelType === "terminal" &&
          (!payload.isAI || panel.api.getParameters<WorkspacePanelParams>().isAI),
      );
      const target = payload.sessionID
        ? terminalPanels.find((panel) => panel.api.getParameters<WorkspacePanelParams>().sessionID === payload.sessionID)
        : terminalPanels[terminalPanels.length - 1];

      target?.api.close();
      emitTerminalsChanged(connID);
    });

    const addUnsubscribe = api.onDidAddPanel(() => emitTerminalsChanged(connID));
    const removeUnsubscribe = api.onDidRemovePanel(() => emitTerminalsChanged(connID));
    const activeUnsubscribe = api.onDidActivePanelChange(() => emitTerminalsChanged(connID));

    emitTerminalsChanged(connID);

    return () => {
      openTerminalUnsubscribe();
      closeTerminalUnsubscribe();
      addUnsubscribe.dispose();
      removeUnsubscribe.dispose();
      activeUnsubscribe.dispose();
    };
  }, [ready, connID]);

  return (
    <div className={`dockview-shell ${theme}`}>
      <div className="dockview-toolbar">
        {workspacePanelDefinitions.map((definition) => {
          const Icon = definition.icon;
          return (
            <Button key={definition.type} size="sm" variant="secondary" onClick={() => openPanel(definition.type)}>
              <Icon size={14} />
              <span>{definition.label}</span>
            </Button>
          );
        })}
      </div>

      <div className="dockview-body">
        <DockviewReact
          components={dockviewPanelComponents}
          getTabContextMenuItems={createWorkspaceContextMenu({
            openTerminal,
            closePanelsByType,
          })}
          onReady={({ api }) => {
            apiRef.current = api;
            setReady(true);
            if (api.panels.length === 0) {
              openTerminal(connID);
            } else {
              updateConnectionForPanels(connID);
            }
          }}
        />
      </div>

      {!ready ? <div className="dockview-loading">正在加载工作区...</div> : null}
    </div>
  );
}
