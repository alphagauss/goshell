import { useEffect, useMemo, useState } from "react";
import { eventPayload, eventsApi } from "@/lib/wails";
import type { FileTask, FileTaskKind } from "@/components/ssh/file-manager/types";

function makeTaskId(kind: FileTaskKind, scope: string) {
  return `${kind}:${scope}`;
}

export function useUploadTasks(connID: string) {
  const [tasks, setTasks] = useState<FileTask[]>([]);

  useEffect(() => {
    const uploadUnsubscribe = eventsApi.on<{ connId?: string; path?: string; progress?: number }>(
      "ssh:upload-progress",
      (event) => {
        const payload = eventPayload(event);
        if (payload.connId && payload.connId !== connID) {
          return;
        }
        const path = payload.path;
        if (!path) {
          return;
        }

        const taskID = makeTaskId("upload", path);
        setTasks((current) =>
          current.some((task) => task.id === taskID)
            ? current.map((task) =>
                task.id === taskID
                  ? {
                      ...task,
                      status: "running",
                      progress: payload.progress ?? task.progress,
                    }
                  : task,
              )
            : [
              ...current,
              {
                id: taskID,
                kind: "upload",
                label: path,
                status: "running",
                progress: payload.progress ?? 0,
              },
            ],
        );
      },
    );

    const directoryUnsubscribe = eventsApi.on<{ stage?: string; progress?: number; message?: string }>(
      "directory-upload-progress",
      (event) => {
        const payload = eventPayload(event);
        const taskID = makeTaskId("directory-upload", connID);
        setTasks((current) =>
          current.some((task) => task.id === taskID)
            ? current.map((task) =>
                task.id === taskID
                  ? {
                      ...task,
                      status: "running",
                      progress: payload.progress ?? task.progress,
                      message: payload.message ?? task.message,
                    }
                  : task,
              )
            : [
                ...current,
                {
                  id: taskID,
                  kind: "directory-upload",
                  label: payload.message ?? "Uploading directory",
                  status: "running",
                  progress: payload.progress ?? 0,
                  message: payload.message,
                },
              ],
        );
      },
    );

    return () => {
      uploadUnsubscribe();
      directoryUnsubscribe();
    };
  }, [connID]);

  function registerTask(kind: FileTaskKind, scope: string, label: string) {
    const id = makeTaskId(kind, scope);
    setTasks((current) => {
      if (current.some((task) => task.id === id)) {
        return current;
      }

      return [...current, { id, kind, label, status: "running", progress: 0 }];
    });
    return id;
  }

  function updateTask(id: string, patch: Partial<Pick<FileTask, "label" | "message" | "progress" | "status">>) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              ...patch,
            }
          : task,
      ),
    );
  }

  function finishTask(id: string, message?: string) {
    updateTask(id, { status: "success", progress: 100, message });
  }

  function failTask(id: string, message: string) {
    updateTask(id, { status: "error", message });
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function clearCompleted() {
    setTasks((current) => current.filter((task) => task.status === "running"));
  }

  const activeTasks = useMemo(() => tasks.filter((task) => task.status === "running"), [tasks]);

  return {
    tasks,
    activeTasks,
    registerTask,
    updateTask,
    finishTask,
    failTask,
    removeTask,
    clearCompleted,
    makeTaskId,
  };
}
