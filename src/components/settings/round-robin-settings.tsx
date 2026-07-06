"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type User = { id: string; name: string; role: string };

export function RoundRobinSettings({
  users,
  initialActive,
  initialMemberIds,
}: {
  users: User[];
  initialActive: boolean;
  initialMemberIds: string[];
}) {
  const [isActive, setIsActive] = useState(initialActive);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set(initialMemberIds));
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleMember(id: string) {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/assignment-rules/default", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive, memberIds: Array.from(memberIds) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save assignment settings");
        return;
      }
      toast.success("Assignment settings saved");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Round Robin Assignment</CardTitle>
        <CardDescription>
          When a Manager or Admin creates or syncs a lead without picking an assignee, rotate it
          automatically between the team members selected below.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Label>Enable round robin</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <label
              key={user.id}
              className="has-[[data-state=checked]]:border-primary flex items-center gap-2.5 rounded-md border p-2.5 text-sm"
            >
              <Checkbox
                checked={memberIds.has(user.id)}
                onCheckedChange={() => toggleMember(user.id)}
              />
              {user.name}
              <span className="text-muted-foreground text-xs">
                ({user.role === "SALES_EXECUTIVE" ? "Sales Executive" : user.role})
              </span>
            </label>
          ))}
        </div>

        <Button onClick={save} disabled={isSubmitting} className="w-fit">
          {isSubmitting && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
