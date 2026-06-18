import type { FileInfo } from "@/types";

export type FileSortKey = "name" | "size" | "mode" | "owner" | "group" | "modTime";

export type FileTaskKind = "upload" | "directory-upload" | "download" | "search" | "archive";

export type FileTaskStatus = "pending" | "running" | "success" | "error";

export interface FileTask {
  id: string;
  kind: FileTaskKind;
  label: string;
  status: FileTaskStatus;
  progress: number;
  message?: string;
}

export interface RemoteSearchHit {
  searchID: string;
  relativePath: string;
  file: FileInfo;
}

export interface FilePreview {
  file: FileInfo;
  content: string;
  binary: boolean;
}
