import { ChevronDown, ChevronUp, Folder, FileText } from "lucide-react";
import type { FileInfo } from "@/types";
import { ActionMenu } from "@/components/ssh/file-manager/components/ActionMenu";
import type { FileSortKey } from "@/components/ssh/file-manager/types";
import { cn } from "@/lib/utils";
import { formatBytes, formatRemoteTime } from "@/components/ssh/file-manager/utils";

export function FileTable({
  files,
  selectedPaths,
  sortKey,
  sortDirection,
  onSort,
  onToggleSelection,
  onToggleSelectAll,
  onOpen,
  onPreview,
  onEdit,
  onRename,
  onDownload,
  onChmod,
  onDelete,
}: {
  files: FileInfo[];
  selectedPaths: Set<string>;
  sortKey: FileSortKey;
  sortDirection: "asc" | "desc";
  onSort: (key: FileSortKey) => void;
  onToggleSelection: (file: FileInfo) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onOpen: (file: FileInfo) => void;
  onPreview: (file: FileInfo) => void;
  onEdit: (file: FileInfo) => void;
  onRename: (file: FileInfo) => void;
  onDownload: (file: FileInfo) => void;
  onChmod: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
}) {
  const allSelected = files.length > 0 && files.every((file) => selectedPaths.has(file.path));
  const someSelected = files.some((file) => selectedPaths.has(file.path));

  function renderSortIndicator(key: FileSortKey) {
    if (sortKey !== key) {
      return null;
    }

    return sortDirection === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  return (
    <div className="file-table">
      <div className="file-table__header">
        <label className="file-table__select-all">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(input) => {
              if (input) {
                input.indeterminate = !allSelected && someSelected;
              }
            }}
            onChange={(event) => onToggleSelectAll(event.target.checked)}
          />
          <span>Select</span>
        </label>

        <button type="button" className="file-table__th" onClick={() => onSort("name")}>
          <span>Name</span>
          {renderSortIndicator("name")}
        </button>
        <button type="button" className="file-table__th" onClick={() => onSort("size")}>
          <span>Size</span>
          {renderSortIndicator("size")}
        </button>
        <button type="button" className="file-table__th" onClick={() => onSort("mode")}>
          <span>Mode</span>
          {renderSortIndicator("mode")}
        </button>
        <button type="button" className="file-table__th" onClick={() => onSort("owner")}>
          <span>Owner</span>
          {renderSortIndicator("owner")}
        </button>
        <button type="button" className="file-table__th" onClick={() => onSort("group")}>
          <span>Group</span>
          {renderSortIndicator("group")}
        </button>
        <button type="button" className="file-table__th" onClick={() => onSort("modTime")}>
          <span>Modified</span>
          {renderSortIndicator("modTime")}
        </button>
        <span className="file-table__th file-table__th--actions">Actions</span>
      </div>

      <div className="file-table__body">
        {files.length === 0 ? <div className="empty-state">No files in this directory</div> : null}

        {files.map((file) => {
          const isDir = Boolean(file.isDir ?? file.is_dir);
          const selected = selectedPaths.has(file.path);

          return (
            <div
              key={file.path}
              className={cn("file-table__row", selected && "is-selected")}
              onDoubleClick={() => onOpen(file)}
              role="row"
            >
              <label className="file-table__select">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelection(file)}
                  onClick={(event) => event.stopPropagation()}
                />
              </label>

              <button type="button" className="file-table__name" onClick={() => onOpen(file)}>
                {isDir ? <Folder size={14} /> : <FileText size={14} />}
                <span>{file.name || file.path}</span>
                <small>{file.path}</small>
              </button>

              <span>{isDir ? "-" : formatBytes(file.size ?? 0)}</span>
              <span>{file.mode || "-"}</span>
              <span>{file.owner || "-"}</span>
              <span>{file.group || "-"}</span>
              <span>{formatRemoteTime(file.modTime)}</span>

              <ActionMenu
                file={file}
                onPreview={onPreview}
                onDownload={onDownload}
                onRename={onRename}
                onEdit={onEdit}
                onChmod={onChmod}
                onDelete={onDelete}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
