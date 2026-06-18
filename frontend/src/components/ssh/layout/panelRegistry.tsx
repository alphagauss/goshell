import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
import {
  Bot,
  Files,
  Flame,
  ListRestart,
  Monitor,
  PlaySquare,
  ScrollText,
  Terminal as TerminalIcon,
  Waypoints,
} from "lucide-react";
import type { IDockviewPanelProps } from "dockview";
import { AIChatPanel } from "@/components/ssh/AIChatPanel";
import { CommandPanel } from "@/components/ssh/CommandPanel";
import { FilePanel } from "@/components/ssh/FilePanel";
import { FirewallPanel } from "@/components/ssh/FirewallPanel";
import { LogsPanel } from "@/components/ssh/LogsPanel";
import { MonitorPanel } from "@/components/ssh/MonitorPanel";
import { PortForwardPanel } from "@/components/ssh/PortForwardPanel";
import { ProcessGuardPanel } from "@/components/ssh/ProcessGuardPanel";
import { TerminalPanel } from "@/components/ssh/TerminalPanel";
import { createTerminalSessionID } from "@/components/ssh/terminal/sessionManager";

export type WorkspacePanelType =
  | "terminal"
  | "file"
  | "monitor"
  | "ai"
  | "forward"
  | "firewall"
  | "guard"
  | "logs"
  | "commands";

export interface WorkspacePanelParams {
  connID: string;
  panelType: WorkspacePanelType;
  sessionID?: string;
  isAI?: boolean;
}

export interface WorkspacePanelDefinition {
  type: WorkspacePanelType;
  label: string;
  icon: LucideIcon;
  component: string;
  singleInstance: boolean;
}

function createPanelComponent(render: (connID: string) => JSX.Element) {
  return function WorkspacePanel(props: IDockviewPanelProps<WorkspacePanelParams>) {
    return render(props.params.connID);
  };
}

function createTerminalPanelComponent() {
  return function WorkspaceTerminalPanel(props: IDockviewPanelProps<WorkspacePanelParams>) {
    const fallbackSessionID = useRef(
      createTerminalSessionID(props.params.connID, Boolean(props.params.isAI)),
    );
    const sessionID = props.params.sessionID ?? fallbackSessionID.current;

    return (
      <TerminalPanel
        connID={props.params.connID}
        sessionID={sessionID}
        isAI={Boolean(props.params.isAI)}
      />
    );
  };
}

export const workspacePanelDefinitions: WorkspacePanelDefinition[] = [
  { type: "terminal", label: "终端", icon: TerminalIcon, component: "terminal", singleInstance: false },
  { type: "file", label: "文件", icon: Files, component: "file", singleInstance: true },
  { type: "monitor", label: "监控", icon: Monitor, component: "monitor", singleInstance: true },
  { type: "ai", label: "AI", icon: Bot, component: "ai", singleInstance: true },
  { type: "forward", label: "转发", icon: Waypoints, component: "forward", singleInstance: true },
  { type: "firewall", label: "防火墙", icon: Flame, component: "firewall", singleInstance: true },
  { type: "guard", label: "守护", icon: ListRestart, component: "guard", singleInstance: true },
  { type: "logs", label: "日志", icon: ScrollText, component: "logs", singleInstance: true },
  { type: "commands", label: "命令", icon: PlaySquare, component: "commands", singleInstance: true },
];

export const dockviewPanelComponents: Record<
  WorkspacePanelType,
  (props: IDockviewPanelProps<WorkspacePanelParams>) => JSX.Element
> = {
  terminal: createTerminalPanelComponent(),
  file: createPanelComponent((connID) => <FilePanel connID={connID} />),
  monitor: createPanelComponent((connID) => <MonitorPanel connID={connID} />),
  ai: createPanelComponent((connID) => <AIChatPanel connID={connID} />),
  forward: createPanelComponent((connID) => <PortForwardPanel connID={connID} />),
  firewall: createPanelComponent((connID) => <FirewallPanel connID={connID} />),
  guard: createPanelComponent((connID) => <ProcessGuardPanel connID={connID} />),
  logs: createPanelComponent((connID) => <LogsPanel connID={connID} />),
  commands: createPanelComponent((connID) => <CommandPanel connID={connID} />),
};

export function getWorkspacePanelDefinition(panelType: WorkspacePanelType) {
  return workspacePanelDefinitions.find((definition) => definition.type === panelType);
}

export function createWorkspacePanelId(panelType: WorkspacePanelType) {
  if (panelType === "terminal") {
    return `terminal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  return `panel-${panelType}`;
}

export function createWorkspacePanelTitle(panelType: WorkspacePanelType, index = 1) {
  const definition = getWorkspacePanelDefinition(panelType);
  if (!definition) {
    return panelType;
  }
  if (panelType === "terminal") {
    return index > 1 ? `${definition.label} ${index}` : definition.label;
  }
  return definition.label;
}
