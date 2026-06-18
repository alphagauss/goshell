import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusLine } from "@/components/StatusLine";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { extractErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { sshApi } from "@/lib/wails";
import type { FileInfo } from "@/types";
import {
  base64ToBytes,
  downloadBase64File,
  fileNameFromPath,
  fileToBase64,
  formatBytes,
  isTextFile,
  joinRemotePath,
  looksLikeText,
  makeArchiveName,
  normalizeRemotePath,
  parentRemotePath,
  pathSegments as buildPathSegments,
  shellQuote,
  textToBase64,
} from "@/components/ssh/file-manager/utils";
import type { FileSortKey } from "@/components/ssh/file-manager/types";
import { useRemoteSearch } from "@/components/ssh/file-manager/hooks/useRemoteSearch";
import { useUploadTasks } from "@/components/ssh/file-manager/hooks/useUploadTasks";
import { FileToolbar } from "@/components/ssh/file-manager/components/FileToolbar";
import { FileTable } from "@/components/ssh/file-manager/components/FileTable";
import { FilePreview } from "@/components/ssh/file-manager/components/FilePreview";
import { FileEditorDialog } from "@/components/ssh/file-manager/components/FileEditorDialog";
import { PermissionEditor } from "@/components/ssh/file-manager/components/PermissionEditor";
import { UploadTaskPanel } from "@/components/ssh/file-manager/components/UploadTaskPanel";

const textDecoder = new TextDecoder();

function sortFiles(files: FileInfo[], sortKey: FileSortKey, sortDirection: "asc" | "desc") {
  const direction = sortDirection === "asc" ? 1 : -1;
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

  return [...files].sort((left, right) => {
    const leftDir = Boolean(left.isDir ?? left.is_dir);
    const rightDir = Boolean(right.isDir ?? right.is_dir);
    if (sortKey === "name" && leftDir !== rightDir) {
      return leftDir ? -1 * direction : 1 * direction;
    }

    const leftValue = String(left[sortKey] ?? "");
    const rightValue = String(right[sortKey] ?? "");

    if (sortKey === "size") {
      const sizeDiff = (left.size ?? 0) - (right.size ?? 0);
      return sizeDiff === 0 ? collator.compare(left.name || left.path, right.name || right.path) * direction : sizeDiff * direction;
    }

    if (sortKey === "modTime") {
      const leftTime = new Date(String(left.modTime ?? 0)).getTime();
      const rightTime = new Date(String(right.modTime ?? 0)).getTime();
      const diff = leftTime - rightTime;
      return diff === 0 ? collator.compare(left.name || left.path, right.name || right.path) * direction : diff * direction;
    }

    const diff = collator.compare(leftValue, rightValue);
    if (diff !== 0) {
      return diff * direction;
    }

    return collator.compare(left.name || left.path, right.name || right.path) * direction;
  });
}

async function readRemoteFile(file: FileInfo, connID: string) {
  const base64 = await sshApi.downloadFile(connID, file.path);
  const bytes = base64ToBytes(base64);
  const binary = !isTextFile(file) && !looksLikeText(bytes);

  return {
    binary,
    content: binary ? "" : textDecoder.decode(bytes),
    base64,
  };
}

function suggestChmodMode(file: FileInfo) {
  return Boolean(file.isDir ?? file.is_dir) ? "755" : "644";
}

export function FileManagerPanel({ connID }: { connID: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const fileLog = logger.scope("ssh.file-manager");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [cwd, setCwd] = useState("/");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"muted" | "success" | "warning" | "danger">("muted");
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<FileSortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<FileInfo | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewBinary, setPreviewBinary] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState<FileInfo | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorSaving, setEditorSaving] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [permissionTarget, setPermissionTarget] = useState<FileInfo | null>(null);
  const [permissionMode, setPermissionMode] = useState("");

  const search = useRemoteSearch(connID);
  const uploadTasks = useUploadTasks(connID);

  async function loadDirectory(targetPath = cwd) {
    if (!connID) {
      return;
    }

    const nextPath = normalizeRemotePath(targetPath);
    setLoading(true);
    setStatusMessage(`Loading ${nextPath}`);
    setStatusTone("warning");

    try {
      const result = await sshApi.listFiles(connID, nextPath);
      setFiles(Array.isArray(result) ? result : []);
      setCwd(nextPath);
      setSelectedPaths(new Set());
      setStatusMessage("");
      setStatusTone("muted");
      fileLog.info("directory loaded", { connID, path: nextPath, count: result.length });
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatusMessage(message);
      setStatusTone("danger");
      toast.error("Load failed", message);
      fileLog.error("load directory failed", { connID, path: nextPath, error: message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setFiles([]);
    setSelectedPaths(new Set());
    setPreviewOpen(false);
    setEditorOpen(false);
    setPermissionOpen(false);
    search.reset();
    setStatusMessage("");
    setStatusTone("muted");
    void loadDirectory("/");
  }, [connID]);

  const pathTrail = useMemo(() => buildPathSegments(cwd), [cwd]);
  const filteredFiles = useMemo(() => {
    const needle = search.query.trim().toLowerCase();
    const result = needle
      ? files.filter((file) => {
          const name = (file.name || file.path).toLowerCase();
          const path = file.path.toLowerCase();
          const owner = (file.owner || "").toLowerCase();
          const group = (file.group || "").toLowerCase();
          return name.includes(needle) || path.includes(needle) || owner.includes(needle) || group.includes(needle);
        })
      : files;

    return sortFiles(result, sortKey, sortDirection);
  }, [files, search.query, sortDirection, sortKey]);

  const selectedFiles = useMemo(
    () => files.filter((file) => selectedPaths.has(file.path)),
    [files, selectedPaths],
  );

  async function openFilePreview(file: FileInfo) {
    if (file.isDir || file.is_dir) {
      await loadDirectory(file.path);
      return;
    }

    setPreviewTarget(file);
    setPreviewOpen(true);
    setPreviewContent("");
    setPreviewBinary(false);
    setPreviewLoading(true);

    try {
      const { binary, content } = await readRemoteFile(file, connID);
      setPreviewBinary(binary);
      setPreviewContent(content);
    } catch (err) {
      const message = extractErrorMessage(err);
      toast.error("Preview failed", message);
      setStatusMessage(message);
      setStatusTone("danger");
      fileLog.error("preview failed", { connID, path: file.path, error: message });
    } finally {
      setPreviewLoading(false);
    }
  }

  async function openEditor(file: FileInfo) {
    if (file.isDir || file.is_dir) {
      return;
    }

    setEditorTarget(file);
    setEditorContent("");
    setEditorOpen(true);
    setEditorSaving(false);

    try {
      const { binary, content } = await readRemoteFile(file, connID);
      if (binary) {
        toast.warning("Edit unavailable", "Binary files are not editable here");
        setEditorOpen(false);
        return;
      }
      setEditorContent(content);
    } catch (err) {
      const message = extractErrorMessage(err);
      toast.error("Edit failed", message);
      setEditorOpen(false);
      fileLog.error("edit load failed", { connID, path: file.path, error: message });
    }
  }

  function openPermissions(file: FileInfo) {
    setPermissionTarget(file);
    setPermissionMode(suggestChmodMode(file));
    setPermissionOpen(true);
  }

  function toggleSelection(file: FileInfo) {
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (next.has(file.path)) {
        next.delete(file.path);
      } else {
        next.add(file.path);
      }
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    if (!checked) {
      setSelectedPaths(new Set());
      return;
    }

    setSelectedPaths(new Set(filteredFiles.map((file) => file.path)));
  }

  function handleSort(nextKey: FileSortKey) {
    setSortDirection((currentDirection) =>
      sortKey === nextKey ? (currentDirection === "asc" ? "desc" : "asc") : "asc",
    );
    setSortKey(nextKey);
  }

  async function handleRefresh() {
    await loadDirectory(cwd);
  }

  async function handleParent() {
    await loadDirectory(parentRemotePath(cwd));
  }

  async function handleCreateFolder() {
    const folderName = window.prompt("New folder name", "");
    if (!folderName?.trim()) {
      return;
    }

    const remotePath = folderName.startsWith("/")
      ? normalizeRemotePath(folderName)
      : joinRemotePath(cwd, folderName.trim());

    try {
      await sshApi.createDirectory(connID, remotePath);
      fileLog.info("folder created", { connID, path: remotePath });
      toast.success("Folder created", remotePath);
      await loadDirectory(cwd);
    } catch (err) {
      const message = extractErrorMessage(err);
      toast.error("Create folder failed", message);
      fileLog.error("create folder failed", { connID, path: remotePath, error: message });
    }
  }

  async function handleRename(file: FileInfo) {
    const currentName = file.name || fileNameFromPath(file.path);
    const nextName = window.prompt("Rename to", currentName);
    if (!nextName?.trim() || nextName.trim() === currentName) {
      return;
    }

    const targetPath = nextName.startsWith("/")
      ? normalizeRemotePath(nextName)
      : joinRemotePath(parentRemotePath(file.path), nextName.trim());

    try {
      await sshApi.renameFile(connID, file.path, targetPath);
      fileLog.info("file renamed", { connID, from: file.path, to: targetPath });
      toast.success("Renamed", `${currentName} -> ${fileNameFromPath(targetPath)}`);
      setSelectedPaths((current) => {
        const next = new Set(current);
        next.delete(file.path);
        next.add(targetPath);
        return next;
      });
      await loadDirectory(cwd);
    } catch (err) {
      const message = extractErrorMessage(err);
      toast.error("Rename failed", message);
      fileLog.error("rename failed", { connID, from: file.path, to: targetPath, error: message });
    }
  }

  async function handleDelete(filesToDelete: FileInfo[]) {
    if (filesToDelete.length === 0) {
      return;
    }

    const confirmed = await confirm({
      title: filesToDelete.length === 1 ? "Delete file" : "Delete selected files",
      description:
        filesToDelete.length === 1
          ? `Delete ${filesToDelete[0]!.path}?`
          : `Delete ${filesToDelete.length} selected items?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    const failures: string[] = [];

    for (const file of filesToDelete) {
      try {
        await sshApi.deleteFile(connID, file.path);
        fileLog.info("file deleted", { connID, path: file.path });
      } catch (err) {
        const message = extractErrorMessage(err);
        failures.push(`${file.path}: ${message}`);
        fileLog.error("delete failed", { connID, path: file.path, error: message });
      }
    }

    if (failures.length === 0) {
      toast.success("Deleted", `${filesToDelete.length} item(s) removed`);
    } else {
      toast.warning("Partial delete", failures[0] || "Some items could not be removed");
    }

    setSelectedPaths(new Set());
    await loadDirectory(cwd);
  }

  async function handleDownload(file: FileInfo) {
    if (file.isDir || file.is_dir) {
      await handleDownloadSelected([file]);
      return;
    }

    const taskID = uploadTasks.registerTask("download", file.path, fileNameFromPath(file.path));
    try {
      const base64 = await sshApi.downloadFile(connID, file.path);
      downloadBase64File(file.name || fileNameFromPath(file.path), base64);
      uploadTasks.finishTask(taskID, "Downloaded");
      toast.success("Download started", file.path);
      fileLog.info("file downloaded", { connID, path: file.path });
    } catch (err) {
      const message = extractErrorMessage(err);
      uploadTasks.failTask(taskID, message);
      toast.error("Download failed", message);
      fileLog.error("download failed", { connID, path: file.path, error: message });
    }
  }

  async function handleDownloadSelected(explicitFiles?: FileInfo[]) {
    const candidates = explicitFiles ?? selectedFiles;
    if (candidates.length === 0) {
      return;
    }

    if (candidates.length === 1 && !(candidates[0]!.isDir || candidates[0]!.is_dir)) {
      await handleDownload(candidates[0]!);
      return;
    }

    const archiveName = `${makeArchiveName(candidates.map((file) => file.path), cwd)}.tar.gz`;
    const taskID = uploadTasks.registerTask("archive", archiveName, `Archive ${candidates.length} item(s)`);

    try {
      const remoteArchivePath = await sshApi.createArchive(
        connID,
        candidates.map((file) => file.path),
        archiveName,
      );
      const base64 = await sshApi.downloadFile(connID, remoteArchivePath);
      downloadBase64File(archiveName, base64, "application/gzip");
      await sshApi.deleteTempFile(connID, remoteArchivePath);
      uploadTasks.finishTask(taskID, "Downloaded archive");
      toast.success("Archive downloaded", archiveName);
      fileLog.info("archive downloaded", { connID, archive: archiveName, items: candidates.length });
    } catch (err) {
      const message = extractErrorMessage(err);
      uploadTasks.failTask(taskID, message);
      toast.error("Archive download failed", message);
      fileLog.error("archive download failed", { connID, error: message });
    }
  }

  async function handleUploadFiles(filesToUpload: FileList | null) {
    if (!filesToUpload || filesToUpload.length === 0) {
      return;
    }

    const uploads = Array.from(filesToUpload);

    for (const file of uploads) {
      const relativePath = file.webkitRelativePath || file.name;
      const remotePath = joinRemotePath(cwd, relativePath);
      const taskID = uploadTasks.registerTask("upload", remotePath, file.name);

      try {
        const base64 = await fileToBase64(file);
        await sshApi.uploadFile(connID, remotePath, base64);
        uploadTasks.finishTask(taskID, "Uploaded");
        fileLog.info("file uploaded", { connID, path: remotePath, size: file.size });
      } catch (err) {
        const message = extractErrorMessage(err);
        uploadTasks.failTask(taskID, message);
        toast.error("Upload failed", `${file.name}: ${message}`);
        fileLog.error("upload failed", { connID, path: remotePath, error: message });
      }
    }

    toast.success("Upload finished", `${uploads.length} file(s) processed`);
    await loadDirectory(cwd);
  }

  async function handleUploadDirectory() {
    const taskID = uploadTasks.registerTask("directory-upload", connID, `Upload directory into ${cwd}`);
    try {
      await sshApi.selectLocalDirectoryAndUpload(connID, cwd);
      uploadTasks.finishTask(taskID, "Directory uploaded");
      toast.success("Directory uploaded", cwd);
      fileLog.info("directory uploaded", { connID, path: cwd });
      await loadDirectory(cwd);
    } catch (err) {
      const message = extractErrorMessage(err);
      uploadTasks.failTask(taskID, message);
      toast.error("Directory upload failed", message);
      fileLog.error("directory upload failed", { connID, path: cwd, error: message });
    }
  }

  async function handleSaveEdit() {
    if (!editorTarget) {
      return;
    }

    const taskID = uploadTasks.registerTask("upload", editorTarget.path, editorTarget.name || editorTarget.path);
    setEditorSaving(true);

    try {
      await sshApi.uploadFile(connID, editorTarget.path, textToBase64(editorContent));
      uploadTasks.finishTask(taskID, "Saved");
      toast.success("File saved", editorTarget.path);
      fileLog.info("file saved", { connID, path: editorTarget.path });
      setEditorOpen(false);
      await loadDirectory(cwd);
    } catch (err) {
      const message = extractErrorMessage(err);
      uploadTasks.failTask(taskID, message);
      toast.error("Save failed", message);
      fileLog.error("save failed", { connID, path: editorTarget.path, error: message });
    } finally {
      setEditorSaving(false);
    }
  }

  async function handleApplyPermission() {
    if (!permissionTarget) {
      return;
    }

    const mode = permissionMode.trim();
    if (!mode) {
      return;
    }

    try {
      await sshApi.runCommand(connID, `chmod ${mode} ${shellQuote(permissionTarget.path)}`);
      toast.success("Permissions updated", `${permissionTarget.path} -> ${mode}`);
      fileLog.info("permissions updated", { connID, path: permissionTarget.path, mode });
      setPermissionOpen(false);
      await loadDirectory(cwd);
    } catch (err) {
      const message = extractErrorMessage(err);
      toast.error("chmod failed", message);
      fileLog.error("chmod failed", { connID, path: permissionTarget.path, mode, error: message });
    }
  }

  async function handleRemoteSearch() {
    await search.search(search.query, cwd);
  }

  function handleCancelSearch() {
    search.reset();
  }

  function handleSearchResultClick(file: FileInfo) {
    if (file.isDir || file.is_dir) {
      void loadDirectory(file.path);
      return;
    }

    void openFilePreview(file);
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const filesToUpload = event.target.files;
    event.target.value = "";
    void handleUploadFiles(filesToUpload);
  }

  const searchResultsVisible =
    search.searching ||
    Boolean(search.error) ||
    (search.results.length > 0 && search.query === search.submittedQuery);
  const tasksVisible = uploadTasks.tasks.length > 0;

  return (
    <section className="tool-panel file-manager-panel">
      <div className="panel-heading">
        <div className="file-manager-panel__title">
          <h2>File Manager</h2>
          <span>{cwd}</span>
        </div>
        <div className="file-manager-panel__header-actions">
          <Button variant="ghost" size="icon" onClick={() => void handleRefresh()} aria-label="Refresh">
            <RefreshCcw size={14} />
          </Button>
        </div>
      </div>

      <StatusLine tone={statusTone}>{statusMessage || (loading ? "Loading directory..." : "")}</StatusLine>

      <FileToolbar
        pathSegments={pathTrail}
        searchValue={search.query}
        selectedCount={selectedPaths.size}
        searching={search.searching}
        onSearchValueChange={search.setQuery}
        onSearchSubmit={() => {
          void handleRemoteSearch();
        }}
        onCancelSearch={handleCancelSearch}
        onNavigate={(path) => {
          void loadDirectory(path);
        }}
        onRefresh={() => {
          void handleRefresh();
        }}
        onParent={() => {
          void handleParent();
        }}
        onCreateFolder={() => {
          void handleCreateFolder();
        }}
        onUploadFiles={() => uploadInputRef.current?.click()}
        onUploadFolder={() => {
          void handleUploadDirectory();
        }}
        onDownloadSelected={() => {
          void handleDownloadSelected();
        }}
        onDeleteSelected={() => {
          void handleDelete(selectedFiles);
        }}
      />

      {searchResultsVisible ? (
        <section className="file-search-results">
          <div className="file-search-results__heading">
            <h3>Recursive Search</h3>
            <span>{search.query || "Type a query and press Enter"}</span>
          </div>
          {search.searching ? <StatusLine tone="warning">Searching recursively...</StatusLine> : null}
          {search.error ? <StatusLine tone="danger">{search.error}</StatusLine> : null}
          <div className="file-search-results__list">
            {search.results.length === 0 && !search.searching && !search.error ? (
              <div className="empty-state">No search results yet</div>
            ) : null}
            {search.results.map((hit) => {
              const file = hit.file;
              const isDir = Boolean(file.isDir ?? file.is_dir);
              return (
                <button
                  key={`${hit.searchID}-${hit.relativePath}`}
                  type="button"
                  className="file-search-results__item"
                  onClick={() => handleSearchResultClick(file)}
                >
                  <div>
                    <strong>{file.name || hit.relativePath}</strong>
                    <span>{hit.relativePath}</span>
                  </div>
                  <small>{isDir ? "Directory" : formatBytes(file.size ?? 0)}</small>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {tasksVisible ? (
        <UploadTaskPanel
          tasks={uploadTasks.tasks}
          onClearCompleted={() => uploadTasks.clearCompleted()}
          onRemove={(taskID) => uploadTasks.removeTask(taskID)}
        />
      ) : null}

      <FileTable
        files={filteredFiles}
        selectedPaths={selectedPaths}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        onToggleSelection={toggleSelection}
        onToggleSelectAll={toggleSelectAll}
        onOpen={(file) => {
          void openFilePreview(file);
        }}
        onPreview={(file) => {
          void openFilePreview(file);
        }}
        onEdit={(file) => {
          void openEditor(file);
        }}
        onRename={(file) => {
          void handleRename(file);
        }}
        onDownload={(file) => {
          void handleDownload(file);
        }}
        onChmod={(file) => {
          openPermissions(file);
        }}
        onDelete={(file) => {
          void handleDelete([file]);
        }}
      />

      <input
        ref={uploadInputRef}
        type="file"
        multiple
        className="file-manager-panel__upload-input"
        onChange={handleFileInputChange}
      />

      <FilePreview
        open={previewOpen}
        file={previewTarget}
        content={previewContent}
        loading={previewLoading}
        binary={previewBinary}
        onOpenChange={setPreviewOpen}
        onDownload={() => {
          if (previewTarget) {
            void handleDownload(previewTarget);
          }
        }}
        onEdit={() => {
          if (previewTarget) {
            setPreviewOpen(false);
            void openEditor(previewTarget);
          }
        }}
        onRename={() => {
          if (previewTarget) {
            void handleRename(previewTarget);
          }
        }}
        onChmod={() => {
          if (previewTarget) {
            openPermissions(previewTarget);
          }
        }}
        onDelete={() => {
          if (previewTarget) {
            void handleDelete([previewTarget]);
            setPreviewOpen(false);
          }
        }}
      />

      <FileEditorDialog
        open={editorOpen}
        file={editorTarget}
        value={editorContent}
        onValueChange={setEditorContent}
        onOpenChange={setEditorOpen}
        onSave={() => {
          void handleSaveEdit();
        }}
        saving={editorSaving}
      />

      <PermissionEditor
        open={permissionOpen}
        file={permissionTarget}
        mode={permissionMode}
        onModeChange={setPermissionMode}
        onOpenChange={setPermissionOpen}
        onApply={() => {
          void handleApplyPermission();
        }}
      />
    </section>
  );
}
