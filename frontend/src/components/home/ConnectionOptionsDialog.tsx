import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type ConnectionOpenChoice = "default" | "new";

export function ConnectionOptionsDialog({
  open,
  onSelect,
  onCancel,
}: {
  open: boolean;
  onSelect: (choice: ConnectionOpenChoice) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent title="连接打开方式">
        <div className="dialog-body">
          <p>当前已有连接窗口，选择这次连接要加入默认分组还是新窗口。</p>
        </div>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button variant="secondary" onClick={() => onSelect("default")}>
            默认分组
          </Button>
          <Button variant="primary" onClick={() => onSelect("new")}>
            新窗口
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
