"use client";

import { Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/hooks/use-command-palette";

import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const openPalette = useCommandPalette((s) => s.setOpen);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-md md:px-6">
      <div className="md:hidden">
        <Logo showWordmark={false} />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="hidden h-9 max-w-md flex-1 justify-between gap-2 border-border/70 bg-card/60 px-3 text-muted-foreground shadow-sm hover:border-primary/40 hover:bg-card md:flex"
        onClick={() => openPalette(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Buscar em tudo…
        </span>
        <kbd className="text-mono hidden items-center gap-0.5 rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-inner sm:inline-flex">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => openPalette(true)}
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
      </Button>
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <Avatar className="h-8 w-8 border border-primary/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[11px] font-semibold text-white">
            BR
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
