export interface SyncConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  keyPath?: string;
  source?: string;
  updatedAt?: unknown;
}
