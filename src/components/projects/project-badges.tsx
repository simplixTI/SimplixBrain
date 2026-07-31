import { Badge } from "@/components/ui/badge";
import {
  PRIORITY_LABEL,
  PROJECT_STATUS_LABEL,
  type Priority,
  type ProjectStatus,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

export const STATUS_TONE: Record<ProjectStatus, string> = {
  idea: "bg-muted text-muted-foreground",
  planning: "bg-sky-500/15 text-sky-400",
  active: "bg-emerald-500/15 text-emerald-500",
  paused: "bg-amber-500/15 text-amber-500",
  completed: "bg-violet-500/15 text-violet-400",
  archived: "bg-muted text-muted-foreground",
};

export const PRIORITY_TONE: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-sky-500/15 text-sky-400",
  high: "bg-amber-500/15 text-amber-500",
  critical: "bg-red-500/15 text-red-400",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge className={cn("border-transparent", STATUS_TONE[status])}>
      {PROJECT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge className={cn("border-transparent", PRIORITY_TONE[priority])}>
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}
