import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { FileInfo } from "@/types";
import { formatBytes, formatRemoteTime } from "@/components/ssh/file-manager/utils";

export function FilePreview({
  open,
  file,
  content,
  loading,
  binary,
  onOpenChange,
  onDownload,
  onEdit,
  onRename,
  onChmod,
  onDelete,
}: {
  open: boolean;
  file: FileInfo | null;
  content: string;
  loading: boolean;
  binary: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  onEdit: () => void;
  onRename: () => void;
  onChmod: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={file ? file.name || file.path : "File preview"}>
        <div className="file-preview">
          {file ? (
            <div className="file-preview__meta">
              <div>
                <span>Path</span>
                <strong>{file.path}</strong>
              </div>
              <div>
                <span>Size</span>
                <strong>{file.isDir || file.is_dir ? "-" : formatBytes(file.size ?? 0)}</strong>
              </div>
              <div>
                <span>Mode</span>
                <strong>{file.mode || "-"}</strong>
              </div>
              <div>
                <span>Owner</span>
                <strong>{file.owner || "-"}</strong>
              </div>
              <div>
                <span>Group</span>
                <strong>{file.group || "-"}</strong>
              </div>
              <div>
                <span>Modified</span>
                <strong>{formatRemoteTime(file.modTime)}</strong>
              </div>
            </div>
          ) : null}

          <div className="file-preview__content">
            {loading ? (
              <div className="empty-state">Loading preview...</div>
            ) : binary ? (
              <div className="empty-state">Binary file preview is not available.</div>
            ) : (
              <pre>{content}</pre>
            )}
          </div>

          <div className="dialog-actions file-preview__actions">
            <Button variant="secondary" onClick={onDownload}>
              Download
            </Button>
            <Button variant="secondary" onClick={onRename}>
              Rename
            </Button>
            <Button variant="secondary" onClick={onChmod}>
              Permissions
            </Button>
            {file && !(file.isDir || file.is_dir) ? (
              <Button variant="primary" onClick={onEdit}>
                Edit
              </Button>
            ) : null}
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
