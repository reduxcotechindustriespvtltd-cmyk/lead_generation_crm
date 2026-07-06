"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LeadStatus = {
  id: string;
  name: string;
  color: string;
  order: number;
  isFinal: boolean;
  isWon: boolean;
};

export function LeadStatusesManager({ statuses }: { statuses: LeadStatus[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    color: "#6b7280",
    order: statuses.length,
    isFinal: false,
    isWon: false,
  });

  async function patchStatus(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/lead-statuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Update failed");
      return;
    }
    router.refresh();
  }

  async function deleteStatus(id: string, name: string) {
    if (!confirm(`Delete status "${name}"?`)) return;
    const res = await fetch(`/api/lead-statuses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Delete failed");
      return;
    }
    toast.success("Status deleted");
    router.refresh();
  }

  async function createStatus() {
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to create status");
        return;
      }
      toast.success("Status created");
      setAddOpen(false);
      setForm({
        name: "",
        color: "#6b7280",
        order: statuses.length + 1,
        isFinal: false,
        isWon: false,
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Lead Statuses</CardTitle>
          <CardDescription>Configure the pipeline stages leads move through.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus />
          Add Status
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Final Stage</TableHead>
              <TableHead>Counts as Won</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((status) => (
              <TableRow key={status.id}>
                <TableCell>
                  <input
                    type="color"
                    defaultValue={status.color}
                    className="size-7 cursor-pointer rounded border"
                    onBlur={(e) =>
                      e.target.value !== status.color &&
                      patchStatus(status.id, { color: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    defaultValue={status.name}
                    className="h-8 w-40"
                    onBlur={(e) =>
                      e.target.value.trim() &&
                      e.target.value !== status.name &&
                      patchStatus(status.id, { name: e.target.value.trim() })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={status.order}
                    className="h-8 w-16"
                    onBlur={(e) =>
                      Number(e.target.value) !== status.order &&
                      patchStatus(status.id, { order: Number(e.target.value) })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={status.isFinal}
                    onCheckedChange={(checked) => patchStatus(status.id, { isFinal: checked })}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={status.isWon}
                    onCheckedChange={(checked) => patchStatus(status.id, { isWon: checked })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteStatus(status.id, status.name)}
                  >
                    <Trash2 className="text-destructive size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a lead status</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-9 w-16 cursor-pointer rounded border"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Final stage (no further movement)</Label>
              <Switch
                checked={form.isFinal}
                onCheckedChange={(checked) => setForm({ ...form, isFinal: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Counts as won / converted</Label>
              <Switch
                checked={form.isWon}
                onCheckedChange={(checked) => setForm({ ...form, isWon: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createStatus} disabled={isSubmitting || !form.name.trim()}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
