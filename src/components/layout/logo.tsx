import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2.5 text-sm font-semibold tracking-tight",
        className,
      )}
      aria-label="SimplixBrain"
    >
      <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 text-white shadow-[0_0_18px_-4px_rgba(139,92,246,0.9)]">
        <span aria-hidden className="text-[13px] font-bold leading-none tracking-tight">
          SB
        </span>
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]"
        />
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-cyan-300/80 blur-[2px]"
        />
      </span>
      {showWordmark ? (
        <span className="flex flex-col leading-tight">
          <span className="text-display text-[15px] font-semibold">
            SimplixBrain
          </span>
          <span className="text-mono text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            workspace
          </span>
        </span>
      ) : null}
    </Link>
  );
}
