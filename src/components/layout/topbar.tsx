import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { SearchTrigger } from "@/components/layout/search-trigger";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import type { UserRole } from "@/generated/prisma/client";

export function Topbar({
  user,
  orgName,
  logoUrl,
}: {
  user: { name: string; email: string; role: UserRole; avatarUrl?: string | null };
  orgName: string;
  logoUrl: string | null;
}) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <MobileSidebar role={user.role} orgName={orgName} logoUrl={logoUrl} />
        <SearchTrigger />
      </div>
      <div className="flex items-center gap-1">
        <NotificationsBell />
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
