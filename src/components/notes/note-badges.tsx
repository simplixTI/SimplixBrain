import { Badge } from "@/components/ui/badge";
import { NOTE_TYPE_LABEL, type NoteType } from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

const TYPE_TONE: Record<NoteType, string> = {
  general: "bg-muted text-muted-foreground",
  technical: "bg-sky-500/15 text-sky-400",
  commercial: "bg-emerald-500/15 text-emerald-400",
  strategic: "bg-violet-500/15 text-violet-400",
  research: "bg-amber-500/15 text-amber-500",
  reference: "bg-indigo-500/15 text-indigo-400",
  draft: "bg-muted text-muted-foreground",
};

export function NoteTypeBadge({ type }: { type: NoteType }) {
  return (
    <Badge className={cn("border-transparent", TYPE_TONE[type])}>
      {NOTE_TYPE_LABEL[type]}
    </Badge>
  );
}
