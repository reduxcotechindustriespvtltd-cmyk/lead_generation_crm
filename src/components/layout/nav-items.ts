import {
  LayoutDashboard,
  Users2,
  CalendarClock,
  BarChart3,
  UserCog,
  Plug,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/generated/prisma/client";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users2 },
  { href: "/dashboard/follow-ups", label: "Follow-ups", icon: CalendarClock },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  { href: "/dashboard/users", label: "Users", icon: UserCog, roles: ["ADMIN"] },
  { href: "/dashboard/integrations", label: "Meta Integration", icon: Plug, roles: ["ADMIN"] },
  { href: "/dashboard/audit-log", label: "Audit Log", icon: ShieldAlert, roles: ["ADMIN"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function visibleNavItems(role: UserRole): NavItem[] {
  return navItems.filter((item) => !item.roles || item.roles.includes(role));
}
