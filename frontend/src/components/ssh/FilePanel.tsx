import { FileManagerPanel } from "@/components/ssh/file-manager/FileManagerPanel";

export function FilePanel({ connID }: { connID: string }) {
  return <FileManagerPanel connID={connID} />;
}
