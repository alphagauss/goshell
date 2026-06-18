import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { FileInfo } from "@/types";
import { FileCodeEditor } from "@/components/ssh/file-manager/components/FileCodeEditor";

export function FileEditorDialog({
  open,
  file,
  value,
  onValueChange,
  onOpenChange,
  onSave,
  saving,
}: {
  open: boolean;
  file: FileInfo | null;
  value: string;
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={file ? `Edit ${file.name || file.path}` : "Edit file"} className="file-editor-dialog">
        <div className="file-editor">
          {file ? <div className="file-editor__path">{file.path}</div> : null}
          <div className="file-editor__body">
            <FileCodeEditor value={value} onChange={onValueChange} className="file-editor__code" />
          </div>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave} disabled={saving || !file}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
