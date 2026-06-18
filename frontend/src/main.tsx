import React from "react";
import ReactDOM from "react-dom/client";
import { ConfirmDialogProvider } from "@/components/ui/confirm";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "@/App";
import "@/styles/theme.css";
import "@/styles/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={350}>
      <ToastProvider>
        <ConfirmDialogProvider>
          <App />
        </ConfirmDialogProvider>
      </ToastProvider>
    </TooltipProvider>
  </React.StrictMode>,
);
