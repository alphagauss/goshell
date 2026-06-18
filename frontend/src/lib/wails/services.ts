import * as AIServiceBinding from "@bindings/goshell/internal/ai/aiservice.js";
import * as CloudServiceBinding from "@bindings/goshell/internal/ssh/cloudservice.js";
import * as ConfigServiceBinding from "@bindings/goshell/internal/ssh/configservice.js";
import * as FirewallServiceBinding from "@bindings/goshell/internal/ssh/firewallservice.js";
import * as GreetServiceBinding from "@bindings/goshell/internal/ssh/greetservice.js";
import * as PortForwardServiceBinding from "@bindings/goshell/internal/ssh/portforwardservice.js";
import * as ProcessGuardianServiceBinding from "@bindings/goshell/internal/ssh/processguardianservice.js";
import * as SSHServiceBinding from "@bindings/goshell/internal/ssh/sshservice.js";
import type {
  AIConfig,
  AIModelInfo,
  AppConfig,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  CommandResult,
  ConnectResult,
  ConnectionInfo,
  FileInfo,
  FirewallInfo,
  GuardianProcess,
  PortForward,
  ProcessInfo,
  SSHConfig,
  SSHGroup,
  SyncConnection,
  SystemStats,
} from "@/types";

interface SSHServiceApi {
  TestConnection(config: SSHConfig): Promise<void>;
  CreateAndConnect(config: SSHConfig): Promise<string>;
  CreateAndConnectWithGroup(config: SSHConfig, groupID: string): Promise<ConnectResult>;
  Connect(connID: string, config: SSHConfig): Promise<void>;
  OpenSSHWindow(groupID: string, groupName: string, activeConnID: string): Promise<void>;
  Disconnect(connID: string): Promise<void>;
  Reconnect(connID: string): Promise<void>;
  GetAllConnections(): Promise<ConnectionInfo[]>;
  GetConnection(id: string): Promise<ConnectionInfo | null>;
  UpdateConnection(connection: ConnectionInfo): Promise<void>;
  AddConnection(connection: ConnectionInfo): Promise<void>;
  GetAllGroups(): Promise<SSHGroup[]>;
  GetGroupConnectionInfos(groupID: string): Promise<ConnectionInfo[]>;
  GetDefaultGroupID(): Promise<string>;
  CreateGroup(name: string): Promise<string>;
  SaveConnection(id: string): Promise<void>;
  DeleteConnection(id: string): Promise<void>;
  StartShellSession(connID: string): Promise<void>;
  StartShellSessionWithID(connID: string, sessionID: string): Promise<void>;
  WriteToTerminal(connID: string, data: string): Promise<void>;
  WriteToTerminalByID(connID: string, sessionID: string, data: string): Promise<void>;
  ResizeTerminal(connID: string, cols: number, rows: number): Promise<void>;
  ResizeTerminalByID(connID: string, sessionID: string, cols: number, rows: number): Promise<void>;
  CloseShellSession(connID: string): Promise<void>;
  CloseShellSessionByID(connID: string, sessionID: string): Promise<void>;
  ListFiles(connID: string, path: string): Promise<FileInfo[]>;
  ExecuteCommand(connID: string, command: string): Promise<CommandResult | string | null>;
  RunCommand(connID: string, command: string): Promise<string>;
  GetSystemStats(connID: string): Promise<SystemStats>;
  GetProcessList(connID: string): Promise<ProcessInfo[]>;
  ClearWindowPositions(): Promise<void>;
  GetLatency(connID: string): Promise<number>;
  GetServerKey(connID: string): Promise<string>;
  GetGroupByConnID(connID: string): Promise<SSHGroup | null>;
  CloseGroup(groupID: string): Promise<void>;
  DeleteFile(connID: string, remotePath: string): Promise<void>;
  CreateDirectory(connID: string, remotePath: string): Promise<void>;
  RenameFile(connID: string, oldPath: string, newPath: string): Promise<void>;
  UploadFile(connID: string, remotePath: string, data: string): Promise<void>;
  DownloadFile(connID: string, remotePath: string): Promise<string>;
  UploadDirectory(connID: string, localPath: string, remotePath: string): Promise<void>;
  SelectLocalDirectoryAndUpload(connID: string, remotePath: string): Promise<void>;
  CreateArchive(connID: string, files: string[], archiveName: string): Promise<string>;
  DeleteTempFile(connID: string, filePath: string): Promise<void>;
  ExtractArchive(connID: string, archivePath: string, targetDir: string): Promise<void>;
  SearchFiles(connID: string, basePath: string, keyword: string, searchID: string): Promise<void>;
  CancelSearch(connID: string, searchID: string): Promise<void>;
}

