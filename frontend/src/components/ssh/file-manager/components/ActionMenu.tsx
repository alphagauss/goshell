import { Download, Eye, FilePenLine, KeyRound, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileInfo } from "@/types";

export function ActionMenu({
  file,
  onPreview,
  onDownload,
  onEdit,
  onRename,
  onChmod,
  onDelete,
}: {
  file: FileInfo;
  onPreview?: (file: FileInfo) => void;
  onDownload?: (file: FileInfo) => void;
  onEdit?: (file: FileInfo) => void;
  onRename?: (file: FileInfo) => void;
  onChmod?: (file: FileInfo) => void;
  onDelete?: (file: FileInfo) => void;
}) {
  return (
    <div className="file-action-menu">
      {onPreview ? (
        <Button size="icon" variant="ghost" title="Preview" onClick={() => onPreview(file)}>
          <Eye size={14} />
        </Button>
      ) : null}
      {onDownload ? (
        <Button size="icon" variant="ghost" title="Download" onClick={() => onDownload(file)}>
          <Download size={14} />
        </Button>
      ) : null}
      {onRename ? (
        <Button size="icon" variant="ghost" title="Rename" onClick={() => onRename(file)}>
          <PencilLine size={14} />
        </Button>
      ) : null}
      {onEdit ? (
        <Button size="icon" variant="ghost" title="Edit" onClick={() => onEdit(file)}>
          <FilePenLine size={14} />
        </Button>
      ) : null}
      {onChmod ? (
        <Button size="icon" variant="ghost" title="Permissions" onClick={() => onChmod(file)}>
          <KeyRound size={14} />
        </Button>
      ) : null}
      {onDelete ? (
        <Button size="icon" variant="ghost" title="Delete" onClick={() => onDelete(file)}>
          <Trash2 size={14} />
        </Button>
      ) : null}
    </div>
  );
}
