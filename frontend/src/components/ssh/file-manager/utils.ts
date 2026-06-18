import type { FileInfo } from "@/types";

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".conf",
  ".cfg",
  ".log",
  ".csv",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".html",
  ".css",
  ".scss",
  ".xml",
  ".sh",
  ".bash",
  ".zsh",
  ".env",
]);

export function normalizeRemotePath(path: string) {
  const trimmed = path.trim().replace(/\\/g, "/");
  if (!trimmed) {
    return "/";
  }

  let normalized = trimmed.replace(/\/+/g, "/");
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }

  return normalized || "/";
}

export function joinRemotePath(basePath: string, segment: string) {
  const base = normalizeRemotePath(basePath);
  const child = segment.trim().replace(/\\/g, "/").replace(/^\/+/, "");

  if (!child) {
    return base;
  }

  if (base === "/") {
    return `/${child}`;
  }

  return `${base}/${child}`;
}

export function parentRemotePath(path: string) {
  const normalized = normalizeRemotePath(path);
  if (normalized === "/") {
    return "/";
  }

  const parts = normalized.split("/").filter(Boolean);
  parts.pop();
  return parts.length === 0 ? "/" : `/${parts.join("/")}`;
}

export function pathSegments(path: string) {
  const normalized = normalizeRemotePath(path);
  if (normalized === "/") {
    return [{ label: "/", path: "/" }];
  }

  const parts = normalized.split("/").filter(Boolean);
  const segments: Array<{ label: string; path: string }> = [{ label: "/", path: "/" }];
  let current = "";

  for (const part of parts) {
    current += `/${part}`;
    segments.push({ label: part, path: current });
  }

  return segments;
}

export function formatBytes(size: number) {
  if (!Number.isFinite(size) || size < 0) {
    return "-";
  }

  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function formatRemoteTime(value: unknown) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

export function isTextFile(file: FileInfo) {
  if (file.isDir || file.is_dir) {
    return false;
  }

  const name = (file.name || file.path || "").toLowerCase();
  const dotIndex = name.lastIndexOf(".");
  const extension = dotIndex >= 0 ? name.slice(dotIndex) : "";
  return TEXT_EXTENSIONS.has(extension) || extension === "";
}

export function looksLikeText(bytes: Uint8Array) {
  if (bytes.length === 0) {
    return true;
  }

  const sample = bytes.subarray(0, Math.min(bytes.length, 1024));
  if (sample.includes(0)) {
    return false;
  }

  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 9 || byte === 10 || byte === 13) {
      continue;
    }
    if (byte < 32 || byte === 127) {
      suspicious += 1;
    }
  }

  return suspicious / sample.length < 0.3;
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function base64ToText(base64: string) {
  return new TextDecoder().decode(base64ToBytes(base64));
}

export async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  return bytesToBase64(new Uint8Array(buffer));
}

export function textToBase64(text: string) {
  return bytesToBase64(new TextEncoder().encode(text));
}

export function downloadBase64File(filename: string, base64: string, mimeType = "application/octet-stream") {
  const bytes = base64ToBytes(base64);
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function fileNameFromPath(path: string) {
  const normalized = normalizeRemotePath(path);
  if (normalized === "/") {
    return "/";
  }

  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}

export function makeArchiveName(paths: string[], cwd: string) {
  if (paths.length === 1) {
    return fileNameFromPath(paths[0]!).replace(/\.+$/, "") || "archive";
  }

  const segment = fileNameFromPath(cwd);
  return segment === "/" ? "archive" : segment;
}

export function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
