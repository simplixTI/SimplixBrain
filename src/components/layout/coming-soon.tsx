import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-lg border border-dashed border-border/70 bg-card/30 px-6 py-16 text-center">
        <p className="text-sm font-medium">Módulo em construção.</p>
        <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">
          Nesta primeira etapa apenas o Dashboard está implementado. Os demais
          módulos serão liberados nas próximas rodadas seguindo o roadmap do MVP.
        </p>
      </div>
    </div>
  );
}
