"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibleNavItems, type NavItem } from "@/components/layout/nav-items";
import type { UserRole } from "@/generated/prisma/client";

function isItemActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function NavLink({
  item,
  isActive,
  onNavigate,
  indent,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
  indent?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        indent && "ml-3",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem & { children: NavItem[] };
  pathname: string;
  onNavigate?: () => void;
}) {
  const hasActiveChild = item.children.some((child) => isItemActive(pathname, child.href));
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <NavLink
              key={child.href}
              item={child}
              isActive={isItemActive(pathname, child.href)}
              onNavigate={onNavigate}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarNav({
  role,
  orgName,
  logoUrl,
  onNavigate,
}: {
  role: UserRole;
  orgName: string;
  logoUrl: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = visibleNavItems(role);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo URL is arbitrary/external, not known at build time
            <img src={logoUrl} alt={orgName} className="size-[26px] rounded-md object-contain" />
          ) : (
            <Building2 className="text-muted-foreground size-4.5" />
          )}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">{orgName}</p>
          <p className="text-muted-foreground text-xs">CRM</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) =>
          item.children ? (
            <NavGroup
              key={item.href}
              item={item as NavItem & { children: NavItem[] }}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ) : (
            <NavLink
              key={item.href}
              item={item}
              isActive={isItemActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          )
        )}
      </nav>
      <div className="text-muted-foreground border-t p-3 text-xs">Internal tool</div>
    </div>
  );
}
