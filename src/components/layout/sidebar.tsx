"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "./logo";
import { primaryNav, secondaryNav, type NavItem } from "./nav-config";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-foreground shadow-[inset_1px_0_0_hsl(var(--primary)/0.7)]"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      <span className="truncate">{item.label}</span>
      {active ? (
        <span
          aria-hidden
          className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.9)]"
        />
      ) : null}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-card/30 px-3 py-4 backdrop-blur-sm md:flex">
      <div className="px-2 pb-4">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {primaryNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5 border-t border-border/60 pt-3">
        {secondaryNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </aside>
  );
}
