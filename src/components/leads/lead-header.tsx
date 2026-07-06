"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, Mail, MessageCircle, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { SourceBadge } from "@/components/leads/source-badge";

type Option = { id: string; name: string };
type StatusOption = { id: string; name: string; color: string };

export function LeadHeader({
  lead,
  statuses,
  users,
  canReassign,
}: {
  lead: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    city: string | null;
    state: string | null;
    statusId: string;
    assignedTo: { id: string; name: string } | null;
    source: string;
    campaignName: string | null;
    adSetName: string | null;
    adName: string | null;
    formName: string | null;
  };
  statuses: StatusOption[];
  users: Option[];
  canReassign: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: lead.fullName,
    phone: lead.phone,
    email: lead.email ?? "",
    city: lead.city ?? "",
    state: lead.state ?? "",
  });

  async function patch(data: Record<string, unknown>) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Update failed");
      return false;
    }
    router.refresh();
    return true;
  }

  async function saveEdit() {
    setIsSubmitting(true);
    const ok = await patch(form);
    setIsSubmitting(false);
    if (ok) {
      toast.success("Lead updated");
      setEditOpen(false);
    }
  }

  return (
    <div className="bg-card flex flex-col gap-4 rounded-lg border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{lead.fullName}</h1>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3.5" />
            </Button>
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
            <SourceBadge source={lead.source} />
            {lead.city && (
              <span>
                {lead.city}
                {lead.state ? `, ${lead.state}` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={lead.statusId} onValueChange={(v) => patch({ statusId: v })}>
            <SelectTrigger className="w-[160px]">
              <SelectValue>
                {(() => {
                  const current = statuses.find((s) => s.id === lead.statusId);
                  return current ? (
                    <LeadStatusBadge name={current.name} color={current.color} />
                  ) : null;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canReassign ? (
            <Select
              value={lead.assignedTo?.id ?? "unassigned"}
              onValueChange={(v) => patch({ assignedToId: v === "unassigned" ? null : v })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Unassigned">
                  {lead.assignedTo?.name ?? "Unassigned"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground text-sm">
              {lead.assignedTo?.name ?? "Unassigned"}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={`tel:${lead.phone}`} />}
        >
          <Phone className="size-3.5" />
          {lead.phone}
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <a
              href={`https://wa.me/91${lead.phone.replace(/\D/g, "").slice(-10)}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <MessageCircle className="size-3.5" />
          WhatsApp
        </Button>
        {lead.email && (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={`mailto:${lead.email}`} />}
          >
            <Mail className="size-3.5" />
            {lead.email}
          </Button>
        )}
      </div>

      {(lead.campaignName || lead.adSetName || lead.adName || lead.formName) && (
        <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs">Campaign</p>
            <p className="truncate font-medium">{lead.campaignName ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Ad Set</p>
            <p className="truncate font-medium">{lead.adSetName ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Ad</p>
            <p className="truncate font-medium">{lead.adName ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Form</p>
            <p className="truncate font-medium">{lead.formName ?? "—"}</p>
          </div>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit lead details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
