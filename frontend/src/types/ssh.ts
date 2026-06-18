export interface SSHConfig {
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  keyPath?: string;
  privateKey?: string;
  timeout?: number;
}

export interface ConnectionInfo extends SSHConfig {
  id: string;
  status: string;
  saved: boolean;
  group_id?: string;
}

export interface SSHGroup {
  id: string;
  name: string;
  conn_ids: string[];
  window_id: string;
  is_default: boolean;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  mode: string;
  modTime: unknown;
  isDir: boolean;
  is_dir?: boolean;
  owner: string;
  group: string;
}

export interface PortForward {
  id: string;
  connId: string;
  type: string;
  bindAddr: string;
  bindPort: number;
  remoteHost: string;
  remotePort: number;
  status: string;
  error?: string;
  createdAt: number;
  activeConns: number;
  totalConns: number;
  bytesSent: number;
  bytesRecv: number;
}

export interface FirewallRule {
  index: number;
  chain: string;
  target: string;
  protocol: string;
  source: string;
  dest: string;
  port: string;
  comment: string;
  raw: string;
}

export interface FirewallInfo {
  type: string;
  status: string;
  rules: FirewallRule[];
  rawOutput: string;
  chains: string[];
}

export interface GuardianProcess {
  id: string;
  name: string;
  command: string;
  workDir: string;
  status: string;
  pid: number;
  autoRestart: boolean;
  logPath: string;
  createdAt: number;
  restarts: number;
}

export interface LoadAvg {
  load1: number;
  load5: number;
  load15: number;
}

export interface CPUStats {
  usagePercent?: number;
  usage?: number;
  cores?: number;
  perCpuUsage?: number[];
  loadAvg?: LoadAvg;
  [key: string]: unknown;
}

export interface MemoryStats {
  total?: number;
  used?: number;
  free?: number;
  usedPercent?: number;
  percent?: number;
  [key: string]: unknown;
}

export interface DiskIOStats {
  readBytes?: number;
  writeBytes?: number;
  readCount?: number;
  writeCount?: number;
  [key: string]: unknown;
}

export interface DiskPartition {
  device?: string;
  mountpoint?: string;
  fstype?: string;
  total?: number;
  used?: number;
  free?: number;
  usedPercent?: number;
  [key: string]: unknown;
}

export interface DiskStats {
  partitions?: DiskPartition[];
  ioStats?: DiskIOStats;
  [key: string]: unknown;
}

export interface NetInterface {
  name?: string;
  address?: string;
  addresses?: string[];
  rxBytes?: number;
  txBytes?: number;
  speed?: number;
  isUp?: boolean;
  [key: string]: unknown;
}

export interface NetworkStats {
  interfaces?: NetInterface[];
  [key: string]: unknown;
}

export interface SystemStats {
  timestamp: number;
  uptime: string;
  cpu?: CPUStats;
  memory?: MemoryStats;
  disk?: DiskStats;
  network?: NetworkStats;
  loadAvg?: LoadAvg;
  load?: LoadAvg;
  [key: string]: unknown;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuPercent: number;
  memPercent: number;
  memRss: number;
  status: string;
  username: string;
  startTime: string;
  elapsedTime: string;
  cmdline: string;
  numThreads: number;
  priority: number;
  nice: number;
  [key: string]: unknown;
}