interface ConfigServiceApi {
  GetConfig(): Promise<AppConfig>;
  SetConfig(config: AppConfig): Promise<void>;
  Get(category: string, key: string): Promise<unknown>;
  Set(category: string, key: string, value: unknown): Promise<void>;
  ResetAll(): Promise<void>;
}

interface CloudServiceApi {
  Connect(serverAddr: string, token: string): Promise<boolean>;
  Disconnect(): Promise<void>;
  IsConnected(): Promise<boolean>;
  PullSync(): Promise<SyncConnection[]>;
  PushSync(connections: SyncConnection[]): Promise<void>;
}

interface AIServiceApi {
  GetConfig(): Promise<AIConfig>;
  IsConfigured(): Promise<boolean>;
  SaveConfig(config: AIConfig): Promise<void>;
  FetchModels(): Promise<AIModelInfo[]>;
  FetchModelsWithParams(endpoint: string, key: string): Promise<AIModelInfo[]>;
  GetChatHistory(connID: string): Promise<Array<ChatMessage | null>>;
  SendMessage(req: ChatRequest | null): Promise<ChatResponse | null>;
  CancelProcessing(connID: string): Promise<void>;
  ClearChatHistory(connID: string): Promise<void>;
  ApproveTool(callID: string): Promise<void>;
  DenyTool(callID: string): Promise<void>;
  SubmitToolResult(callID: string, result: string): Promise<void>;
  SetApp(app: unknown): Promise<void>;
}

interface FirewallServiceApi {
  AddRule(connID: string, chain: string, target: string, protocol: string, port: string, source: string, comment: string): Promise<void>;
  DeleteRule(connID: string, chain: string, index: number, port: string, protocol: string): Promise<void>;
  GetFirewallInfo(connID: string): Promise<FirewallInfo | null>;
  RunCustomCommand(connID: string, command: string): Promise<string>;
  ToggleFirewall(connID: string, enable: boolean): Promise<void>;
}

interface PortForwardServiceApi {
  AddLocalForward(
    connID: string,
    bindAddr: string,
    bindPort: number,
    remoteHost: string,
    remotePort: number,
  ): Promise<PortForward | null>;
  AddRemoteForward(
    connID: string,
    bindAddr: string,
    bindPort: number,
    remoteHost: string,
    remotePort: number,
  ): Promise<PortForward | null>;
  GetForwardStatus(forwardID: string): Promise<PortForward | null>;
  GetForwards(connID: string): Promise<PortForward[]>;
  RemoveForward(forwardID: string): Promise<void>;
  StartForward(forwardID: string): Promise<void>;
  StopForward(forwardID: string): Promise<void>;
  StopAllByConnID(connID: string): Promise<void>;
}

interface ProcessGuardianServiceApi {
  GetGuardians(connID: string): Promise<GuardianProcess[]>;
  StartGuardian(connID: string, name: string): Promise<void>;
  StopGuardian(connID: string, name: string): Promise<void>;
  RestartGuardian(connID: string, name: string): Promise<void>;
  CreateGuardian(connID: string, name: string, command: string, workDir: string, autoRestart: boolean): Promise<void>;
  DeleteGuardian(connID: string, name: string): Promise<void>;
  GetGuardianLogs(connID: string, name: string, lines: number): Promise<string>;
  ClearGuardianLogs(connID: string, name: string, logPath: string): Promise<void>;
  GetGuardianStats(connID: string, name: string): Promise<Record<string, unknown>>;
}

interface GreetServiceApi {
  GetAppName(): Promise<string>;
  GetVersion(): Promise<string>;
  Greet(name: string): Promise<string>;
}

const AIService = AIServiceBinding as unknown as AIServiceApi;
const CloudService = CloudServiceBinding as unknown as CloudServiceApi;
const ConfigService = ConfigServiceBinding as unknown as ConfigServiceApi;
const FirewallService = FirewallServiceBinding as unknown as FirewallServiceApi;
const GreetService = GreetServiceBinding as unknown as GreetServiceApi;
const PortForwardService = PortForwardServiceBinding as unknown as PortForwardServiceApi;
const ProcessGuardianService = ProcessGuardianServiceBinding as unknown as ProcessGuardianServiceApi;
const SSHService = SSHServiceBinding as unknown as SSHServiceApi;

