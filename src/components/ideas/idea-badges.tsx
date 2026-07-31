import { Badge } from "@/components/ui/badge";
import {
  IDEA_EFFORT_LABEL,
  IDEA_POTENTIAL_LABEL,
  IDEA_STATUS_LABEL,
  type IdeaEffort,
  type IdeaPotential,
  type IdeaStatus,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<IdeaStatus, string> = {
  new: "bg-[hsl(var(--hue-cyan)/0.18)] text-[hsl(var(--hue-cyan))]",
  evaluating: "bg-[hsl(var(--hue-amber)/0.2)] text-[hsl(var(--hue-amber))]",
  planned: "bg-[hsl(var(--hue-indigo)/0.2)] text-[hsl(var(--hue-indigo))]",
  in_progress: "bg-[hsl(var(--hue-fuchsia)/0.2)] text-[hsl(var(--hue-fuchsia))]",
  discarded: "bg-muted text-muted-foreground line-through",
  implemented: "bg-[hsl(var(--hue-lime)/0.2)] text-[hsl(var(--hue-lime))]",
};

const POTENTIAL_TONE: Record<IdeaPotential, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-[hsl(var(--hue-cyan)/0.15)] text-[hsl(var(--hue-cyan))]",
  high: "bg-[hsl(var(--hue-amber)/0.18)] text-[hsl(var(--hue-amber))]",
  very_high:
    "bg-[hsl(var(--hue-fuchsia)/0.2)] text-[hsl(var(--hue-fuchsia))] font-semibold",
};

export function IdeaStatusBadge({ status }: { status: IdeaStatus }) {
  return (
    <Badge className={cn("border-transparent", STATUS_TONE[status])}>
      {IDEA_STATUS_LABEL[status]}
    </Badge>
  );
}

export function IdeaPotentialBadge({ potential }: { potential: IdeaPotential }) {
  return (
    <Badge className={cn("border-transparent", POTENTIAL_TONE[potential])}>
      Potencial: {IDEA_POTENTIAL_LABEL[potential]}
    </Badge>
  );
}

export function IdeaEffortBadge({ effort }: { effort: IdeaEffort }) {
  return (
    <Badge variant="outline" className="border-border/70 text-[10px]">
      Esforço {IDEA_EFFORT_LABEL[effort]}
    </Badge>
  );
}
