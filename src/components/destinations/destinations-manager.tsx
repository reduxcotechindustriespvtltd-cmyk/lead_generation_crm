"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

export type DestinationRow = {
  id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
};

export function DestinationsManager({ destinations }: { destinations: DestinationRow[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");

  async function patchDestination(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/destinations/${id}`, {
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

  async function deleteDestination(id: string, name: string) {
    if (!confirm(`Delete destination "${name}"?`)) return;
    const res = await fetch(`/api/destinations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Delete failed");
      return;
    }
    toast.success("Destination deleted");
    router.refresh();
  }

  async function createDestination() {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), order: destinations.length }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to create destination");
        return;
      }
      toast.success("Destination created");
      setAddOpen(false);
      setName("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Shown in the gsb-holidays nav &ldquo;Destinations&rdquo; dropdown, in the order below.
        </p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus />
          Add Destination
        </Button>
      </div>

      {destinations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No destinations yet"
          description="Add a destination so packages can be tagged with it."
          size="sm"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinations.map((destination) => (
              <TableRow key={destination.id}>
                <TableCell>
                  <Input
                    defaultValue={destination.name}
                    className="h-8 w-48"
                    onBlur={(e) =>
                      e.target.value.trim() &&
                      e.target.value !== destination.name &&
                      patchDestination(destination.id, { name: e.target.value.trim() })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={destination.order}
                    className="h-8 w-16"
                    onBlur={(e) =>
                      Number(e.target.value) !== destination.order &&
                      patchDestination(destination.id, { order: Number(e.target.value) })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={destination.isActive}
                    onCheckedChange={(checked) => patchDestination(destination.id, { isActive: checked })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteDestination(destination.id, destination.name)}
                  >
                    <Trash2 className="text-destructive size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a destination</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Matheran" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createDestination} disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
