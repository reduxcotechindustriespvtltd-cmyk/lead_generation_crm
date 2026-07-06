"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibleNavItems } from "@/components/layout/nav-items";
import type { UserRole } from "@/generated/prisma/client";

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
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="text-muted-foreground border-t p-3 text-xs">Internal tool</div>
    </div>
  );
}
