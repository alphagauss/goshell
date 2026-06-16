import React from "react";
import ReactDOM from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "@/App";
import "@/styles/theme.css";
import "@/styles/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={350}>
      <App />
    </TooltipProvider>
  </React.StrictMode>,
);
