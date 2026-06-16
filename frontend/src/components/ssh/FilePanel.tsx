import { useEffect, useState } from "react";
import { FolderOpen, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { sshApi } from "@/lib/wails";

interface FileInfo {
  name?: string;
  path?: string;
  size?: number;
  isDir?: boolean;
  is_dir?: boolean;
  modTime?: string;
}

export function FilePanel({ connID }: { connID: string }) {
  const [path, setPath] = useState("/");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [status, setStatus] = useState("");

  async function load(nextPath = path) {
    if (!connID) return;
    setStatus("");
    try {
      const result = await sshApi.listFiles(connID, nextPath);
      setFiles(Array.isArray(result) ? result : []);
      setPath(nextPath);
    } catch (err) {
      setStatus(extractErrorMessage(err));
    }
  }

  useEffect(() => {
    void load("/");
  }, [connID]);

  return (
    <section className="tool-panel ssh-panel">
      <div className="panel-heading">
        <h2>文件</h2>
        <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="刷新">
          <RefreshCcw size={15} />
        </Button>
      </div>
      <div className="path-row">
        <FolderOpen size={15} />
        <input
          className="input-base"
          value={path}
          onChange={(event) => setPath(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void load(path);
          }}
        />
      </div>
      <StatusLine tone="danger">{status}</StatusLine>
      <div className="file-list">
        {files.length === 0 ? (
          <div className="empty-state">暂无文件</div>
        ) : (
          files.map((file) => {
            const isDir = Boolean(file.isDir ?? file.is_dir);
            const name = file.name ?? file.path ?? "";
            return (
              <button
                className="file-row"
                key={`${name}-${file.size ?? 0}`}
                type="button"
                onDoubleClick={() => {
                  if (isDir) void load(path.endsWith("/") ? `${path}${name}` : `${path}/${name}`);
                }}
              >
                <span>{isDir ? "目录" : "文件"}</span>
                <strong>{name}</strong>
                <span>{isDir ? "-" : formatSize(file.size ?? 0)}</span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
