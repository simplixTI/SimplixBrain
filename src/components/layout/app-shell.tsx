"use client";

import { useEffect, type ReactNode } from "react";

import { GlobalCommandPalette } from "@/components/search/global-command-palette";
import {
  useCommandPalette,
  useCommandPaletteHotkey,
} from "@/hooks/use-command-palette";
import { ensureSeedData } from "@/lib/database/seed-loader";

import { MobileBottomNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const open = useCommandPalette((s) => s.open);
  const setOpen = useCommandPalette((s) => s.setOpen);
  useCommandPaletteHotkey();

  useEffect(() => {
    ensureSeedData();
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <GlobalCommandPalette open={open} onOpenChange={setOpen} />
    </div>
  );
}
