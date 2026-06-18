import type { BuiltInContextMenuItem, GetTabContextMenuItemsParams, ReactContextMenuItemConfig } from "dockview-react";
import type { WorkspacePanelParams, WorkspacePanelType } from "@/components/ssh/layout/panelRegistry";

export function createWorkspaceContextMenu({
  openTerminal,
  closePanelsByType,
}: {
  openTerminal: (connID: string) => void;
  closePanelsByType: (panelType: WorkspacePanelType) => void;
}) {
  return (params: GetTabContextMenuItemsParams) => {
    const panelParams = params.panel.api.getParameters<WorkspacePanelParams>();
    const items: Array<BuiltInContextMenuItem | ReactContextMenuItemConfig> = [
      "close",
      "closeOthers",
      "separator",
    ];

    if (panelParams.panelType === "terminal") {
      items.push({
        label: "新建终端",
        action: () => openTerminal(panelParams.connID),
      });
    }

    items.push({
      label: "关闭同类型全部",
      action: () => closePanelsByType(panelParams.panelType),
    });
    items.push("closeAll");
    return items;
  };
}
