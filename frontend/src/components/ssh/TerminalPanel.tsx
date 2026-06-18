import { ClassicTerminalView } from "@/components/ssh/terminal/ClassicTerminalView";

export function TerminalPanel({
  connID,
  sessionID,
  isAI = false,
}: {
  connID: string;
  sessionID: string;
  isAI?: boolean;
}) {
  return <ClassicTerminalView connID={connID} sessionID={sessionID} isAI={isAI} />;
}
