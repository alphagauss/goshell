import * as AIServiceBinding from "@bindings/goshell/internal/ai/aiservice.js";
import * as CloudServiceBinding from "@bindings/goshell/internal/ssh/cloudservice.js";
import * as ConfigServiceBinding from "@bindings/goshell/internal/ssh/configservice.js";
import * as FirewallServiceBinding from "@bindings/goshell/internal/ssh/firewallservice.js";
import * as GreetServiceBinding from "@bindings/goshell/internal/ssh/greetservice.js";
import * as PortForwardServiceBinding from "@bindings/goshell/internal/ssh/portforwardservice.js";
import * as ProcessGuardianServiceBinding from "@bindings/goshell/internal/ssh/processguardianservice.js";
import * as SSHServiceBinding from "@bindings/goshell/internal/ssh/sshservice.js";
import type { AppConfig, ConnectionInfo, SSHConfig } from "@/lib/wails/types";

type ServiceBinding = Record<string, (...args: any[]) => Promise<any>>;

const AIService = AIServiceBinding as ServiceBinding;
const CloudService = CloudServiceBinding as ServiceBinding;
const ConfigService = ConfigServiceBinding as ServiceBinding;
const FirewallService = FirewallServiceBinding as ServiceBinding;
const GreetService = GreetServiceBinding as ServiceBinding;
const PortForwardService = PortForwardServiceBinding as ServiceBinding;
const ProcessGuardianService = ProcessGuardianServiceBinding as ServiceBinding;
const SSHService = SSHServiceBinding as ServiceBinding;

export const sshApi = {
  testConnection: (config: SSHConfig) => SSHService.TestConnection(config),
  createAndConnect: (config: SSHConfig) => SSHService.CreateAndConnect(config),
  createAndConnectWithGroup: (config: SSHConfig, groupID: string) =>
    SSHService.CreateAndConnectWithGroup(config, groupID),
  connect: (connID: string, config: SSHConfig) => SSHService.Connect(connID, config),
  openSSHWindow: (groupID: string, groupName: string, activeConnID: string) =>
    SSHService.OpenSSHWindow(groupID, groupName, activeConnID),
  disconnect: (connID: string) => SSHService.Disconnect(connID),
  reconnect: (connID: string) => SSHService.Reconnect(connID),
  getAllConnections: () => SSHService.GetAllConnections() as Promise<ConnectionInfo[]>,
  getConnection: (id: string) => SSHService.GetConnection(id) as Promise<ConnectionInfo | null>,
  updateConnection: (connection: ConnectionInfo) => SSHService.UpdateConnection(connection),
  addConnection: (connection: ConnectionInfo) => SSHService.AddConnection(connection),
  getAllGroups: () => SSHService.GetAllGroups(),
  getGroupConnectionInfos: (groupID: string) =>
    SSHService.GetGroupConnectionInfos(groupID) as Promise<ConnectionInfo[]>,
  getDefaultGroupID: () => SSHService.GetDefaultGroupID(),
  createGroup: (name: string) => SSHService.CreateGroup(name),
  saveConnection: (id: string) => SSHService.SaveConnection(id),
  deleteConnection: (id: string) => SSHService.DeleteConnection(id),
  startShellSession: (connID: string, sessionID: string) =>
    SSHService.StartShellSessionWithID(connID, sessionID),
  writeToTerminal: (connID: string, sessionID: string, data: string) =>
    SSHService.WriteToTerminalByID(connID, sessionID, data),
  resizeTerminal: (connID: string, sessionID: string, cols: number, rows: number) =>
    SSHService.ResizeTerminalByID(connID, sessionID, cols, rows),
  closeShellSession: (connID: string, sessionID: string) =>
    SSHService.CloseShellSessionByID(connID, sessionID),
  listFiles: (connID: string, path: string) => SSHService.ListFiles(connID, path),
  executeCommand: (connID: string, command: string) => SSHService.ExecuteCommand(connID, command),
  runCommand: (connID: string, command: string) => SSHService.RunCommand(connID, command),
  getSystemStats: (connID: string) => SSHService.GetSystemStats(connID),
  getProcessList: (connID: string) => SSHService.GetProcessList(connID),
  clearWindowPositions: () => SSHService.ClearWindowPositions(),
};

export const configApi = {
  getConfig: () => ConfigService.GetConfig() as Promise<AppConfig>,
  setConfig: (config: AppConfig) => ConfigService.SetConfig(config),
  get: (category: string, key: string) => ConfigService.Get(category, key),
  set: (category: string, key: string, value: unknown) => ConfigService.Set(category, key, value),
  resetAll: () => ConfigService.ResetAll(),
};

export const cloudApi = {
  connect: (serverAddr: string, token: string) => CloudService.Connect(serverAddr, token),
  disconnect: () => CloudService.Disconnect(),
  isConnected: () => CloudService.IsConnected(),
  pullSync: () => CloudService.PullSync(),
  pushSync: (connections: ConnectionInfo[]) => CloudService.PushSync(connections),
};

export const aiApi = AIService;
export const firewallApi = FirewallService;
export const portForwardApi = PortForwardService;
export const processGuardianApi = ProcessGuardianService;
export const greetApi = GreetService;
