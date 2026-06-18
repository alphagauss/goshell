import type { FileInfo } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function PermissionEditor({
  open,
  file,
  mode,
  onModeChange,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  file: FileInfo | null;
  mode: string;
  onModeChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Permissions">
        <div className="permission-editor">
          <p className="text-secondary">
            {file ? `Apply chmod to ${file.path}` : "Apply chmod to selected item"}
          </p>
          <label className="permission-editor__field">
            <span>Mode</span>
            <input
              className="input-base"
              value={mode}
              placeholder="755 or u+rw"
              onChange={(event) => onModeChange(event.target.value)}
            />
          </label>
          <p className="permission-editor__hint">Examples: 755, 644, u+rw, g-w</p>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onApply} disabled={!mode.trim() || !file}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
