import { Badge } from "@/components/ui/badge";
import {
  PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  type Priority,
  type TaskStatus,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<TaskStatus, string> = {
  backlog: "bg-[hsl(var(--muted))] text-muted-foreground",
  todo: "bg-[hsl(var(--hue-cyan)/0.18)] text-[hsl(var(--hue-cyan))]",
  in_progress: "bg-[hsl(var(--hue-indigo)/0.2)] text-[hsl(var(--hue-indigo))]",
  blocked: "bg-[hsl(var(--hue-amber)/0.18)] text-[hsl(var(--hue-amber))]",
  done: "bg-[hsl(var(--hue-lime)/0.18)] text-[hsl(var(--hue-lime))]",
  cancelled: "bg-muted text-muted-foreground line-through",
};

const PRIORITY_TONE: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-[hsl(var(--hue-cyan)/0.18)] text-[hsl(var(--hue-cyan))]",
  high: "bg-[hsl(var(--hue-amber)/0.2)] text-[hsl(var(--hue-amber))]",
  critical: "bg-[hsl(var(--hue-rose)/0.2)] text-[hsl(var(--hue-rose))] font-semibold",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge className={cn("border-transparent", STATUS_TONE[status])}>
      {TASK_STATUS_LABEL[status]}
    </Badge>
  );
}

export function TaskPriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge className={cn("border-transparent", PRIORITY_TONE[priority])}>
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}
