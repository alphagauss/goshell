import type * as React from "react";
import { cn } from "@/lib/utils";

export function StatusLine({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "success" | "danger" | "warning";
  children: React.ReactNode;
}) {
  if (!children) return null;

  return <div className={cn("status-line", `status-line--${tone}`)}>{children}</div>;
}
