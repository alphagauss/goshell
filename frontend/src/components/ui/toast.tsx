import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ToastTone = "info" | "success" | "warning" | "danger";

interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastInput, "title">> {
  id: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (toast: ToastInput) => string;
  success: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toneIcon(tone: ToastTone) {
  if (tone === "success") return <CheckCircle2 size={16} />;
  if (tone === "warning") return <TriangleAlert size={16} />;
  if (tone === "danger") return <CircleAlert size={16} />;
  return <Info size={16} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    for (const timer of timers.current.values()) {
      window.clearTimeout(timer);
    }
    timers.current.clear();
    setToasts([]);
  }, []);

  const show = useCallback(
    (toast: ToastInput) => {
      const id = createId();
      const next: ToastItem = {
        id,
        title: toast.title,
        description: toast.description,
        tone: toast.tone ?? "info",
      };

      setToasts((current) => [next, ...current].slice(0, 4));

      const duration = toast.duration ?? 4000;
      const timer = window.setTimeout(() => {
        dismiss(id);
      }, duration);
      timers.current.set(id, timer);

      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (title, description) => show({ title, description, tone: "success" }),
      info: (title, description) => show({ title, description, tone: "info" }),
      warning: (title, description) => show({ title, description, tone: "warning" }),
      error: (title, description) => show({ title, description, tone: "danger" }),
      dismiss,
      clear,
    }),
    [clear, dismiss, show],
  );

  useEffect(() => clear, [clear]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions removals">
        {toasts.map((toast) => (
          <article key={toast.id} className={`toast-item toast-item--${toast.tone}`}>
            <div className="toast-item__icon">{toneIcon(toast.tone)}</div>
            <div className="toast-item__body">
              <strong>{toast.title}</strong>
              {toast.description ? <p>{toast.description}</p> : null}
            </div>
            <Button
              aria-label="关闭提示"
              size="icon"
              variant="ghost"
              onClick={() => dismiss(toast.id)}
            >
              <X size={14} />
            </Button>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
