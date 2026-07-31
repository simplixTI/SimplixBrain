import { Badge } from "@/components/ui/badge";
import {
  DECISION_STATUS_LABEL,
  type DecisionStatus,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<DecisionStatus, string> = {
  proposed: "bg-[hsl(var(--hue-cyan)/0.18)] text-[hsl(var(--hue-cyan))]",
  approved: "bg-[hsl(var(--hue-lime)/0.2)] text-[hsl(var(--hue-lime))]",
  rejected: "bg-[hsl(var(--hue-rose)/0.2)] text-[hsl(var(--hue-rose))]",
  superseded: "bg-[hsl(var(--hue-amber)/0.18)] text-[hsl(var(--hue-amber))]",
};

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  return (
    <Badge className={cn("border-transparent", STATUS_TONE[status])}>
      {DECISION_STATUS_LABEL[status]}
    </Badge>
  );
}
