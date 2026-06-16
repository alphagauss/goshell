import { Maximize2, Minimize2, X } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { windowApi } from "@/lib/wails";

export function Titlebar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="titlebar">
      <div className="titlebar-main">
        <h1>{title}</h1>
        {children}
      </div>
      <div className="window-controls">
        <WindowButton label="最小化" onClick={() => void windowApi.minimise()}>
          <Minimize2 size={15} />
        </WindowButton>
        <WindowButton label="最大化" onClick={() => void windowApi.maximise()}>
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
