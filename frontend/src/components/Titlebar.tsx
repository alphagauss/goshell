import { Maximize2, Minimize2, X } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { windowApi } from "@/lib/wails";

export function Titlebar({
  title,
  children,
  leading,
}: {
  title: string;
  children?: React.ReactNode;
  leading?: React.ReactNode;
}) {
  const [isMaximised, setIsMaximised] = useState(false);

  useEffect(() => {
    let disposed = false;
    async function syncWindowState() {
      try {
        const next = await windowApi.isMaximised();
        if (!disposed) setIsMaximised(Boolean(next));
      } catch {
        if (!disposed) setIsMaximised(false);
      }
    }

    void syncWindowState();
    const timer = window.setInterval(() => void syncWindowState(), 500);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  async function toggleMaximise() {
    if (isMaximised) {
      await windowApi.restore();
      setIsMaximised(false);
      return;
    }

    await windowApi.maximise();
    setIsMaximised(true);
  }

  return (
    <header className="titlebar">
      <div className="titlebar-main">
        {leading ?? <h1>{title}</h1>}
        {children}
      </div>
      <div className="window-controls">
        <WindowButton label="最小化" onClick={() => void windowApi.minimise()}>
          <Minimize2 size={15} />
        </WindowButton>
        <WindowButton label={isMaximised ? "恢复" : "最大化"} onClick={() => void toggleMaximise()}>
          <Maximize2 size={15} />
        </WindowButton>
        <WindowButton label="关闭" onClick={() => void windowApi.close()}>
          <X size={15} />
        </WindowButton>
      </div>
    </header>
  );
}

function WindowButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={label} size="icon" variant="ghost" onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
