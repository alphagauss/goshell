import { Check, Clock3, Loader2, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileTask } from "@/components/ssh/file-manager/types";
import { cn } from "@/lib/utils";

export function UploadTaskPanel({
  tasks,
  onClearCompleted,
  onRemove,
}: {
  tasks: FileTask[];
  onClearCompleted: () => void;
  onRemove: (taskID: string) => void;
}) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <section className="upload-task-panel">
      <div className="upload-task-panel__heading">
        <h3>Tasks</h3>
        <Button size="sm" variant="ghost" onClick={onClearCompleted}>
          <Trash2 size={14} />
          <span>Clear Completed</span>
        </Button>
      </div>

      <div className="upload-task-panel__list">
        {tasks.map((task) => (
          <div key={task.id} className={cn("upload-task-panel__item", `is-${task.status}`)}>
            <div className="upload-task-panel__meta">
              {task.status === "running" ? <Loader2 size={14} className="is-spinning" /> : null}
              {task.status === "success" ? <Check size={14} /> : null}
              {task.status === "error" ? <XCircle size={14} /> : null}
              {task.status === "pending" ? <Clock3 size={14} /> : null}
              <div>
                <strong>{task.label}</strong>
                {task.message ? <span>{task.message}</span> : null}
              </div>
            </div>
            <div className="upload-task-panel__progress">
              <div className="upload-task-panel__bar">
                <div className="upload-task-panel__fill" style={{ width: `${Math.max(0, Math.min(task.progress, 100))}%` }} />
              </div>
              <span>{Math.round(task.progress)}%</span>
            </div>
            <Button size="icon" variant="ghost" title="Remove task" onClick={() => onRemove(task.id)}>
              <XCircle size={14} />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
