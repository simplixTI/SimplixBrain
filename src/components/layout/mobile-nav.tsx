"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { primaryNav } from "./nav-config";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const items = primaryNav.slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border/60 bg-background/95 py-2 backdrop-blur md:hidden">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md px-3 py-1 text-[10px] font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