export const sshApi = {
  testConnection: (config: SSHConfig) => SSHService.TestConnection(config),
  createAndConnect: (config: SSHConfig) => SSHService.CreateAndConnect(config),
  createAndConnectWithGroup: (config: SSHConfig, groupID: string) => SSHService.CreateAndConnectWithGroup(config, groupID),
  connect: (connID: string, config: SSHConfig) => SSHService.Connect(connID, config),
  openSSHWindow: (groupID: string, groupName: string, activeConnID: string) =>
    SSHService.OpenSSHWindow(groupID, groupName, activeConnID),
  disconnect: (connID: string) => SSHService.Disconnect(connID),
  reconnect: (connID: string) => SSHService.Reconnect(connID),
  getAllConnections: () => SSHService.GetAllConnections(),
  getConnection: (id: string) => SSHService.GetConnection(id),
  updateConnection: (connection: ConnectionInfo) => SSHService.UpdateConnection(connection),
  addConnection: (connection: ConnectionInfo) => SSHService.AddConnection(connection),
  getAllGroups: () => SSHService.GetAllGroups(),
  getGroupConnectionInfos: (groupID: string) => SSHService.GetGroupConnectionInfos(groupID),
  getDefaultGroupID: () => SSHService.GetDefaultGroupID(),
  createGroup: (name: string) => SSHService.CreateGroup(name),
  saveConnection: (id: string) => SSHService.SaveConnection(id),
  deleteConnection: (id: string) => SSHService.DeleteConnection(id),
  startShellSession: (connID: string, sessionID: string) => SSHService.StartShellSessionWithID(connID, sessionID),
  writeToTerminal: (connID: string, sessionID: string, data: string) =>
    SSHService.WriteToTerminalByID(connID, sessionID, data),
  resizeTerminal: (connID: string, sessionID: string, cols: number, rows: number) =>
    SSHService.ResizeTerminalByID(connID, sessionID, cols, rows),
  closeShellSession: (connID: string, sessionID: string) => SSHService.CloseShellSessionByID(connID, sessionID),
  listFiles: (connID: string, path: string) => SSHService.ListFiles(connID, path),
  executeCommand: (connID: string, command: string) => SSHService.ExecuteCommand(connID, command),
  runCommand: (connID: string, command: string) => SSHService.RunCommand(connID, command),
  getSystemStats: (connID: string) => SSHService.GetSystemStats(connID),
  getProcessList: (connID: string) => SSHService.GetProcessList(connID),
  clearWindowPositions: () => SSHService.ClearWindowPositions(),
  deleteFile: (connID: string, remotePath: string) => SSHService.DeleteFile(connID, remotePath),
  createDirectory: (connID: string, remotePath: string) => SSHService.CreateDirectory(connID, remotePath),
  renameFile: (connID: string, oldPath: string, newPath: string) => SSHService.RenameFile(connID, oldPath, newPath),
  uploadFile: (connID: string, remotePath: string, data: string) => SSHService.UploadFile(connID, remotePath, data),
  downloadFile: (connID: string, remotePath: string) => SSHService.DownloadFile(connID, remotePath),
  uploadDirectory: (connID: string, localPath: string, remotePath: string) =>
    SSHService.UploadDirectory(connID, localPath, remotePath),
  selectLocalDirectoryAndUpload: (connID: string, remotePath: string) =>
    SSHService.SelectLocalDirectoryAndUpload(connID, remotePath),
  createArchive: (connID: string, files: string[], archiveName: string) =>
    SSHService.CreateArchive(connID, files, archiveName),
  deleteTempFile: (connID: string, filePath: string) => SSHService.DeleteTempFile(connID, filePath),
  extractArchive: (connID: string, archivePath: string, targetDir: string) =>
    SSHService.ExtractArchive(connID, archivePath, targetDir),
  searchFiles: (connID: string, basePath: string, keyword: string, searchID: string) =>
    SSHService.SearchFiles(connID, basePath, keyword, searchID),
  cancelSearch: (connID: string, searchID: string) => SSHService.CancelSearch(connID, searchID),
};

export const configApi = {
  getConfig: () => ConfigService.GetConfig(),
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
  pushSync: (connections: SyncConnection[]) => CloudService.PushSync(connections),
};

export const aiApi = AIService;
export const firewallApi = FirewallService;
export const portForwardApi = PortForwardService;
export const processGuardianApi = ProcessGuardianService;
export const greetApi = GreetService;
