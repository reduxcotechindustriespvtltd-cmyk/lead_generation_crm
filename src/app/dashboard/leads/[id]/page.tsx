import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getLeadDetail, type LeadScope } from "@/lib/queries/leads";
import { LeadHeader } from "@/components/leads/lead-header";
import { LeadTimeline } from "@/components/leads/lead-timeline";
import { LeadNotes } from "@/components/leads/lead-notes";
import { LeadFollowUps } from "@/components/leads/lead-follow-ups";
import { LeadBookingHistory } from "@/components/leads/lead-booking-history";
import { LeadWhatsAppChat } from "@/components/leads/lead-whatsapp-chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCurrentUser();
  const scope: LeadScope =
    session?.role === "SALES_EXECUTIVE" ? { forcedAssignedToId: session.sub } : {};

  const [lead, statuses, users, activeWhatsAppAccountCount] = await Promise.all([
    getLeadDetail(id, scope),
    db.leadStatus.findMany({ orderBy: { order: "asc" } }),
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.whatsAppAccount.count({ where: { isActive: true } }),
  ]);

  if (!lead || !session) notFound();

  const timeline = (
    <LeadTimeline
      activities={lead.activities.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        createdAt: a.createdAt.toISOString(),
        user: a.user,
      }))}
    />
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <LeadHeader lead={lead} statuses={statuses} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <LeadNotes
            leadId={lead.id}
            notes={lead.notes.map((n) => ({
              id: n.id,
              content: n.content,
              createdAt: n.createdAt.toISOString(),
              userId: n.userId,
              user: n.user,
            }))}
            users={users}
            currentUserId={session.sub}
          />
          <LeadFollowUps
            leadId={lead.id}
            followUps={lead.followUps.map((f) => ({
              id: f.id,
              dueAt: f.dueAt.toISOString(),
              note: f.note,
              status: f.status,
            }))}
          />
          <LeadBookingHistory
            bookings={lead.bookings.map((b) => ({
              id: b.id,
              checkInDate: b.checkInDate.toISOString(),
              checkOutDate: b.checkOutDate.toISOString(),
              adultCount: b.adultCount,
              kidsCount: b.kidsCount,
              status: b.status,
              totalRevenue: b.totalRevenue.toString(),
              packageName: b.packageName,
            }))}
          />
        </div>
        {activeWhatsAppAccountCount > 0 ? (
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline">{timeline}</TabsContent>
            <TabsContent value="whatsapp">
              <LeadWhatsAppChat
                leadId={lead.id}
                initialMessages={lead.whatsAppMessages.map((m) => ({
                  id: m.id,
                  direction: m.direction,
                  content: m.content,
                  status: m.status,
                  errorMessage: m.errorMessage,
                  createdAt: m.createdAt.toISOString(),
                  sentBy: m.sentBy,
                }))}
              />
            </TabsContent>
          </Tabs>
        ) : (
          timeline
        )}
      </div>
    </div>
  );
}
