import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrgSettings } from "@/lib/queries/org-settings";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { SessionKeepAlive } from "@/components/auth/session-keep-alive";
import { CommandPalette } from "@/components/command-palette";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login");
  }

  const [user, org] = await Promise.all([
    db.user.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, isActive: true },
    }),
    getOrgSettings(),
  ]);

  if (!user || !user.isActive) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 border-r lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarNav role={user.role} orgName={org.name} logoUrl={org.logoUrl} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} orgName={org.name} logoUrl={org.logoUrl} />
        <main className="bg-muted/20 flex-1 p-4 md:p-6">{children}</main>
      </div>
      <SessionKeepAlive />
      <CommandPalette role={user.role} />
    </div>
  );
}
