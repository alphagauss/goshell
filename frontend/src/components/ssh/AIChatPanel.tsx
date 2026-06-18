import { AIChatWorkspacePanel } from "@/components/ssh/ai/AIChatPanel";

export function AIChatPanel({ connID }: { connID: string }) {
  return <AIChatWorkspacePanel connID={connID} />;
}
