import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const close = useCallback((value: boolean) => {
    setRequest((current) => {
      if (current) {
        current.resolve(value);
      }
      return null;
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ ...options, resolve });
    });
  }, []);

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog open={Boolean(request)} onOpenChange={(open) => !open && close(false)}>
        <DialogContent title={request?.title ?? "确认操作"}>
          <div className="dialog-body">
            <p>{request?.description ?? "确定继续吗？"}</p>
          </div>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => close(false)}>
              {request?.cancelText ?? "取消"}
            </Button>
            <Button variant={request?.danger ? "danger" : "primary"} onClick={() => close(true)}>
              {request?.confirmText ?? "确认"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return context.confirm;
}
