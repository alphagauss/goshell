import { ChevronRight, FolderPlus, RefreshCcw, Search, Upload, Download, Trash2, ArrowUp, FilterX, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FileToolbar({
  pathSegments,
  searchValue,
  selectedCount,
  searching,
  onSearchValueChange,
  onSearchSubmit,
  onCancelSearch,
  onNavigate,
  onRefresh,
  onParent,
  onCreateFolder,
  onUploadFiles,
  onUploadFolder,
  onDownloadSelected,
  onDeleteSelected,
}: {
  pathSegments: Array<{ label: string; path: string }>;
  searchValue: string;
  selectedCount: number;
  searching: boolean;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: () => void;
  onCancelSearch: () => void;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  onParent: () => void;
  onCreateFolder: () => void;
  onUploadFiles: () => void;
  onUploadFolder: () => void;
  onDownloadSelected: () => void;
  onDeleteSelected: () => void;
}) {
  return (
    <div className="file-toolbar">
      <div className="file-toolbar__breadcrumbs">
        {pathSegments.map((segment, index) => (
          <button
            key={segment.path}
            type="button"
            className={cn("file-toolbar__crumb", index === pathSegments.length - 1 && "is-current")}
            onClick={() => onNavigate(segment.path)}
          >
            {segment.label}
            {index < pathSegments.length - 1 ? <ChevronRight size={12} /> : null}
          </button>
        ))}
      </div>

      <div className="file-toolbar__search">
        <Search size={14} />
        <input
          className="input-base file-toolbar__search-input"
          value={searchValue}
          placeholder="Search current directory or press Enter for recursive search"
          onChange={(event) => onSearchValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSearchSubmit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onCancelSearch();
            }
          }}
        />
        {searchValue ? (
          <Button size="icon" variant="ghost" title="Clear search" onClick={onCancelSearch}>
            <FilterX size={14} />
          </Button>
        ) : null}
      </div>

      <div className="file-toolbar__actions">
        <Button size="sm" variant="secondary" onClick={onParent}>
          <ArrowUp size={14} />
          <span>Up</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={onRefresh}>
          <RefreshCcw size={14} />
          <span>Refresh</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={onCreateFolder}>
          <FolderPlus size={14} />
          <span>New Folder</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={onUploadFiles}>
          <Upload size={14} />
          <span>Upload File</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={onUploadFolder}>
          <UploadCloud size={14} />
          <span>Upload Dir</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={onDownloadSelected} disabled={selectedCount === 0}>
          <Download size={14} />
          <span>Download {selectedCount > 0 ? `(${selectedCount})` : ""}</span>
        </Button>
        <Button size="sm" variant="danger" onClick={onDeleteSelected} disabled={selectedCount === 0}>
          <Trash2 size={14} />
          <span>Delete {selectedCount > 0 ? `(${selectedCount})` : ""}</span>
        </Button>
      </div>

      <div className="file-toolbar__status">
        <span>{selectedCount} selected</span>
        {searching ? <span>Searching...</span> : null}
      </div>
    </div>
  );
}
