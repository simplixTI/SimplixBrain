import type { LucideIcon } from "lucide-react";
import {
  Brain,
  CalendarClock,
  CheckSquare,
  Compass,
  FileText,
  History,
  LayoutDashboard,
  Lightbulb,
  Network,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  hint?: string;
}

export const primaryNav: NavItem[] = [
  { label: "Brain", href: "/", icon: Network },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projetos", href: "/projects", icon: Compass },
  { label: "Notas", href: "/notes", icon: FileText },
  { label: "Tarefas", href: "/tasks", icon: CheckSquare },
  { label: "Ideias", href: "/ideas", icon: Lightbulb },
  { label: "Decisões", href: "/decisions", icon: Brain },
  { label: "Reuniões", href: "/meetings", icon: CalendarClock },
  { label: "Timeline", href: "/timeline", icon: History },
];

export const secondaryNav: NavItem[] = [
  { label: "Configurações", href: "/settings", icon: Settings },
];
